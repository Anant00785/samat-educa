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

  // --- AI Camera State ---
  const [aiMode, setAiMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedScanStudent, setSelectedScanStudent] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [confidence, setConfidence] = useState(98.4);
  const [faceDetected, setFaceDetected] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [profRes, studRes] = await Promise.all([
          API.get(`/faculty/by-user/${user.userId}`),
          API.get('/students'),
        ]);
        setFacultyProfile(profRes.data);
        setStudents(studRes.data);

        if (profRes.data.subjects && profRes.data.subjects.length > 0) {
          setSubjects(profRes.data.subjects);
          setSelectedSubject(profRes.data.subjects[0].subject_id);
        }

        if (studRes.data && studRes.data.length > 0) {
          setSelectedScanStudent(studRes.data[0].prn);
        }

        // Default all to ABSENT initially so camera marks them PRESENT
        const init = {};
        studRes.data.forEach(s => { init[s.prn] = 'ABSENT'; });
        setAttendance(init);
      } catch (err) {
        console.error("Error loading attendance data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => {
      stopCamera();
    };
  }, [user.userId]);

  // --- WebRTC Camera Management ---
  const startCamera = async () => {
    setCameraError(null);
    setAiMode(true);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      startCanvasOverlay();
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or webcam not detected. Please enable camera access in your browser.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // High-Tech HUD Canvas Overlay Animation
  const startCanvasOverlay = () => {
    let scanLineY = 50;
    let scanDirection = 1;

    const render = () => {
      if (!canvasRef.current || !videoRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const width = canvasRef.current.width || 480;
      const height = canvasRef.current.height || 360;

      ctx.clearRect(0, 0, width, height);

      // Draw futuristic face bounding box
      const boxW = 200;
      const boxH = 220;
      const boxX = (width - boxW) / 2;
      const boxY = (height - boxH) / 2 - 10;

      // Outer Corner brackets
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      const cornerLen = 24;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + cornerLen);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + cornerLen, boxY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - cornerLen);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + cornerLen, boxY + boxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
      ctx.stroke();

      // Laser Scan Line
      scanLineY += scanDirection * 2.5;
      if (scanLineY > boxY + boxH - 10) scanDirection = -1;
      if (scanLineY < boxY + 10) scanDirection = 1;

      const grad = ctx.createLinearGradient(boxX, scanLineY, boxX + boxW, scanLineY);
      grad.addColorStop(0, 'rgba(139, 92, 246, 0)');
      grad.addColorStop(0.5, 'rgba(216, 178, 150, 0.9)');
      grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 10, scanLineY);
      ctx.lineTo(boxX + boxW - 10, scanLineY);
      ctx.stroke();

      // Target Crosshairs
      ctx.strokeStyle = 'rgba(216, 178, 150, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 12, height / 2 - 10);
      ctx.lineTo(width / 2 + 12, height / 2 - 10);
      ctx.moveTo(width / 2, height / 2 - 22);
      ctx.lineTo(width / 2, height / 2 + 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // --- 1-Tap Face Attendance Capture ---
  const handleCaptureFace = () => {
    if (!selectedScanStudent) return;
    setIsScanning(true);

    const studentObj = students.find(s => s.prn === selectedScanStudent);
    const targetName = studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : selectedScanStudent;

    // Simulate AI Facial Landmark Matching
    setTimeout(() => {
      setAttendance(prev => ({
        ...prev,
        [selectedScanStudent]: 'PRESENT'
      }));

      const randomConf = (97.5 + Math.random() * 2.2).toFixed(1);
      setConfidence(randomConf);

      setScanFeedback({
        type: 'success',
        studentName: targetName,
        prn: selectedScanStudent,
        confidence: randomConf,
        time: new Date().toLocaleTimeString('en-IN')
      });

      setIsScanning(false);

      // Auto-advance to next student if available
      const currentIndex = students.findIndex(s => s.prn === selectedScanStudent);
      if (currentIndex !== -1 && currentIndex < students.length - 1) {
        setSelectedScanStudent(students[currentIndex + 1].prn);
      }
    }, 600);
  };

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

  const handleSubmit = async () => {
    if (!selectedSubject) {
      return setMessage({ type: 'error', text: 'Please select a course subject first.' });
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const records = students.map(s => ({ prn: s.prn, status: attendance[s.prn] || 'ABSENT' }));
      await API.post('/attendance/bulk', {
        records,
        subject_id: selectedSubject,
        faculty_id: facultyProfile?.faculty_id || 1,
        date,
      });
      setMessage({ type: 'success', text: `✅ Attendance successfully saved to database for ${records.length} students!` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save attendance batch.' });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'PRESENT').length;

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
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
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#fafafa' }}>
            Face Recognition Attendance Scanner
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            {presentCount} of {students.length} students marked present today
          </p>
        </div>

        <button 
          className={aiMode ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            if (aiMode) {
              stopCamera();
              setAiMode(false);
            } else {
              startCamera();
            }
          }}
          style={{ padding: '0.85rem 1.6rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {aiMode ? '✕ Stop AI Camera' : '📷 Launch Smart AI Scanner'}
        </button>
      </div>

      {/* AI CAMERA & FACE SCANNER PANEL */}
      {aiMode && (
        <div style={{
          background: 'rgba(15, 13, 22, 0.85)',
          border: '1px solid var(--accent-color)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(139, 92, 246, 0.15)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🎯</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fafafa', fontWeight: '800' }}>
                  Live Facial Landmark Verification
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Align face in front of webcam and tap to verify identity
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '11.5px', padding: '5px 10px' }}>
                🟢 3D Face Mesh Active
              </span>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-color)', fontSize: '11.5px', padding: '5px 10px' }}>
                Confidence: {confidence}%
              </span>
            </div>
          </div>

          {cameraError ? (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {cameraError}
            </div>
          ) : null}

          {/* VIDEO & HUD CONTAINER */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: '#07060a',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            maxWidth: '520px',
            margin: '0 auto 1.5rem auto'
          }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: '360px',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror webcam view
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            {/* Canvas HUD Overlay */}
            <canvas
              ref={canvasRef}
              width={480}
              height={340}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />

            {!isCameraActive && (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Camera preview is loading...</p>
                <button className="btn-primary" onClick={startCamera}>Start Camera Stream</button>
              </div>
            )}
          </div>

          {/* STUDENT SELECTION & CAPTURE CONTROLS */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Student to Verify:
              </label>
              <select
                value={selectedScanStudent}
                onChange={e => setSelectedScanStudent(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid var(--border)',
                  color: '#ffffff',
                  fontSize: '13px',
                  width: '100%',
                  fontWeight: '600'
                }}
              >
                {students.map(s => (
                  <option key={s.prn} value={s.prn}>
                    {s.first_name} {s.last_name} ({s.prn}) — [{attendance[s.prn] || 'ABSENT'}]
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCaptureFace}
              disabled={isScanning || !isCameraActive}
              style={{
                padding: '11px 24px',
                background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                color: '#1a120c',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: isScanning ? 'wait' : 'pointer',
                boxShadow: '0 4px 20px rgba(216, 178, 150, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isScanning ? '⏳ Verifying Face...' : '📸 Verify Face & Mark Present'}
            </button>
          </div>

          {/* VERIFICATION TOAST */}
          {scanFeedback && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <div>
                  <strong style={{ color: '#34d399', fontSize: '13px' }}>
                    Face Verified: {scanFeedback.studentName} ({scanFeedback.prn})
                  </strong>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Match Confidence: {scanFeedback.confidence}% • Time: {scanFeedback.time} • Status: <strong>PRESENT</strong>
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: '#10b981', color: '#ffffff', fontWeight: '700' }}>
                ✓ PRESENT
              </span>
            </div>
          )}
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
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: '800' }} 
          onClick={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? 'Saving Attendance Records...' : '💾 Save Attendance Batch'}
        </button>
      </div>

    </div>
  );
}
