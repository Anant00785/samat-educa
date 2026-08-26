import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/axios';

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/AD5iLzkdB/';

export default function OnlineExam() {
  const [exam, setExam] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('Waiting to start...');
  const [violations, setViolations] = useState([]);
  const [examResult, setExamResult] = useState(null); // Score tracker
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const [model, setModel] = useState(null);
  const [maxPredictions, setMaxPredictions] = useState(0);
  
  const suspiciousFrames = useRef(0);
  const requestRef = useRef();
  
  // Track student's selected answers (e.g. { 0: 'A', 1: 'B' })
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    API.get('/exams/active').then(res => {
      if (res.data.success) {
        setExam(res.data.exam);
      } else {
        setStatus('No active exam currently published by Faculty.');
      }
    }).catch(err => setStatus('Error fetching exam'));

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

      // Use Native WebRTC instead of TeachableMachine wrapper to prevent suspension!
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
      // Loop until video is ready
      requestRef.current = requestAnimationFrame(loop);
    }
  };

  const predict = async () => {
    if (!model || !videoRef.current) return;
    
    // Pass the native video tag directly to TM
    const { pose, posenetOutput } = await model.estimatePose(videoRef.current);
    const prediction = await model.predict(posenetOutput);

    let isCheating = false;
    let isMissing = false;

    // If posenet cannot find a body, or confidence is very low, the student left the frame
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
      if (suspiciousFrames.current > 45) { // 45 frames ~ 1.5 seconds
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
    
    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pose) {
      try {
        const minPartConfidence = 0.5;
        window.tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx, 5, '#00d2ff', '#00d2ff');
        window.tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx, 3, '#ff00aa');
      } catch (e) {
        // ignore skeleton drawing errors if any
      }
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
      
      setExamResult(finalScore); // Show results page

      // Cleanup
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      if (screenRef.current) screenRef.current.getTracks().forEach(t => t.stop());
      
      setIsStarted(false);
      setExam(null);
    } catch (err) {
      alert("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', minHeight: '100vh' }}>
      {/* EXAM PANE */}
      <div style={{
        flex: 2, background: 'var(--bg-glass)', backdropFilter: 'blur(10px)',
        borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)'
      }}>
        {examResult !== null ? (
          // SCORE RESULTS VIEW
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2>Exam Successfully Submitted!</h2>
            <h1 style={{ fontSize: '3rem', color: examResult >= 50 ? 'green' : 'red', margin: '2rem 0' }}>
              Score: {examResult}%
            </h1>
            {violations.length > 0 && (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                Note: Violations were sent to your teacher for review!
              </p>
            )}
            <button 
              onClick={() => window.location.href = '/student'}
              style={{
                marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.1rem',
                background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
                border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          // EXAM TAKING VIEW
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
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <input type="radio" name={`q${i}`} value="A" onChange={() => setAnswers({...answers, [i]: 'A'})} required /> A) {q.optionA}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <input type="radio" name={`q${i}`} value="B" onChange={() => setAnswers({...answers, [i]: 'B'})} required /> B) {q.optionB}
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
                    borderRadius: '8px', cursor: 'pointer', width: '100%'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* PROCTORING PANE */}
      <div style={{
        flex: 1, background: 'var(--bg-glass)', backdropFilter: 'blur(10px)',
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
              objectFit: 'cover', transform: 'scaleX(-1)', // mirror the video natively
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
