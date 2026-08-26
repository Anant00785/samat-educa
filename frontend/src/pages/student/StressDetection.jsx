import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function StressDetection() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [history, setHistory] = useState([]);

  const prn = user?.role === 'STUDENT' ? user?.prn : (user?.prn || 'PRN000');

  const fetchHistory = async () => {
    try {
      if (prn) {
        const res = await API.get(`/students/wellness/history/${prn}`);
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching wellness history:", err);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
        });
        streamRef.current = s;
        setStream(s);
        setHasCamera(true);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn("Video auto-play suppressed:", playErr);
            }
          };
        }
      } else {
        setCameraError("Camera device not supported in this browser.");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setHasCamera(false);
      setCameraError(err.message || "Camera permission not granted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setHasCamera(false);
  };

  useEffect(() => {
    startCamera();
    fetchHistory();

    return () => {
      stopCamera();
    };
  }, []);

  // When stream changes, ensure videoRef plays it
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn(e));
    }
  }, [stream]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("Please write a few words about how you are feeling.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let imageBase64 = null;
      if (hasCamera && videoRef.current && videoRef.current.videoWidth > 0) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
      }

      const res = await API.post('/ai/analyze-stress', {
        imageBase64,
        text,
        prn
      });

      setResult(res.data);
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert("Error analyzing mood. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stress-detection-page" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.1))',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🧠</span>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>AI Mood Fusion & Wellness Check</h2>
            <p style={{ color: 'var(--text-light)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
              Multimodal emotion synthesis combining computer vision facial sentiment with natural language NLP.
            </p>
          </div>
        </div>
      </div>

      {/* INPUT BOXES: CAMERA & TEXT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. CAMERA PANE */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📷</span> 1. Look at the camera
            </h3>
            {hasCamera ? (
              <button 
                onClick={stopCamera}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                Stop Cam
              </button>
            ) : (
              <button 
                onClick={startCamera}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(52, 211, 153, 0.2)',
                  color: '#34d399',
                  border: '1px solid #34d399',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                Enable Cam
              </button>
            )}
          </div>

          {/* VIDEO DISPLAY CONTAINER */}
          <div style={{
            width: '100%',
            height: '240px',
            background: '#050508',
            borderRadius: '12px',
            border: `2px solid ${hasCamera ? '#6366f1' : 'var(--border)'}`,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: hasCamera ? 'block' : 'none'
              }}
            />

            {!hasCamera && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📷</span>
                <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: '0 0 10px 0' }}>
                  {cameraError || "Camera is turned off or not permitted."}
                </p>
                <button 
                  onClick={startCamera}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Start Camera Feed
                </button>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 2. TEXT & FEELINGS PANE */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✍️</span> 2. How are you feeling?
            </h3>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="E.g. I am feeling overwhelmed with the upcoming exams, but excited to learn..."
              style={{ 
                width: '100%', 
                minHeight: '140px', 
                padding: '12px', 
                borderRadius: '10px', 
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={loading || !text.trim()}
            style={{
              marginTop: '1rem',
              padding: '12px',
              background: loading || !text.trim() 
                ? 'rgba(255,255,255,0.1)' 
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              boxShadow: text.trim() ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            {loading ? '⚡ Running Mood Fusion AI...' : '🔍 Analyze My Mood'}
          </button>
        </div>

      </div>

      {/* RESULTS DISPLAY */}
      {result && (
        <div style={{ 
          padding: '2rem', 
          backgroundColor: 'rgba(15, 23, 42, 0.8)', 
          borderRadius: '16px', 
          border: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px',
              background: result.mood === 'Stressed' || result.mood === 'Sad' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)',
              border: `1px solid ${result.mood === 'Stressed' || result.mood === 'Sad' ? '#ef4444' : '#34d399'}`
            }}>
              {result.mood === 'Happy' ? '😊' : result.mood === 'Sad' ? '😢' : result.mood === 'Stressed' ? '😰' : '😐'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-dark)' }}>
                Detected Mood: <span style={{ color: result.mood === 'Happy' ? '#34d399' : result.mood === 'Stressed' ? '#f87171' : '#a5b4fc' }}>{result.mood}</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '13px' }}>
                Confidence: <strong>{result.confidence}%</strong> • Model: CNN Facial + Text Sentiment Fusion
              </p>
              {result.alertTeacher && (
                 <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                   ✓ Supportive guidance alert logged for faculty advisor.
                 </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600' }}>Focus & Attention Score</span>
              <strong style={{ color: result.focus_score > 70 ? '#34d399' : '#fb923c' }}>{result.focus_score} / 100</strong>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
               <div style={{ 
                 height: '100%', 
                 width: `${result.focus_score}%`, 
                 background: result.focus_score > 70 ? 'linear-gradient(90deg, #34d399, #10b981)' : result.focus_score > 40 ? 'linear-gradient(90deg, #fb923c, #f59e0b)' : 'linear-gradient(90deg, #f87171, #ef4444)',
                 transition: 'width 1s ease-out'
               }} />
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
            💡 AI Supportive Recommendations:
          </h4>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px' }}>
            {result.suggestions?.map((s, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* WELLNESS HISTORY */}
      {history.length > 0 && (
        <div style={{ 
          padding: '1.8rem', 
          backgroundColor: 'rgba(15, 23, 42, 0.7)', 
          borderRadius: '16px', 
          border: '1px solid var(--border)',
          backdropFilter: 'blur(16px)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
            Past Wellness Checks History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((h) => (
              <div key={h.id} style={{ 
                padding: '12px 16px', 
                backgroundColor: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px', 
                borderLeft: `4px solid ${h.mood === 'Happy' ? '#34d399' : h.mood === 'Stressed' ? '#f87171' : '#a5b4fc'}`,
                borderTop: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {h.mood === 'Happy' ? '😊' : h.mood === 'Stressed' ? '😰' : '😐'}
                    </span>
                    <strong style={{ fontSize: '14px' }}>{h.mood}</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
