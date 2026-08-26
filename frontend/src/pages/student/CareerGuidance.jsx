import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PRESET_ROLES = [
  'AI / Machine Learning Engineer',
  'Full-Stack Cloud Developer',
  'Cybersecurity & Network Analyst',
  'Data Scientist & Analytics Lead'
];

export default function CareerGuidance() {
  const { user } = useAuth();
  const prn = user?.prn || 'PRN000';
  
  const [selectedRole, setSelectedRole] = useState('AI / Machine Learning Engineer');
  const [skillsInput, setSkillsInput] = useState('Python, SQL, C++, Basic Data Structures');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await API.get(`/career/profile/${prn}`);
        setProfile(res.data);
        if (res.data.targetRole) setSelectedRole(res.data.targetRole);
        if (res.data.skillsAcquired?.length > 0) setSkillsInput(res.data.skillsAcquired.join(', '));
      } catch (err) {
        console.error("Error loading career profile:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prn]);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await API.post('/career/analyze', {
        prn,
        targetRole: selectedRole,
        currentSkills: skillsInput
      });
      setProfile(res.data.analysis);
    } catch (err) {
      console.error(err);
      alert("Error analyzing career path.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading AI Career Guidance Engine...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '28px' }}>🚀</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>AI Career Path & Skill Gap Analyzer</h2>
        </div>
        <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.95rem', maxWidth: '700px' }}>
          Align your coursework, lab practice, and certifications toward high-demand industry roles. The AI model identifies your technical skill gap and synthesizes an actionable milestone roadmap.
        </p>

        {/* INPUT CONTROLS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="field-group">
            <label className="field-label" style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Target Career Role</label>
            <select 
              className="field-input" 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: '10px' }}
            >
              {PRESET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Your Current Skills (comma separated)</label>
            <input 
              type="text" 
              className="field-input" 
              value={skillsInput} 
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Python, SQL, React, C++"
              style={{ background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: '10px' }}
            />
          </div>
        </div>

        <button 
          onClick={handleAnalyze} 
          disabled={analyzing}
          className="btn-primary" 
          style={{ marginTop: '1.2rem', padding: '0.9rem 2rem', fontWeight: '600', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {analyzing ? 'Synthesizing Roadmap...' : '⚡ Generate AI Gap Analysis & Roadmap'}
        </button>
      </div>

      {profile && (
        <>
          {/* STATS & SKILL CHIPS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* MATCH SCORE CARD */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.8rem',
              backdropFilter: 'blur(16px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Role Alignment Match
              </span>
              <div style={{
                fontSize: '3.5rem',
                fontWeight: '800',
                margin: '1rem 0',
                background: 'linear-gradient(135deg, #34d399, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {profile.matchPercentage}%
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                Targeting: <strong>{profile.targetRole || selectedRole}</strong>
              </p>
            </div>

            {/* SKILLS ACQUIRED */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.8rem',
              backdropFilter: 'blur(16px)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> Validated Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skillsAcquired?.map((s, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* SKILLS MISSING / GAP */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.8rem',
              backdropFilter: 'blur(16px)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎯</span> Critical Skill Gap
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skillsMissing?.map((s, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    + {s}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* ROADMAP TIMELINE */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(16px)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🗺️</span> Recommended Learning Roadmap
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profile.roadmap?.map((step, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1rem 1.5rem',
                  background: step.status === 'COMPLETED' ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `4px solid ${step.status === 'COMPLETED' ? '#34d399' : step.status === 'IN_PROGRESS' ? '#6366f1' : '#64748b'}`,
                  borderTop: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: step.status === 'COMPLETED' ? '#34d399' : step.status === 'IN_PROGRESS' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {step.status === 'COMPLETED' ? '✓' : step.step || idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{step.title}</strong>
                  </div>
                  <span className="badge" style={{
                    background: step.status === 'COMPLETED' ? 'rgba(52, 211, 153, 0.15)' : step.status === 'IN_PROGRESS' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: step.status === 'COMPLETED' ? '#34d399' : step.status === 'IN_PROGRESS' ? '#818cf8' : '#94a3b8'
                  }}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
