import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [fees, setFees] = useState([]);
  const [marksSummary, setMarksSummary] = useState([]);
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [interventionData, setInterventionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchStudentData = async () => {
    try {
      const profileRes = await API.get(`/students/by-user/${user.userId}`);
      const prn = profileRes.data.prn;
      setProfile(profileRes.data);

      const [attRes, feesRes, marksRes, wellnessRes, invRes] = await Promise.all([
        API.get(`/attendance/summary/${prn}`).catch(() => ({ data: [] })),
        API.get(`/fees/${prn}`).catch(() => ({ data: [] })),
        API.get(`/marks/summary/${prn}`).catch(() => ({ data: [] })),
        API.get(`/students/wellness/history/${prn}`).catch(() => ({ data: [] })),
        API.get(`/interventions/student/${prn}`).catch(() => ({ data: null }))
      ]);

      setAttendanceSummary(attRes.data || []);
      setFees(feesRes.data || []);
      setMarksSummary(marksRes.data || []);
      setWellnessHistory(wellnessRes.data || []);
      setInterventionData(invRes.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user.userId]);

  const handleGeneratePlan = async () => {
    if (!profile?.prn) return;
    try {
      setLoading(true);
      const res = await API.post(`/interventions/generate/${profile.prn}`);
      setActionSuccess("⚡ HyperIntervene AI formulated your targeted recovery roadmap!");
      fetchStudentData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to generate intervention plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (id) => {
    try {
      await API.post(`/interventions/${id}/complete`, {
        outcome: "Student self-completed milestone via dashboard."
      });
      setActionSuccess("✓ Milestone marked complete! Progress recorded.");
      fetchStudentData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const avgAttendance = attendanceSummary.length > 0
    ? Math.round(attendanceSummary.reduce((s, r) => s + Number(r.percentage), 0) / attendanceSummary.length)
    : 0;

  const pendingFees = fees.filter(f => f.status === 'PENDING').length;

  if (loading && !profile) return <div className="page-loading"><div className="spinner" /></div>;

  const riskScore = interventionData?.riskScore || 0;
  const riskLevel = interventionData?.riskLevel || 'LOW';
  const isHighRisk = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';
  const riskColor = riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'HIGH' ? '#f97316' : riskLevel === 'MEDIUM' ? '#eab308' : '#34d399';
  const activeActions = interventionData?.activeInterventions || [];

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER BAR */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-heading">Welcome, {profile?.first_name}! 👋</h2>
          <p className="page-subtitle">{profile?.department} · Semester {profile?.semester} · PRN: {profile?.prn}</p>
        </div>
      </div>

      {actionSuccess && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(216, 178, 150, 0.15))',
          border: '1px solid #34d399',
          borderRadius: '12px',
          color: '#34d399',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {actionSuccess}
        </div>
      )}

      {/* QUICK STAT METRIC CARDS */}
      <div className="stats-grid">
        <Link to="/student/attendance" className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{avgAttendance}%</span>
            <span className="stat-label">Overall Attendance</span>
          </div>
        </Link>
        <Link to="/student/marks" className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{attendanceSummary.length}</span>
            <span className="stat-label">Subjects Enrolled</span>
          </div>
        </Link>
        <Link to="/student/fees" className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <span className="stat-value">{pendingFees}</span>
            <span className="stat-label">Pending Fee Dues</span>
          </div>
        </Link>
        <Link to="/student/exam" className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">Take</span>
            <span className="stat-label">Online Assessment</span>
          </div>
        </Link>
        <Link to="/student/wellness" className="stat-card">
          <div className="stat-icon">🧠</div>
          <div className="stat-info">
            <span className="stat-value">AI</span>
            <span className="stat-label">Wellness Check</span>
          </div>
        </Link>
      </div>

      {/* =========================================================================
          HYPERINTERVENE AI — ACTIVE RISK → WHY → ACTION ENGINE
          ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.2)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* HYPERINTERVENE HEADER & RISK BADGE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                HyperIntervene AI — Academic Health & Recovery
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>
              Autonomous continuous evaluation detecting academic friction points and prescribing targeted action items.
            </p>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1.5px solid ${riskColor}`,
            borderRadius: '12px',
            padding: '8px 18px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '700' }}>
              Calculated Academic Risk
            </span>
            <strong style={{ fontSize: '1.5rem', color: riskColor, fontWeight: '800' }}>
              {riskScore} <span style={{ fontSize: '12px', opacity: 0.85 }}>/ 100 ({riskLevel})</span>
            </strong>
          </div>
        </div>

        {/* 1. WHY ARE YOU FLAGGED? */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem'
        }}>
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1.05rem', color: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> 1. Why? (Factual Performance Breakdown)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
            {interventionData?.reasons?.map((r, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderLeft: `3px solid ${isHighRisk ? '#ef4444' : '#D8B296'}`,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#e4e4e7',
                lineHeight: '1.4'
              }}>
                {r}
              </div>
            ))}
          </div>
        </div>

        {/* 2. WHAT SHOULD I DO NEXT? */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> 2. What Should You Do Next? (Assigned Actions)
            </h4>

            <button 
              onClick={handleGeneratePlan}
              style={{
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(216, 178, 150, 0.3)',
                color: '#F3E5D8',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ⚡ Refresh Action Plan
            </button>
          </div>

          {activeActions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                No urgent recovery interventions pending. Keep up the great work!
              </p>
              <button 
                onClick={handleGeneratePlan}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px' }}
              >
                Synthesize Personalized Study Strategy
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {activeActions.map((act) => (
                <div key={act.intervention_id} style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${act.priority === 'URGENT' ? '#ef4444' : act.priority === 'HIGH' ? '#f97316' : '#D8B296'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{act.title}</strong>
                      <span className="badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {act.priority}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {act.description}
                    </p>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>👤 <strong>Action by:</strong> {act.owner_role}</span>
                      <span>📅 <strong>Target Due:</strong> {act.due_date}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {act.action_type === 'RECOVERY_PLAN' && (
                      <Link 
                        to="/student/study-planner"
                        style={{
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                          color: '#1a120c',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12px',
                          textDecoration: 'none'
                        }}
                      >
                        📖 Open Study Planner
                      </Link>
                    )}
                    <button 
                      onClick={() => handleCompleteTask(act.intervention_id)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Wellness Section */}
      <div className="dashboard-section">
        <h3 className="section-title">AI Wellness & Sentiment Check</h3>
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          {wellnessHistory.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem' }}>
                  {wellnessHistory[0].mood === 'Happy' ? '😊' : wellnessHistory[0].mood === 'Sad' ? '😢' : wellnessHistory[0].mood === 'Stressed' ? '😰' : '😐'}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>
                    Latest Mood: <strong style={{ color: '#D8B296' }}>{wellnessHistory[0].mood}</strong>
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Checked on: {new Date(wellnessHistory[0].created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                  </span>
                </div>
              </div>
              <h5 style={{ margin: '0 0 6px 0', color: '#fafafa', fontSize: '0.92rem' }}>AI Recommendations:</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {(() => {
                  try {
                    return JSON.parse(wellnessHistory[0].suggestions).map((s, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                    ));
                  } catch {
                    return <li>{wellnessHistory[0].suggestions}</li>;
                  }
                })()}
              </ul>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>No wellness check completed yet today.</p>
              <Link to="/student/wellness" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}>
                Start Wellness Check
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Summary */}
      {attendanceSummary.length > 0 && (
        <div className="dashboard-section">
          <h3 className="section-title">Attendance Breakdown by Course</h3>
          <div className="attendance-bars">
            {attendanceSummary.map(item => (
              <div key={item.subject} className="att-bar-item">
                <div className="att-bar-label">
                  <span>{item.subject}</span>
                  <span className={`att-pct ${item.percentage < 75 ? 'att-low' : 'att-ok'}`}>{item.percentage}%</span>
                </div>
                <div className="att-bar-track">
                  <div
                    className={`att-bar-fill ${item.percentage < 75 ? 'att-fill-low' : 'att-fill-ok'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="att-bar-meta">{item.present}/{item.total_classes} classes attended</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
