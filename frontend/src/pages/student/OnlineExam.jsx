import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/axios';

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/AD5iLzkdB/';

export default function OnlineExam() {
  const [exam, setExam] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('Waiting to start...');
  const [violations, setViolations] = useState([]);
  
  // Results & Detailed Answer Review State
  const [examResult, setExamResult] = useState(null); // { score, correctCount, totalCount, questions, answers, violations }
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const [model, setModel] = useState(null);
  const [maxPredictions, setMaxPredictions] = useState(0);
  
  const suspiciousFrames = useRef(0);
  const requestRef = useRef();
  
  // Track student's selected answers (e.g. { 0: 'A', 1: 'B' })
  const [answers, setAnswers] = useState({});

  const fetchActiveExam = () => {
    API.get('/exams/active').then(res => {
      if (res.data.success) {
        setExam(res.data.exam);
      } else {
        setStatus('No active exam currently published by Faculty.');
      }
    }).catch(err => setStatus('Error fetching exam'));
  };

  useEffect(() => {
    fetchActiveExam();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isStarted) {
        addViolation('Tab Switched / Focus Lost');
      }
    };
    
    window.addEventListener('blur', () => {
      if (isStarted) addViolation('Window Focus Lost');
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      if (screenRef.current) {
        screenRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isStarted]);

  const addViolation = (msg) => {
    setViolations(prev => {
      if (!prev.includes(msg)) return [...prev, msg];
      return prev;
    });
  };

  const initProctoring = async () => {
    try {
      setStatus("Requesting Screen Share...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenRef.current = screenStream;
      
      screenStream.getVideoTracks()[0].onended = () => {
        addViolation('Screen Share Stop Detected');
      };

      setIsStarted(true);
      setStatus("Loading AI Proctor...");

      const modelURL = MODEL_URL + 'model.json';
      const metadataURL = MODEL_URL + 'metadata.json';
      
      const loadedModel = await window.tmPose.load(modelURL, metadataURL);
      setModel(loadedModel);
      setMaxPredictions(loadedModel.getTotalClasses());

      // Native WebRTC video capture
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      if (videoRef.current) {
         videoRef.current.srcObject = stream;
         await videoRef.current.play();
      }

      setStatus("AI Proctor Active (Webcam & Screen Recorded)");
      requestRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      setStatus("Error: You must accept Camera and Screen Share permissions to take the exam.");
    }
  };

  const loop = async () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      try {
        await predict();
      } catch (err) {
        console.error("AI Loop Error:", err);
      } finally {
        requestRef.current = requestAnimationFrame(loop);
      }
    } else {
      requestRef.current = requestAnimationFrame(loop);
    }
  };

  const predict = async () => {
    if (!model || !videoRef.current) return;
    
    const { pose, posenetOutput } = await model.estimatePose(videoRef.current);
    const prediction = await model.predict(posenetOutput);

    let isCheating = false;
    let isMissing = false;

    if (!pose || pose.score < 0.20) {
      isCheating = true;
      isMissing = true;
    } else {
      prediction.forEach(p => {
        const className = p.className.toLowerCase();
        if ((className.includes('away') || className.includes('phone') || className.includes('cheat')) && p.probability > 0.85) {
          isCheating = true;
        }
      });
    }

    if (isCheating) {
      suspiciousFrames.current += 1;
      if (suspiciousFrames.current > 45) {
        addViolation(isMissing ? 'Student Not Visible in Camera' : 'Suspicious Body Movement or Phone Detected');
      }
    } else {
      suspiciousFrames.current = Math.max(0, suspiciousFrames.current - 2);
    }

    drawPose(pose);
  };

  const drawPose = (pose) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pose) {
      try {
        const minPartConfidence = 0.5;
        window.tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx, 5, '#00d2ff', '#00d2ff');
        window.tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx, 3, '#ff00aa');
      } catch (e) {}
    }
  };

  const submitExam = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Evaluate Score based on Teacher's exam answers
    let correctCount = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correctCount++;
    });
    const finalScore = Math.round((correctCount / exam.questions.length) * 100);

    try {
      const payload = {
        studentPrn: 'STU_CURRENT',
        subject: exam ? exam.title : 'Mock Exam',
        score: finalScore, 
        aiViolations: violations.join(' | ') || 'None'
      };

      await API.post('/exams/submit', payload);
      
      // Store complete review data
      setExamResult({
        score: finalScore,
        correctCount,
        totalCount: exam.questions.length,
        questions: exam.questions,
        userAnswers: { ...answers },
        violations: [...violations]
      });

      // Cleanup camera streams
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      if (screenRef.current) screenRef.current.getTracks().forEach(t => t.stop());
      
      setIsStarted(false);
    } catch (err) {
      alert("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setExamResult(null);
    setAnswers({});
    setViolations([]);
    setIsStarted(false);
    fetchActiveExam();
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', minHeight: '100vh', flexWrap: 'wrap' }}>
      {/* EXAM PANE */}
      <div style={{
        flex: 2, minWidth: '340px', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)',
        borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)'
      }}>
        {examResult !== null ? (
          // ==========================================
          // 🏆 COMPREHENSIVE RESULT & ANSWER REVIEW VIEW
          // ==========================================
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
                {examResult.score >= 75 ? '🎉' : examResult.score >= 50 ? '👍' : '📚'}
              </div>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Exam Evaluation & Answer Review</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Review your submitted answers, correct solutions, and conceptual explanations below.
              </p>
            </div>

            {/* PERFORMANCE METRICS TILES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Final Score</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: examResult.score >= 50 ? '#34d399' : '#f87171' }}>
                  {examResult.score}%
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Correct Answers</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399' }}>
                  {examResult.correctCount} / {examResult.totalCount}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Incorrect</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f87171' }}>
                  {examResult.totalCount - examResult.correctCount}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>AI Violations</span>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: examResult.violations.length > 0 ? '#f87171' : '#34d399' }}>
                  {examResult.violations.length}
                </div>
              </div>
            </div>

            {examResult.violations.length > 0 && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '10px', color: '#f87171', marginBottom: '2rem', fontSize: '13px' }}>
                <strong>⚠️ Integrity Notice:</strong> {examResult.violations.join(' | ')} (Flagged for faculty review).
              </div>
            )}

            {/* QUESTION-BY-QUESTION ANSWER BREAKDOWN */}
            <h3 style={{ fontSize: '1.3rem', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span> Detailed Question-by-Question Solution Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {examResult.questions.map((q, i) => {
                const userChoice = examResult.userAnswers[i];
                const isCorrect = userChoice === q.correct;

                return (
                  <div key={i} style={{
                    background: isCorrect ? 'rgba(52, 211, 153, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    borderLeft: `5px solid ${isCorrect ? '#34d399' : '#ef4444'}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-dark)' }}>
                        Q{i+1}. {q.text}
                      </strong>
                      <span className="badge" style={{
                        background: isCorrect ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isCorrect ? '#34d399' : '#f87171',
                        fontWeight: '700',
                        fontSize: '12px'
                      }}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    {/* OPTIONS DISPLAY */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                      <div style={{
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        background: q.correct === 'A' 
                          ? 'rgba(52, 211, 153, 0.15)' 
                          : userChoice === 'A' 
                          ? 'rgba(239, 68, 68, 0.15)' 
                          : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${q.correct === 'A' ? '#34d399' : userChoice === 'A' ? '#ef4444' : 'var(--border)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px'
                      }}>
                        <span><strong>A)</strong> {q.optionA}</span>
                        {q.correct === 'A' && <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓ Correct Answer</span>}
                        {userChoice === 'A' && q.correct !== 'A' && <span style={{ color: '#f87171', fontWeight: 'bold' }}>✗ Your Choice</span>}
                      </div>

                      <div style={{
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        background: q.correct === 'B' 
                          ? 'rgba(52, 211, 153, 0.15)' 
                          : userChoice === 'B' 
                          ? 'rgba(239, 68, 68, 0.15)' 
                          : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${q.correct === 'B' ? '#34d399' : userChoice === 'B' ? '#ef4444' : 'var(--border)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px'
                      }}>
                        <span><strong>B)</strong> {q.optionB}</span>
                        {q.correct === 'B' && <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓ Correct Answer</span>}
                        {userChoice === 'B' && q.correct !== 'B' && <span style={{ color: '#f87171', fontWeight: 'bold' }}>✗ Your Choice</span>}
                      </div>
                    </div>

                    {/* CONCEPTUAL EXPLANATION */}
                    {q.explanation && (
                      <div style={{
                        padding: '0.8rem 1rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        lineHeight: '1.5'
                      }}>
                        <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '2px' }}>💡 Concept Explanation:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={handleRetake}
                style={{
                  padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: '600',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer'
                }}
              >
                🔄 Retake Assessment for Practice
              </button>

              <button 
                onClick={() => window.location.href = '/student'}
                style={{
                  padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)', color: 'white', borderRadius: '10px', cursor: 'pointer'
                }}
              >
                📊 Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          // ==========================================
          // 📝 EXAM TAKING VIEW
          // ==========================================
          <>
            <h2>Online Examination: {exam ? exam.title : 'No Exam Started'}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Duration: {exam ? exam.duration : '...'} Mins | Mode: AI Proctored
            </p>

            {!exam ? (
              <div style={{ textAlign: 'center', marginTop: '4rem', color: 'gray' }}>
                {status}
              </div>
            ) : !isStarted ? (
              <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--accent-1)', marginBottom: '1rem' }}>Ready to Begin?</h3>
                <div style={{ display: 'inline-block', textAlign: 'left', background: 'rgba(255,100,100,0.1)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid red', marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#ffaaaa' }}>⚠️ Anti-Cheat Active</p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                    <li>Your Webcam & Screen Share will be active during this test.</li>
                    <li><strong>Tab switching and minimizing is strictly prohibited.</strong></li>
                    <li>Looking away from the screen will flag your test for review.</li>
                  </ul>
                </div>
                <br/>
                <button 
                  onClick={initProctoring}
                  style={{
                    padding: '1.2rem 3rem', fontSize: '1.2rem', fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
                    border: 'none', color: 'white', borderRadius: '50px', cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 210, 255, 0.4)', transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🚀 Start Exam & AI Analytics
                </button>
                <p style={{ marginTop: '1.5rem', color: '#ffaaaa', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {status === 'Requesting Screen Share...' ? '⏳ ' + status : ''}
                </p>
              </div>
            ) : (
              <form onSubmit={submitExam}>
                {exam.questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}><strong>{i+1}. {q.text}</strong></p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: answers[i] === 'A' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: answers[i] === 'A' ? '1px solid #6366f1' : '1px solid transparent' }}>
                        <input type="radio" name={`q${i}`} value="A" checked={answers[i] === 'A'} onChange={() => setAnswers({...answers, [i]: 'A'})} required /> A) {q.optionA}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: answers[i] === 'B' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: answers[i] === 'B' ? '1px solid #6366f1' : '1px solid transparent' }}>
                        <input type="radio" name={`q${i}`} value="B" checked={answers[i] === 'B'} onChange={() => setAnswers({...answers, [i]: 'B'})} required /> B) {q.optionB}
                      </label>
                    </div>
                  </div>
                ))}
                
                <button 
                  disabled={isSubmitting}
                  type="submit"
                  style={{
                    marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.1rem',
                    background: 'green', border: 'none', color: 'white', 
                    borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Submitting & Evaluating Answers...' : 'Submit & Review Answers'}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* PROCTORING PANE */}
      <div style={{
        flex: 1, minWidth: '280px', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)',
        borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '600px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>AI Proctor Status</h3>
        
        <div style={{
          width: '100%', height: '250px', background: 'black',
          borderRadius: '12px', overflow: 'hidden', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ 
              position: 'absolute', width: '100%', height: '100%', 
              objectFit: 'cover', transform: 'scaleX(-1)',
              display: isStarted ? 'block' : 'none' 
            }} 
          />
          {isStarted ? (
            <canvas 
              ref={canvasRef} 
              width="400" 
              height="400" 
              style={{ 
                position: 'absolute', width: '100%', height: '100%', 
                objectFit: 'cover', zIndex: 10 
              }} 
            />
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>Proctor Offline</span>
          )}
        </div>

        <p style={{ marginTop: '1rem', color: isStarted ? 'green' : 'var(--text-secondary)', fontWeight: 'bold' }}>
          ● {isStarted ? 'Webcam & Screen Locked' : 'Waiting...'}
        </p>

        {violations.length > 0 && (
          <div style={{
            marginTop: '2rem', padding: '1rem', background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid red', borderRadius: '8px', width: '100%',
            overflowY: 'auto'
          }}>
            <h4 style={{ color: 'red', margin: '0 0 0.5rem 0' }}>⚠️ Violations Detected</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ffaaaa' }}>
              {violations.map((v, i) => <li key={i}>{v}</li>)}
            </ul>
            <p style={{ fontSize: '0.8rem', color: 'red', marginTop: '0.5rem' }}>
              Your examination session is being flagged for review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
