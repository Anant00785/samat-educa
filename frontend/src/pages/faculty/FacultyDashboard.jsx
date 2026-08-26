import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profRes, studRes, alertsRes] = await Promise.all([
          API.get(`/faculty/by-user/${user.userId}`),
          API.get('/students'),
          API.get('/faculty/alerts/all').catch(() => ({ data: [] }))
        ]);
        setProfile(profRes.data);
        setStudents(studRes.data);
        setAlerts(alertsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.userId]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Welcome, {profile?.first_name}! 👋</h2>
          <p className="page-subtitle">{profile?.department} Department</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Link to="/faculty/attendance" className="stat-card stat-blue">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">Mark</span>
            <span className="stat-label">Attendance</span>
          </div>
        </Link>
        <Link to="/faculty/create-exam" className="stat-card stat-green">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">Create</span>
            <span className="stat-label">Online Exam</span>
          </div>
        </Link>
        <div className="stat-card stat-purple">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <span className="stat-value">{students.length}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">AI Student Wellness Monitor</h3>
        <div className="table-card" style={{ padding: alerts.length > 0 ? '0' : '20px', borderRadius: '12px' }}>
          {alerts.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>Student</th><th>Mood detected</th><th>Suggested Path</th></tr>
                </thead>
                <tbody>
                  {alerts.map(a => {
                    const isPositive = a.mood === 'Happy';
                    return (
                      <tr key={a.id} style={{ background: isPositive ? 'rgba(75, 192, 192, 0.05)' : 'rgba(255, 99, 132, 0.05)' }}>
                        <td>{new Date(a.created_at).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td style={{ fontWeight: 'bold' }}>{a.first_name} {a.last_name} ({a.prn})</td>
                        <td>
                          <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '15px', 
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: isPositive ? '#4bc0c0' : '#ff6384',
                              background: isPositive ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)'
                          }}>
                            {isPositive ? '😊 Happy' : a.mood === 'Sad' ? '😢 Sad' : `😰 ${a.mood}`}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                           {(() => {
                             try {
                               return JSON.parse(a.suggestions).join(' | ');
                             } catch {
                               return a.suggestions;
                             }
                           })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No student wellness alerts logged yet. Wellness checks showing stress or sadness will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Students List</h3>
        <div className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>PRN</th><th>Name</th><th>Department</th><th>Semester</th></tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.prn}>
                    <td><span className="badge">{s.prn}</span></td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.department}</td>
                    <td>Semester {s.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
