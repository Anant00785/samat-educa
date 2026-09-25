import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function FeynmanQuiz() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchTopics();
    initSpeechRecognition();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await axios.get('/api/feynman/topics');
      if (res.data?.success && res.data.topics) {
        setTopics(res.data.topics);
        setSelectedTopic(res.data.topics[0]);
      }
    } catch (err) {
      console.error('Failed to load Feynman topics:', err);
    }
  };

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setExplanation((prev) => prev + (prev.length > 0 ? ' ' : '') + currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your explanation.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEvaluate = async (e) => {
    e?.preventDefault();
    if (!explanation || explanation.trim().length < 15) {
      setError('Please provide an explanation of at least 15 characters.');
      return;
    }

    setError(null);
    setEvaluating(true);
    setResult(null);

    const topicName = selectedTopic ? selectedTopic.topic : customTopic;
    const subjectName = selectedTopic ? selectedTopic.subject : customSubject;
    const targetCriteria = selectedTopic ? selectedTopic.keyCriteria : null;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/feynman/evaluate', {
        topic: topicName,
        subject: subjectName,
        studentExplanation: explanation,
        targetConcepts: targetCriteria
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data.data) {
        setResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        padding: '1.8rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.12), rgba(59, 130, 246, 0.05))',
        border: '1.5px solid rgba(30, 64, 175, 0.25)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', color: 'var(--accent-color)' }}>
              Active Recall & Concept Grounding
            </span>
            <span className="badge" style={{ background: '#1e40af', color: '#ffffff', fontSize: '10px' }}>
              Feynman Technique
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-dark)' }}>
            Feynman Reverse Viva Engine
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Teach the concept in your own words. The AI evaluates your explanation against rigorous academic standards, highlights hidden misconceptions, and grades conceptual depth.
          </p>
        </div>

        <div style={{
          padding: '12px 18px',
          background: 'var(--surface-card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Evaluation Model
          </span>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>
            Groq Qwen 32B Evaluator
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '1.8rem' }}>
        
        {/* Left Column: Topic Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{
            padding: '1.4rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0', color: 'var(--text-dark)' }}>
              Select Concept Challenge
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id && !customTopic;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTopic(t); setCustomTopic(''); setResult(null); }}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(30, 64, 175, 0.12)' : 'transparent',
                      border: isSelected ? '1.5px solid var(--accent-color)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)' }}>
                      {t.subject}
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '2px' }}>
                      {t.topic}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Topic Input */}
            <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Or Test Any Custom Concept:
              </span>
              <input
                type="text"
                placeholder="e.g. Bernoulli's Principle, QuickSort"
                value={customTopic}
                onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(null); }}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-dark)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Guidelines Box */}
          <div style={{
            padding: '1.2rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px'
          }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-dark)' }}>
              Feynman Rulebook
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <li>Avoid jargon without defining it first.</li>
              <li>Explain the cause-and-effect relationship.</li>
              <li>Give a simple analogy or concrete visual example.</li>
              <li>State the real-world consequence or purpose.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Viva Arena */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{
            padding: '1.6rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)' }}>
                Your Challenge Goal
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '4px 0 6px 0', color: 'var(--text-dark)' }}>
                {selectedTopic ? selectedTopic.topic : (customTopic || 'Explain your topic')}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {selectedTopic?.promptGoal || 'Explain this concept simply and comprehensively from first principles.'}
              </p>
            </div>

            {/* Explanation Input Area */}
            <div style={{ position: 'relative' }}>
              <textarea
                rows={6}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Start typing or click 'Speak Explanation' to explain how this concept works in simple words..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-dark)',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={toggleRecording}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: isRecording ? '1px solid #ef4444' : '1px solid var(--border)',
                    background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-card)',
                    color: isRecording ? '#ef4444' : 'var(--text-dark)',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isRecording ? '#ef4444' : 'var(--text-muted)'
                  }} />
                  {isRecording ? 'Listening (Click to Stop)...' : 'Dictate via Voice'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {explanation.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    onClick={handleEvaluate}
                    disabled={evaluating || explanation.trim().length < 15}
                    className="btn-primary"
                    style={{
                      padding: '10px 22px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: (evaluating || explanation.trim().length < 15) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {evaluating ? 'Analyzing Concept Depth...' : 'Evaluate My Viva ↗'}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '12.5px' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="fade-in" style={{
              padding: '1.6rem',
              background: 'var(--surface-card)',
              border: '1.5px solid var(--border)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.4rem'
            }}>
              
              {/* Score Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Feynman Evaluation Verdict
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '2px 0', color: 'var(--text-dark)' }}>
                    {result.level}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {result.summary}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 20px',
                  background: 'var(--bg-main)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: getScoreColor(result.masteryScore), lineHeight: '1' }}>
                      {result.masteryScore}%
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                      Mastery Score
                    </span>
                  </div>
                  <div style={{ width: '1px', height: '35px', background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-color)', lineHeight: '1.2' }}>
                      +{result.xpAwarded || 25} XP
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                      Awarded
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                
                {/* Covered Points */}
                <div style={{ padding: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Key Points Nailed
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: '1.6' }}>
                    {result.keyPointsCovered?.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                {/* Missing Points */}
                <div style={{ padding: '1.2rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Missing Critical Concepts
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: '1.6' }}>
                    {result.missingConcepts?.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Misconceptions Alert */}
              {result.misconceptionsDetected && result.misconceptionsDetected.length > 0 && (
                <div style={{ padding: '1.2rem', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Misconceptions Spotted
                  </div>
                  {result.misconceptionsDetected.map((m, i) => (
                    <div key={i} style={{ marginBottom: '8px', fontSize: '12.5px' }}>
                      <div style={{ color: '#ef4444', fontWeight: '600' }}>Statement: "{m.misconception}"</div>
                      <div style={{ color: 'var(--text-dark)', marginTop: '2px' }}>Correction: {m.correction}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feynman Ideal Analogy */}
              {result.feynmanAnalogy && (
                <div style={{ padding: '1.2rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)' }}>
                    How Feynman Would Explain It (10-Year-Old Test)
                  </span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    "{result.feynmanAnalogy}"
                  </p>
                </div>
              )}

              {/* Provocative Challenge */}
              {result.provocativeChallenge && (
                <div style={{ padding: '1.2rem', background: 'rgba(30, 64, 175, 0.06)', border: '1px solid rgba(30, 64, 175, 0.2)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)' }}>
                    Next-Level Challenge Question
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>
                    {result.provocativeChallenge}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
