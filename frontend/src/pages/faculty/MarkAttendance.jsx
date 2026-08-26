import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function MarkAttendance() {
  const { user } = useAuth();
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({}); // { prn: 'PRESENT'|'ABSENT' }
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- AI State ---
  const [aiMode, setAiMode] = useState(false);
  const [aiStatus, setAiStatus] = useState('Waiting to start...');
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const modelRef = useRef(null);
  
  // NOTE: Insert your actual Teachable Machine model URL here
  const TM_URL = "https://teachablemachine.withgoogle.com/models/hqmBAXU6_7/";

  useEffect(() => {
    async function load() {
      try {
        const [profRes, studRes] = await Promise.all([
          API.get(`/faculty/by-user/${user.userId}`),
          API.get('/students'),
        ]);
        setFacultyProfile(profRes.data);
        setStudents(studRes.data);

        if (profRes.data.subjects) setSubjects(profRes.data.subjects);

        // Default all to ABSENT so AI can mark them PRESENT
        const init = {};
        studRes.data.forEach(s => { init[s.prn] = 'ABSENT'; });
        setAttendance(init);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => {
      // Cleanup AI loop on unmount
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (webcamRef.current) webcamRef.current.stop();
    };
  }, [user.userId]);

  const toggle = (prn) => {
    setAttendance(prev => ({
      ...prev,
      [prn]: prev[prn] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
    }));
  };

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[s.prn] = status; });
    setAttendance(next);
  };

  // --- AI Initialization ---
  const startAI = async () => {
    if (TM_URL.includes("YOUR")) {
      setAiStatus("⚠️ Invalid Model URL. Please add your TM URL in the code.");
      return;
    }
    setAiStatus("Loading model... Please wait.");
    setIsCameraActive(true);
    
    try {
      const modelURL = TM_URL + "model.json";
      const metadataURL = TM_URL + "metadata.json";

      // window.tmImage loaded from index.html CDN
      modelRef.current = await window.tmImage.load(modelURL, metadataURL);

      const flip = true; 
      webcamRef.current = new window.tmImage.Webcam(300, 300, flip);
      await webcamRef.current.setup();
      await webcamRef.current.play();

      setAiStatus("Scanning...");

      if (canvasRef.current) {
        canvasRef.current.width = 300;
        canvasRef.current.height = 300;
        loopRef.current = window.requestAnimationFrame(loop);
      }
    } catch (err) {
      console.error(err);
      setAiStatus("Error: Camera access denied or model failed to load.");
    }
  };

  const loop = async () => {
    if (webcamRef.current) {
      webcamRef.current.update();
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(webcamRef.current.canvas, 0, 0);
      }
      await predict();
      loopRef.current = window.requestAnimationFrame(loop);
    }
  };

  const predict = async () => {
    if (!modelRef.current || !webcamRef.current) return;
    const predictions = await modelRef.current.predict(webcamRef.current.canvas);
    
    // Check if any prediction matches a known PRN or Name with > 95% confidence
    predictions.forEach(p => {
      // The TM class name could be "PRN001" or "Ritu Patel"
      const className = p.className.toLowerCase().trim();
      
      if (p.probability > 0.95) {
        // Try finding student by PRN or Name
        const student = students.find(s => 
          s.prn.toLowerCase() === className || 
          `${s.first_name} ${s.last_name}`.toLowerCase().trim() === className ||
          s.first_name.toLowerCase() === className
        );
        
        if (student) {
          // Flip their attendance to PRESENT automatically
          setAttendance(prev => {
            if (prev[student.prn] !== 'PRESENT') {
               // Flash green effect can be added here
               return { ...prev, [student.prn]: 'PRESENT' };
            }
            return prev;
          });
        }
      }
    });
  };

  const stopAI = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (webcamRef.current) webcamRef.current.stop();
    setIsCameraActive(false);
    setAiStatus('Stopped.');
  };

  const handleSubmit = async () => {
    if (!selectedSubject) return setMessage({ type: 'error', text: 'Please select a subject.' });
    setSubmitting(true);
    setMessage(null);
    try {
      const records = students.map(s => ({ prn: s.prn, status: attendance[s.prn] || 'PRESENT' }));
      await API.post('/attendance/bulk', {
        records,
        subject_id: selectedSubject,
        faculty_id: facultyProfile.faculty_id,
        date,
      });
      setMessage({ type: 'success', text: `✅ Attendance saved for ${records.length} students!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save attendance.' });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'PRESENT').length;

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-heading">Mark Attendance</h2>
          <p className="page-subtitle">{presentCount}/{students.length} marked present</p>
        </div>
        <button 
          className={`btn-primary ${aiMode ? 'btn-danger' : ''}`}
          onClick={() => {
            if (aiMode) stopAI();
            setAiMode(!aiMode);
          }}
        >
          {aiMode ? 'Exit AI Mode' : '📷 Smart AI Scanner'}
        </button>
      </div>

      {aiMode && (
        <div className="dashboard-section" style={{ background: 'var(--bg-glass)', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Smart Facial Recognition</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{aiStatus}</p>
          
          {!isCameraActive ? (
            <button className="btn-primary" onClick={startAI}>Start Camera</button>
          ) : (
            <button className="btn-danger" onClick={stopAI}>Stop Camera</button>
          )}

          <div style={{ marginTop: '1.5rem', display: isCameraActive ? 'block' : 'none' }}>
            <canvas 
              ref={canvasRef} 
              style={{ borderRadius: '12px', border: '2px solid var(--accent-1)', boxShadow: '0 0 20px rgba(0, 210, 255, 0.2)' }}
            />
          </div>
        </div>
      )}

      <div className="form-card">
        <div className="grid-form" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field-group">
            <label className="field-label">Subject</label>
            <select className="field-input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Date</label>
            <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="att-mark-controls">
          <button className="btn-sm btn-success" onClick={() => markAll('PRESENT')}>✓ All Present</button>
          <button className="btn-sm btn-danger"  onClick={() => markAll('ABSENT')}>✗ All Absent</button>
        </div>

        <div className="student-att-list">
          {students.map(s => (
            <div key={s.prn} className={`student-att-row ${attendance[s.prn] === 'ABSENT' ? 'att-absent' : 'att-present'}`} style={{ transition: 'all 0.3s' }}>
              <div className="student-att-info">
                <span className="badge">{s.prn}</span>
                <span>{s.first_name} {s.last_name}</span>
              </div>
              <button
                className={`att-toggle-btn ${attendance[s.prn] === 'PRESENT' ? 'att-btn-present' : 'att-btn-absent'}`}
                onClick={() => toggle(s.prn)}
              >
                {attendance[s.prn] === 'PRESENT' ? '✓ Present' : '✗ Absent'}
              </button>
            </div>
          ))}
        </div>

        {message && <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>}

        <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : '  Save Attendance'}
        </button>
      </div>
    </div>
  );
}
