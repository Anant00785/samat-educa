import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function ExamViolationsReview() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const res = await API.get('/exams/violations');
      setViolations(res.data || []);
    } catch (err) {
      console.error("Error fetching violations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading AI Proctoring Audit Logs...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(99, 102, 241, 0.1))',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🛡️</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Proctored Exam Violations Review</h2>
          </div>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Automated PoseNet & WebRTC audit tracking tab switches, absence from frame, and suspicious orientation during online examinations.
          </p>
        </div>

        <button 
          onClick={fetchViolations} 
          className="btn-primary"
          style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
        >
          🔄 Refresh Audit Logs
        </button>
      </div>

      {/* VIOLATIONS TABLE */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(16px)'
      }}>
        {violations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            ✨ No exam integrity violations logged.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-light)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.8rem 1rem' }}>Student</th>
                <th style={{ padding: '0.8rem 1rem' }}>Subject</th>
                <th style={{ padding: '0.8rem 1rem' }}>Violation Type</th>
                <th style={{ padding: '0.8rem 1rem' }}>Severity</th>
                <th style={{ padding: '0.8rem 1rem' }}>Score</th>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.violation_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{v.first_name ? `${v.first_name} ${v.last_name}` : v.student_prn}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)' }}>{v.student_prn} • {v.department}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-dark)' }}>{v.subject}</td>
                  <td style={{ padding: '1rem', color: '#f87171', fontWeight: '600' }}>
                    ⚠️ {v.violation_type}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{
                      background: v.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                      color: v.severity === 'CRITICAL' ? '#f87171' : '#fb923c'
                    }}>
                      {v.severity || 'HIGH'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '700', color: v.score >= 50 ? '#34d399' : '#f87171' }}>
                    {v.score}%
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-light)', fontSize: '12px' }}>
                    {new Date(v.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
