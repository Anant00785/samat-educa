import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function ParentDashboard() {
  const [childData, setChildData] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const fetchChildInfo = async () => {
    try {
      setLoading(true);
      const [childRes, sumRes] = await Promise.all([
        API.get('/parent/child'),
        API.get('/parent/summary')
      ]);
      setChildData(childRes.data.child);
      setSummary(sumRes.data.summary);
    } catch (err) {
      console.error("Error loading parent dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildInfo();
  }, []);

  const refreshSummary = async () => {
    try {
      setGeneratingSummary(true);
      const res = await API.get('/parent/summary');
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Connecting to Parent Portal & Child Records...</p>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="page-content" style={{ padding: '2rem' }}>
        <div className="alert alert-error">No linked student records found for this parent account.</div>
      </div>
    );
  }

  const isLowAttendance = childData.attendancePercentage < 75;

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'white',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
          }}>
            🎓
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
                {childData.first_name} {childData.last_name}
              </h2>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                {childData.prn}
              </span>
            </div>
            <p style={{ color: 'var(--text-light)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
              {childData.department} • Semester {childData.semester} • <strong>Relation: {childData.relation}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.8rem 1.2rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Overall Attendance</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: isLowAttendance ? '#f87171' : '#34d399' }}>
              {childData.attendancePercentage}%
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.8rem 1.2rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Fee Status</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: childData.fees?.status === 'PAID' ? '#34d399' : '#fb923c' }}>
              {childData.fees?.status || 'PAID'}
            </div>
          </div>
        </div>
      </div>

      {/* AI PARENT ACADEMIC SUMMARY */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(16px)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>
              AI Holistic Academic & Wellness Summary
            </h3>
          </div>
          <button 
            onClick={refreshSummary} 
            disabled={generatingSummary}
            className="btn-sm btn-primary"
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            {generatingSummary ? 'Synthesizing...' : '🔄 Refresh AI Insight'}
          </button>
        </div>
        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#e2e8f0', margin: 0, background: 'rgba(255, 255, 255, 0.03)', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
          {summary || 'Loading student evaluation...'}
        </p>
      </div>

      {/* 3 COLUMNS: ATTENDANCE, GRADES, WELLNESS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* ATTENDANCE CARD */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Classroom Presence
          </h4>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span>Classes Attended</span>
              <strong>{childData.presentCount} / {childData.totalClasses} Sessions</strong>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${childData.attendancePercentage}%`,
                background: isLowAttendance ? 'linear-gradient(90deg, #f87171, #dc2626)' : 'linear-gradient(90deg, #34d399, #10b981)',
                transition: 'width 0.8s ease'
              }} />
            </div>
          </div>
          {isLowAttendance ? (
            <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
              ⚠️ Attendance is below the mandatory 75% threshold. Please encourage your child to attend daily lectures.
            </div>
          ) : (
            <div style={{ padding: '0.8rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '8px', color: '#34d399', fontSize: '13px' }}>
              ✅ Consistent attendance record. Compliant with university criteria.
            </div>
          )}
        </div>

        {/* MARKS / ACADEMIC CARD */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> Course Evaluation Scores
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {childData.marks?.length === 0 ? (
              <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>No formal exams registered this week.</p>
            ) : (
              childData.marks.map((m, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.7rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{m.subject}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{m.exam_type}</span>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: (m.score / m.total) >= 0.75 ? '#34d399' : '#fb923c' }}>
                    {m.score} / {m.total}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WELLNESS & MENTOR CONTACT */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span> Emotional & Wellness Pulse
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: '10px',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '28px' }}>
                {childData.latestWellness.mood === 'Happy' ? '😊' : childData.latestWellness.mood === 'Stressed' ? '😰' : '🌟'}
              </span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>
                  Status: {childData.latestWellness.mood}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Assessed on {new Date(childData.latestWellness.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>
              Faculty Mentor: <strong>Prof. Ramesh Sharma</strong>
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Email: prof.sharma@erp.com • Office: Tech Bldg 204
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
