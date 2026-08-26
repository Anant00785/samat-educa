import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function StressDetection() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
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

  useEffect(() => {
    fetchHistory();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support webcam access. Please use Chrome or Edge over HTTPS.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Play error:", playErr);
        }
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission was denied. Please click the lock icon in your browser address bar and allow Camera access.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No webcam found on this device.");
      } else {
        setCameraError(err.message || "Could not access camera.");
      }
    } finally {
      setCameraLoading(false);
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
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn(e));
    }
  }, [isCameraActive]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("Please write a few words about how you are feeling.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let imageBase64 = null;
      if (isCameraActive && videoRef.current && videoRef.current.videoWidth > 0) {
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
      
      {/* HEADER CARD (Skin / Warm Nude Glass Aesthetic) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.04))',
        border: '1px solid rgba(230, 203, 184, 0.18)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.2), rgba(212, 175, 148, 0.1))',
            border: '1px solid rgba(230, 203, 184, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🧠
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: '#fafafa' }}>
              AI Mood Fusion & Wellness Check
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
              Multimodal emotion synthesis combining computer vision facial sentiment with natural language NLP.
            </p>
          </div>
        </div>
      </div>

      {/* INPUT BOXES: CAMERA & TEXT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. CAMERA PANE */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f4ede6' }}>
              <span>📷</span> 1. Look at the camera
            </h3>
            {isCameraActive && (
              <button 
                onClick={stopCamera}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                Stop Cam
              </button>
            )}
          </div>

          {/* VIDEO DISPLAY CONTAINER */}
          <div style={{
            width: '100%',
            height: '240px',
            background: '#07070a',
            borderRadius: '12px',
            border: `1.5px solid ${isCameraActive ? '#D4AF94' : 'var(--border)'}`,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCameraActive ? '0 0 25px rgba(212, 175, 148, 0.15)' : 'none'
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
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            {!isCameraActive && (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <span style={{ fontSize: '2.8rem', display: 'block', marginBottom: '0.6rem', opacity: 0.8 }}>📷</span>
                {cameraError ? (
                  <p style={{ color: '#f87171', fontSize: '12px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    {cameraError}
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', margin: '0 0 14px 0' }}>
                    Click below to allow camera for real-time facial emotion recognition.
                  </p>
                )}
                
                {/* WARM SKIN / CHAMPAGNE NUDE BUTTON */}
                <button 
                  onClick={startCamera}
                  disabled={cameraLoading}
                  style={{
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                    color: '#1a120c',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: cameraLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 18px rgba(216, 178, 150, 0.35)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {cameraLoading ? 'Opening Camera...' : '🚀 Start Camera Scanner'}
                </button>
              </div>
            )}

            {isCameraActive && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '5px', color: '#D4AF94', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(212, 175, 148, 0.3)' }}>
                ● CAMERA ACTIVE
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* 2. TEXT & FEELINGS PANE */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f4ede6' }}>
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
                color: '#ffffff',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* WARM SKIN / CHAMPAGNE NUDE BUTTON */}
          <button 
            onClick={handleAnalyze} 
            disabled={loading || !text.trim()}
            style={{
              marginTop: '1rem',
              padding: '12px',
              background: loading || !text.trim() 
                ? 'rgba(255,255,255,0.05)' 
                : 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
              color: loading || !text.trim() ? 'var(--text-muted)' : '#1a120c',
              border: loading || !text.trim() ? '1px solid var(--border)' : '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '10px',
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.25s ease',
              boxShadow: text.trim() ? '0 4px 18px rgba(216, 178, 150, 0.3)' : 'none'
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
          backgroundColor: 'rgba(18, 18, 24, 0.8)', 
          borderRadius: '16px', 
          border: '1px solid rgba(230, 203, 184, 0.2)',
          backdropFilter: 'blur(24px)',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '30px',
              background: result.mood === 'Stressed' || result.mood === 'Sad' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(230, 203, 184, 0.15)',
              border: `1px solid ${result.mood === 'Stressed' || result.mood === 'Sad' ? '#ef4444' : '#D8B296'}`
            }}>
              {result.mood === 'Happy' ? '😊' : result.mood === 'Sad' ? '😢' : result.mood === 'Stressed' ? '😰' : '😐'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fafafa' }}>
                Detected Mood: <span style={{ color: result.mood === 'Happy' ? '#D8B296' : result.mood === 'Stressed' ? '#f87171' : '#E2C2A6' }}>{result.mood}</span>
              </h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                Confidence: <strong>{result.confidence}%</strong> • Model: CNN Facial + Text Sentiment Fusion
              </p>
              {result.alertTeacher && (
                 <span style={{ fontSize: '12px', color: '#D8B296', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                   ✓ Supportive guidance alert logged for faculty advisor.
                 </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: '#f4ede6' }}>Focus & Attention Score</span>
              <strong style={{ color: '#D8B296' }}>{result.focus_score} / 100</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ 
                 height: '100%', 
                 width: `${result.focus_score}%`, 
                 background: 'linear-gradient(90deg, #D8B296, #F3E5D8)',
                 transition: 'width 1s ease-out'
               }} />
            </div>
          </div>

          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#f4ede6' }}>
            💡 AI Supportive Recommendations:
          </h4>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#d4d4d8', lineHeight: '1.6', fontSize: '13.5px' }}>
            {result.suggestions?.map((s, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* WELLNESS HISTORY */}
      {history.length > 0 && (
        <div style={{ 
          padding: '1.8rem', 
          backgroundColor: 'rgba(18, 18, 24, 0.65)', 
          borderRadius: '16px', 
          border: '1px solid var(--border)',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#fafafa' }}>
            Past Wellness Checks History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((h) => (
              <div key={h.id} style={{ 
                padding: '12px 16px', 
                backgroundColor: 'rgba(255,255,255,0.02)', 
                borderRadius: '8px', 
                borderLeft: `3px solid ${h.mood === 'Happy' ? '#D8B296' : h.mood === 'Stressed' ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {h.mood === 'Happy' ? '😊' : h.mood === 'Stressed' ? '😰' : '😐'}
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{h.mood}</strong>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
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
