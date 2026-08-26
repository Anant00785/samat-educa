import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import HyperInterveneModal from '../../components/HyperInterveneModal';

export default function Student360() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prnParam } = useParams();

  // If faculty/admin passes PRN in query or route param, use it; otherwise default to logged in user's PRN
  const [targetPrn, setTargetPrn] = useState(prnParam || user?.prn || 'PRN000');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInterveneModalOpen, setIsInterveneModalOpen] = useState(false);

  const fetchStudent360 = async (prnToFetch = targetPrn) => {
    try {
      setLoading(true);
      // If student, fetch user's PRN if missing
      let prn = prnToFetch;
      if (!prn && user?.role === 'STUDENT') {
        const profRes = await API.get(`/students/by-user/${user.userId}`);
        prn = profRes.data.prn;
        setTargetPrn(prn);
      }
      
      const res = await API.get(`/student-360/${prn || 'PRN000'}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading Student 360 profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent360();
  }, [user]);

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Synthesizing Student 360° Digital Twin...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content" style={{ padding: '2rem' }}>
        <div className="alert alert-error">Unable to load Student 360 profile. Please verify credentials.</div>
      </div>
    );
  }

  const { student, scores, academic, attendance, engagement, study, career, wellness, aiInsight, strengths, attentionAreas, trends } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#D8B296';
    if (score >= 40) return '#fb923c';
    return '#f87171';
  };

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. STUDENT IDENTITY & DIGITAL TWIN HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.2)',
        borderRadius: '24px',
        padding: '2.25rem',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(243, 229, 216, 0.25), rgba(216, 178, 150, 0.12))',
            border: '1px solid rgba(216, 178, 150, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            🎯
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
                {student.first_name} {student.last_name}
              </h2>
              <span className="badge" style={{ fontSize: '12px', padding: '4px 10px' }}>
                {student.prn}
              </span>
              <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                ● Active Digital Twin
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
              {student.department} • Semester {student.semester} • 🏛️ {student.campus_name || 'Main Tech Campus'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsInterveneModalOpen(true)}
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
              color: '#1a120c',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(216, 178, 150, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ⚡ Open HyperIntervene
          </button>
        </div>
      </div>

      {/* 2. SIX REAL READINESS & INTELLIGENCE METRIC GAUGES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Academic Score */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.4rem',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Academic Score</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '6px 0', color: getScoreColor(scores.academic) }}>
            {scores.academic} <span style={{ fontSize: '13px', opacity: 0.6 }}>/100</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trend: {academic.trend}</span>
        </div>

        {/* Attendance */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.4rem',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Attendance</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '6px 0', color: scores.attendance >= 75 ? '#34d399' : '#f87171' }}>
            {scores.attendance}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{attendance.presentClasses}/{attendance.totalClasses} sessions</span>
        </div>

        {/* Engagement Score */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.4rem',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Engagement</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '6px 0', color: getScoreColor(scores.engagement) }}>
            {scores.engagement} <span style={{ fontSize: '13px', opacity: 0.6 }}>/100</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Level {engagement.level} • {engagement.xp} XP</span>
        </div>

        {/* Study Consistency */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.4rem',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Study Consistency</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '6px 0', color: getScoreColor(scores.studyConsistency) }}>
            {scores.studyConsistency} <span style={{ fontSize: '13px', opacity: 0.6 }}>/100</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{study.overdueCount} Overdue Tasks</span>
        </div>

        {/* Career Readiness */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.4rem',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Career Readiness</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '6px 0', color: getScoreColor(scores.careerReadiness) }}>
            {scores.careerReadiness}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {career.targetRole}
          </span>
        </div>

        {/* Wellness Signal */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.4rem',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Wellness Signal</span>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', margin: '12px 0 8px 0', color: scores.wellnessSignal.includes('Elevated') ? '#f87171' : '#34d399' }}>
            {scores.wellnessSignal}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AI-derived non-medical indicator</span>
        </div>
      </div>

      {/* 3. AI HOLISTIC INSIGHT & PRIMARY FRICTION ISSUE */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid rgba(216, 178, 150, 0.25)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <span style={{ fontSize: '22px' }}>🤖</span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, color: '#ffffff' }}>
            AI Student Intelligence Diagnostic
          </h3>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderLeft: '4px solid #D8B296',
          borderTop: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#D8B296', fontWeight: '700', letterSpacing: '0.06em' }}>
            Primary Actionable Friction
          </span>
          <h4 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '4px 0 8px 0' }}>
            {aiInsight.primaryIssue}
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#e4e4e7', lineHeight: '1.5' }}>
            {aiInsight.primaryWhy}
          </p>
        </div>

        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#fafafa' }}>
          💡 AI Prescribed Strategic Recommendations:
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {aiInsight.recommendations.map((rec, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              color: '#d4d4d8'
            }}>
              <span style={{ color: '#D8B296', fontWeight: '700' }}>{i + 1}.</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. STRENGTHS vs AREAS REQUIRING ATTENTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* STRENGTHS */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '1.8rem',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.2rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span> Key Strengths & Accomplishments
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {strengths.map((str, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'rgba(52, 211, 153, 0.04)',
                borderLeft: '4px solid #34d399',
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                borderRadius: '10px'
              }}>
                <strong style={{ fontSize: '13.5px', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                  {str.title}
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {str.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AREAS REQUIRING ATTENTION */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '1.8rem',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.2rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> Areas Requiring Active Attention
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {attentionAreas.map((att, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.04)',
                borderLeft: `4px solid ${att.severity === 'HIGH' ? '#ef4444' : '#fb923c'}`,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{att.area}</strong>
                  <span className="badge" style={{ fontSize: '10px', color: att.severity === 'HIGH' ? '#f87171' : '#fb923c' }}>
                    {att.severity} PRIORITY
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {att.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. COURSE-WISE PERFORMANCE & ATTENDANCE BREAKDOWN */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊</span> Course Evaluation & Attendance Breakdown
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {academic.subjects.map((sub, i) => (
            <div key={i} style={{
              padding: '1.2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#ffffff' }}>{sub.subject}</strong>
                <span style={{ fontSize: '14px', fontWeight: '800', color: sub.percentage >= 70 ? '#34d399' : '#fb923c' }}>
                  {sub.percentage}%
                </span>
              </div>

              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  height: '100%',
                  width: `${sub.percentage}%`,
                  background: sub.percentage >= 70 ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #fb923c, #ea580c)',
                  transition: 'width 0.8s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Score: {sub.score}/{sub.total}</span>
                <span>{sub.items?.length || 1} Assessment(s)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. WHAT SHOULD I DO NEXT? WORKING ACTION CENTER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.22)',
        borderRadius: '24px',
        padding: '2.25rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 6px 0', color: '#ffffff' }}>
            Ready to Take Action?
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px', maxWidth: '550px' }}>
            Synchronize your study milestones, review weak modules, and accelerate your career roadmap directly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/student/study-planner"
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
              color: '#1a120c',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            📖 Open Study Planner
          </Link>

          <Link
            to="/student/career"
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            🚀 View Career Roadmap
          </Link>

          <Link
            to="/student/wellness"
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            🧠 AI Wellness Check
          </Link>
        </div>
      </div>

      {/* HYPERINTERVENE MODAL */}
      <HyperInterveneModal 
        prn={targetPrn}
        studentName={`${student.first_name} ${student.last_name}`}
        isOpen={isInterveneModalOpen}
        onClose={() => setIsInterveneModalOpen(false)}
        onRefresh={fetchStudent360}
      />

    </div>
  );
}
