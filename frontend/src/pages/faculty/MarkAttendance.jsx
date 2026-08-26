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
  
  // Teachable Machine model URL
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
    setAiStatus("Loading Teachable Machine AI model...");
    setIsCameraActive(true);
    
    try {
      const modelURL = TM_URL + "model.json";
      const metadataURL = TM_URL + "metadata.json";

      modelRef.current = await window.tmImage.load(modelURL, metadataURL);

      const flip = true; 
      webcamRef.current = new window.tmImage.Webcam(320, 240, flip);
      await webcamRef.current.setup();
      await webcamRef.current.play();

      setAiStatus("📷 Live Face Scanner Active: Looking for students...");

      if (canvasRef.current) {
        canvasRef.current.width = 320;
        canvasRef.current.height = 240;
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
    
    predictions.forEach(p => {
      const className = p.className.toLowerCase().trim();
      
      if (p.probability > 0.90) {
        const student = students.find(s => 
          s.prn.toLowerCase() === className || 
          `${s.first_name} ${s.last_name}`.toLowerCase().trim() === className ||
          s.first_name.toLowerCase() === className
        );
        
        if (student) {
          setAttendance(prev => {
            if (prev[student.prn] !== 'PRESENT') {
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
    setAiStatus('Scanner Stopped.');
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
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER BAR */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.18)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0, color: '#fafafa' }}>Mark Attendance</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            {presentCount} of {students.length} students marked present
          </p>
        </div>

        <button 
          className={aiMode ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            if (aiMode) stopAI();
            setAiMode(!aiMode);
          }}
          style={{ padding: '0.8rem 1.5rem', fontWeight: '700' }}
        >
          {aiMode ? '✕ Close AI Scanner' : '📷 Launch Smart AI Scanner'}
        </button>
      </div>

      {/* AI SCANNER PANEL */}
      {aiMode && (
        <div style={{
          background: 'rgba(18, 18, 24, 0.8)',
          border: '1px solid rgba(216, 178, 150, 0.25)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(24px)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#fafafa' }}>
            Teachable Machine Facial Recognition
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.5rem' }}>
            {aiStatus}
          </p>
          
          {!isCameraActive ? (
            <button className="btn-primary" onClick={startAI} style={{ padding: '10px 24px' }}>
              🚀 Start Face Camera
            </button>
          ) : (
            <button className="btn-danger" onClick={stopAI} style={{ padding: '10px 24px' }}>
              Stop Camera
            </button>
          )}

          <div style={{ marginTop: '1.5rem', display: isCameraActive ? 'flex' : 'none', justifyContent: 'center' }}>
            <canvas 
              ref={canvasRef} 
              style={{
                borderRadius: '12px',
                border: '2px solid #D8B296',
                boxShadow: '0 0 30px rgba(216, 178, 150, 0.2)',
                maxWidth: '100%'
              }}
            />
          </div>
        </div>
      )}

      {/* ATTENDANCE FORM CARD */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        
        {/* SUBJECT & DATE ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="field-group" style={{ margin: 0 }}>
            <label className="field-label">Select Subject</label>
            <select className="field-input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
            </select>
          </div>

          <div className="field-group" style={{ margin: 0 }}>
            <label className="field-label">Attendance Date</label>
            <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {/* QUICK BULK ACTIONS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#fafafa' }}>
            Student Roll List ({students.length} Registered)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-sm btn-success" onClick={() => markAll('PRESENT')}>
              ✓ Mark All Present
            </button>
            <button className="btn-sm btn-danger" onClick={() => markAll('ABSENT')}>
              ✗ Mark All Absent
            </button>
          </div>
        </div>

        {/* STUDENT ROSTER LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
          {students.map(s => {
            const isPresent = attendance[s.prn] === 'PRESENT';
            return (
              <div 
                key={s.prn}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: isPresent ? 'rgba(52, 211, 153, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                  borderLeft: `4px solid ${isPresent ? '#34d399' : '#ef4444'}`,
                  borderTop: '1px solid var(--border-subtle)',
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="badge" style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {s.prn}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: '#ffffff' }}>
                    {s.first_name} {s.last_name}
                  </span>
                </div>

                <button
                  onClick={() => toggle(s.prn)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: isPresent ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    boxShadow: isPresent ? '0 2px 10px rgba(16, 185, 129, 0.3)' : '0 2px 10px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '90px',
                    textAlign: 'center'
                  }}
                >
                  {isPresent ? '✓ Present' : '✗ Absent'}
                </button>
              </div>
            );
          })}
        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {/* SAVE BUTTON */}
        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} 
          onClick={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? 'Saving Attendance Records...' : '💾 Save Attendance Batch'}
        </button>
      </div>

    </div>
  );
}
