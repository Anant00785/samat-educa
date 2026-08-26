import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function StressDetection() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const prn = user?.role === 'STUDENT' ? user?.prn : null;
      if (prn) {
        const res = await fetch(`http://localhost:5000/api/students/wellness/history/${prn}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching wellness history:", err);
    }
  };

  useEffect(() => {
    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        setStream(s);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        setHasCamera(false);
      });

    fetchHistory();

    return () => {
      // Clean up stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const openCamera = async () => {
      if(stream) return;
      try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(s);
          setHasCamera(true);
          if (videoRef.current) {
              videoRef.current.srcObject = s;
          }
      } catch (err) {
          console.error("Camera error:", err);
          alert("Could not access camera");
      }
  };

  const stopCamera = () => {
      if(stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
          setHasCamera(false);
      }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
        alert("Please enter how you are feeling.");
        return;
    }

    setLoading(true);
    setResult(null);

    try {
      let imageBase64 = null;
      if (hasCamera && videoRef.current) {
        // Capture snapshot
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
      } else {
        alert("Webcam is required to detect facial emotion. Please allow camera access.");
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:5000/api/ai/analyze-stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64, 
          text,
          prn: user?.role === 'STUDENT' ? user?.prn : null
        })
      });

      if (!res.ok) throw new Error("Analysis failed");
      
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert("Error analyzing stress level. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stress-detection-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '10px' }}>Mood & Wellness Check</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Check your stress levels and get AI suggestions. We use your webcam and text input to analyze your mood.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>1. Look at the camera</h3>
          {!hasCamera ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              <p style={{ marginBottom: '15px' }}>Camera access is off</p>
              <button 
                onClick={openCamera}
                style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Enable Camera
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{ width: '100%', borderRadius: '8px', border: '2px solid var(--primary-light)', background: '#000' }} 
              />
              <button 
                onClick={stopCamera}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                Stop
              </button>
            </div>
          )}
          {/* Hidden canvas for taking snapshots */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>2. How are you feeling?</h3>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g. I am feeling overwhelmed with the upcoming exams..."
            style={{ 
              width: '100%', 
              flex: '1', 
              minHeight: '120px', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              resize: 'none',
              marginBottom: '15px',
              fontFamily: 'inherit'
            }}
          />
          <button 
            onClick={handleAnalyze} 
            disabled={loading || !hasCamera || !text.trim()}
            style={{
              padding: '12px',
              background: loading || !hasCamera || !text.trim() ? 'var(--text-secondary)' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !hasCamera || !text.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze My Mood'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ 
          padding: '25px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px',
              marginRight: '20px',
              background: result.mood === 'Stressed' || result.mood === 'Sad' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)',
              color: result.mood === 'Stressed' || result.mood === 'Sad' ? '#ff6384' : '#4bc0c0'
            }}>
              {result.mood === 'Happy' ? '😊' : result.mood === 'Sad' ? '😢' : result.mood === 'Stressed' ? '😰' : '😐'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>Detected Mood: {result.mood}</h3>
              <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>Confidence: <strong>{result.confidence}%</strong></p>
              {result.alertTeacher && (
                 <span style={{ fontSize: '13px', color: result.mood === 'Happy' ? '#4bc0c0' : '#ff6384', fontWeight: 'bold', display: 'block', marginTop: '5px' }}>
                   ✓ Note sent to your faculty guide.
                 </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Focus & Attention Score</span>
              <span style={{ fontWeight: 'bold', color: result.focus_score > 70 ? '#4bc0c0' : '#ffca28' }}>{result.focus_score}/100</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
               <div style={{ 
                 height: '100%', 
                 width: `${result.focus_score}%`, 
                 background: result.focus_score > 70 ? '#4bc0c0' : result.focus_score > 40 ? '#ffca28' : '#ff6384',
                 transition: 'width 1s ease-out'
               }} />
            </div>
          </div>

          <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Suggested Interventions:</h4>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            {result.suggestions?.map((s, i) => (
              <li key={i} style={{ marginBottom: '10px', lineHeight: '1.5' }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* History section */}
      {history.length > 0 && (
        <div style={{ 
          marginTop: '40px',
          padding: '25px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)' 
        }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', fontSize: '1.2rem' }}>
            Past Wellness Checks History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {history.map((h) => (
              <div key={h.id} style={{ 
                padding: '15px', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: '8px', 
                borderLeft: `4px solid ${h.mood === 'Happy' ? '#4bc0c0' : h.mood === 'Sad' ? '#ff6384' : h.mood === 'Stressed' ? '#ff6384' : 'var(--text-secondary)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {h.mood === 'Happy' ? '😊' : h.mood === 'Sad' ? '😢' : h.mood === 'Stressed' ? '😰' : '😐'}
                    </span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{h.mood}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>AI Suggestions:</strong>
                  <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                    {(() => {
                      try {
                        return JSON.parse(h.suggestions).map((s, i) => (
                          <li key={i}>{s}</li>
                        ));
                      } catch {
                        return <li>{h.suggestions}</li>;
                      }
                    })()}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
