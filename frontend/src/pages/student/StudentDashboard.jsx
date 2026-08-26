import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [fees, setFees] = useState([]);
  const [marksSummary, setMarksSummary] = useState([]);
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await API.get(`/students/by-user/${user.userId}`);
        const prn = profileRes.data.prn;
        setProfile(profileRes.data);

        const [attRes, feesRes, marksRes, wellnessRes] = await Promise.all([
          API.get(`/attendance/summary/${prn}`),
          API.get(`/fees/${prn}`),
          API.get(`/marks/summary/${prn}`),
          API.get(`/students/wellness/history/${prn}`).catch(() => ({ data: [] }))
        ]);
        setAttendanceSummary(attRes.data);
        setFees(feesRes.data);
        setMarksSummary(marksRes.data);
        setWellnessHistory(wellnessRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.userId]);

  const avgAttendance = attendanceSummary.length > 0
    ? Math.round(attendanceSummary.reduce((s, r) => s + Number(r.percentage), 0) / attendanceSummary.length)
    : 0;

  const pendingFees = fees.filter(f => f.status === 'PENDING').length;

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Welcome, {profile?.first_name}! 👋</h2>
          <p className="page-subtitle">{profile?.department} · Semester {profile?.semester} · {profile?.prn}</p>
        </div>
      </div>

      <div className="stats-grid">
        <Link to="/student/attendance" className="stat-card stat-blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{avgAttendance}%</span>
            <span className="stat-label">Overall Attendance</span>
          </div>
        </Link>
        <Link to="/student/marks" className="stat-card stat-purple">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{attendanceSummary.length}</span>
            <span className="stat-label">Subjects Enrolled</span>
          </div>
        </Link>
        <Link to="/student/fees" className="stat-card stat-orange">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <span className="stat-value">{pendingFees}</span>
            <span className="stat-label">Pending Fee Dues</span>
          </div>
        </Link>
        <Link to="/student/exam" className="stat-card stat-green">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">Take</span>
            <span className="stat-label">Online Exam</span>
          </div>
        </Link>
        <Link to="/student/wellness" className="stat-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white' }}>
          <div className="stat-icon" style={{ color: 'white' }}>🧠</div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: 'white' }}>AI</span>
            <span className="stat-label" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Wellness Check</span>
          </div>
        </Link>
      </div>

      {/* AI Wellness Section */}
      <div className="dashboard-section" style={{ marginBottom: '25px' }}>
        <h3 className="section-title">AI Wellness & Mood Monitor</h3>
        <div className="table-card" style={{ padding: '20px', borderRadius: '12px' }}>
          {wellnessHistory.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '2rem' }}>
                  {wellnessHistory[0].mood === 'Happy' ? '😊' : wellnessHistory[0].mood === 'Sad' ? '😢' : wellnessHistory[0].mood === 'Stressed' ? '😰' : '😐'}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Your latest mood was analyzed as <strong>{wellnessHistory[0].mood}</strong>
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Checked on: {new Date(wellnessHistory[0].created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                  </span>
                </div>
              </div>
              <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Latest Suggestions:</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {(() => {
                  try {
                    return JSON.parse(wellnessHistory[0].suggestions).map((s, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>{s}</li>
                    ));
                  } catch {
                    return <li>{wellnessHistory[0].suggestions}</li>;
                  }
                })()}
              </ul>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>You haven't run an AI Wellness & Mood Check yet.</p>
              <Link to="/student/wellness" style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', background: 'var(--primary)', color: 'white', display: 'inline-block', fontWeight: '600', fontSize: '0.9rem' }}>
                Check Your Wellness Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Summary */}
      {attendanceSummary.length > 0 && (
        <div className="dashboard-section">
          <h3 className="section-title">Attendance by Subject</h3>
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
                <div className="att-bar-meta">{item.present}/{item.total_classes} classes</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
