import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function PredictiveAnalytics() {
  const [students, setStudents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskRes, overviewRes] = await Promise.all([
        API.get('/predictive/students-at-risk'),
        API.get('/predictive/campus-overview')
      ]);
      setStudents(riskRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      console.error("Error loading predictive data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerIntervention = async (stu) => {
    try {
      await API.post('/predictive/trigger-intervention', {
        prn: stu.prn,
        studentName: stu.name,
        reason: stu.reasons.join(', '),
        action: stu.recommendedAction
      });
      setActionMessage(`⚡ Proactive mentorship alert dispatched for ${stu.name} (${stu.prn})!`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to trigger intervention");
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Computing Explainable Risk Scores...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ACTION MESSAGE TOAST */}
      {actionMessage && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid #34d399',
          borderRadius: '12px',
          color: '#34d399',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {actionMessage}
        </div>
      )}

      {/* HEADER OVERVIEW */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(99, 102, 241, 0.15))',
        border: '1px solid var(--border)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🔮</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Predictive Early Warning System</h2>
          </div>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Multi-factor machine learning heuristic computing real-time attendance risk, academic decline, and stress flags.
          </p>
        </div>

        {/* METRICS */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>High Risk Flags</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f87171' }}>{overview?.summary?.highRiskCount}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Retention Probability</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34d399' }}>{overview?.summary?.retentionProbability}</div>
          </div>
        </div>
      </div>

      {/* STUDENT AT RISK LIST */}
      <div>
        <h3 style={{ fontSize: '1.3rem', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span> Students Requiring Mentorship Attention ({students.length} Evaluated)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map((stu) => {
            const isHigh = stu.riskLevel === 'HIGH';
            const isMed = stu.riskLevel === 'MEDIUM';
            const borderCol = isHigh ? '#ef4444' : isMed ? '#f97316' : '#34d399';
            const bgCol = isHigh ? 'rgba(239, 68, 68, 0.08)' : isMed ? 'rgba(249, 115, 22, 0.06)' : 'rgba(255, 255, 255, 0.02)';

            return (
              <div key={stu.prn} style={{
                background: bgCol,
                borderLeft: `5px solid ${borderCol}`,
                borderTop: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.5rem',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>{stu.name}</strong>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-light)' }}>{stu.prn}</span>
                    <span className="badge" style={{
                      background: isHigh ? 'rgba(239, 68, 68, 0.2)' : isMed ? 'rgba(249, 115, 22, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                      color: isHigh ? '#f87171' : isMed ? '#fb923c' : '#34d399',
                      fontWeight: '700'
                    }}>
                      {stu.riskLevel} RISK ({stu.riskScore}/100)
                    </span>
                  </div>
                  
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-light)' }}>
                    {stu.department} • Semester {stu.semester} • Attendance: <strong>{stu.attendancePercentage}%</strong> • Avg Marks: <strong>{stu.averageMarks}%</strong>
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {stu.reasons.map((r, i) => (
                      <span key={i} style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)',
                        color: isHigh ? '#fca5a5' : '#fed7aa'
                      }}>
                        • {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', maxWidth: '280px', textAlign: 'right' }}>
                    <strong>Recommended:</strong> {stu.recommendedAction}
                  </span>
                  <button 
                    onClick={() => triggerIntervention(stu)}
                    className="btn-sm btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ✉️ Trigger Early Intervention
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
