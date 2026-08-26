import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PRESET_ROLES = [
  'AI / Machine Learning Engineer',
  'Full-Stack Cloud Developer',
  'Cybersecurity & Network Analyst',
  'Data Scientist & Analytics Lead'
];

const DEFAULT_SKILLS = {
  'AI / Machine Learning Engineer': 'Python, SQL, PyTorch, Linear Algebra',
  'Full-Stack Cloud Developer': 'JavaScript, React, Node.js, HTML, CSS',
  'Cybersecurity & Network Analyst': 'Linux, Networking, TCP/IP, Python, Wireshark',
  'Data Scientist & Analytics Lead': 'Python, SQL, Pandas, Statistics, Excel'
};

export default function CareerGuidance() {
  const { user } = useAuth();
  const prn = user?.prn || 'PRN000';
  
  const [selectedRole, setSelectedRole] = useState('AI / Machine Learning Engineer');
  const [skillsInput, setSkillsInput] = useState('Python, SQL, PyTorch, Linear Algebra');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await API.get(`/career/profile/${prn}`);
        setProfile(res.data);
        if (res.data.targetRole) {
          setSelectedRole(res.data.targetRole);
        }
        if (res.data.skillsAcquired?.length > 0) {
          setSkillsInput(res.data.skillsAcquired.join(', '));
        }
      } catch (err) {
        console.error("Error loading career profile:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prn]);

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    if (DEFAULT_SKILLS[newRole]) {
      setSkillsInput(DEFAULT_SKILLS[newRole]);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await API.post('/career/analyze', {
        prn,
        targetRole: selectedRole,
        currentSkills: skillsInput
      });
      setProfile(res.data.analysis);
      setToastMessage(`🎉 Career Roadmap synthesized for ${res.data.analysis.targetRole || selectedRole}!`);
      setTimeout(() => setToastMessage(null), 4000);
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
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* TOAST MESSAGE */}
      {toastMessage && (
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
          {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.18)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0.6rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.2), rgba(212, 175, 148, 0.1))',
            border: '1px solid rgba(230, 203, 184, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🚀
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: '#fafafa' }}>
              AI Career Path & Skill Gap Analyzer
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.92rem' }}>
              Align your coursework and lab practice toward high-demand industry roles with AI milestone roadmaps.
            </p>
          </div>
        </div>

        {/* INPUT CONTROLS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.8rem' }}>
          <div className="field-group" style={{ margin: 0 }}>
            <label className="field-label" style={{ color: '#e4e4e7', fontWeight: '600' }}>Target Career Role</label>
            <select 
              className="field-input" 
              value={selectedRole} 
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: '10px' }}
            >
              {PRESET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="field-group" style={{ margin: 0 }}>
            <label className="field-label" style={{ color: '#e4e4e7', fontWeight: '600' }}>Your Current Skills (comma separated)</label>
            <input 
              type="text" 
              className="field-input" 
              value={skillsInput} 
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Python, SQL, Linux, Networking"
              style={{ background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: '10px' }}
            />
          </div>
        </div>

        <button 
          onClick={handleAnalyze} 
          disabled={analyzing}
          style={{
            marginTop: '1.5rem',
            padding: '0.85rem 2rem',
            background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
            color: '#1a120c',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: analyzing ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(216, 178, 150, 0.3)',
            transition: 'all 0.25s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {analyzing ? '⚡ Synthesizing Roadmap...' : '⚡ Generate AI Gap Analysis & Roadmap'}
        </button>
      </div>

      {profile && (
        <>
          {/* STATS & SKILL CHIPS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* MATCH SCORE CARD */}
            <div style={{
              background: 'rgba(18, 18, 24, 0.65)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.8rem',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                Role Alignment Match
              </span>
              <div style={{
                fontSize: '3.6rem',
                fontWeight: '800',
                margin: '0.8rem 0',
                color: profile.matchPercentage >= 70 ? '#34d399' : '#D8B296',
                letterSpacing: '-1px'
              }}>
                {profile.matchPercentage}%
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Targeting: <strong style={{ color: '#ffffff' }}>{profile.targetRole || selectedRole}</strong>
              </p>
            </div>

            {/* SKILLS ACQUIRED */}
            <div style={{
              background: 'rgba(18, 18, 24, 0.65)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.8rem',
              backdropFilter: 'blur(20px)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✅</span> Validated Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skillsAcquired?.map((s, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(52, 211, 153, 0.1)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* SKILLS MISSING / GAP */}
            <div style={{
              background: 'rgba(18, 18, 24, 0.65)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.8rem',
              backdropFilter: 'blur(20px)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎯</span> Critical Skill Gap
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skillsMissing?.map((s, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    + {s}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* ROADMAP TIMELINE */}
          <div style={{
            background: 'rgba(18, 18, 24, 0.65)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#fafafa' }}>
              <span>🗺️</span> Recommended Learning Roadmap
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {profile.roadmap?.map((step, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1.1rem 1.4rem',
                  background: step.status === 'COMPLETED' ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `4px solid ${step.status === 'COMPLETED' ? '#34d399' : step.status === 'IN_PROGRESS' ? '#D8B296' : 'rgba(255,255,255,0.1)'}`,
                  borderTop: '1px solid var(--border-subtle)',
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: step.status === 'COMPLETED' ? '#34d399' : step.status === 'IN_PROGRESS' ? '#D8B296' : 'rgba(255,255,255,0.08)',
                    color: step.status === 'IN_PROGRESS' ? '#1a120c' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    {step.status === 'COMPLETED' ? '✓' : step.step || idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '14px', color: '#ffffff' }}>{step.title}</strong>
                  </div>
                  <span className="badge" style={{
                    background: step.status === 'COMPLETED' ? 'rgba(52, 211, 153, 0.12)' : step.status === 'IN_PROGRESS' ? 'rgba(216, 178, 150, 0.12)' : 'rgba(255,255,255,0.04)',
                    color: step.status === 'COMPLETED' ? '#34d399' : step.status === 'IN_PROGRESS' ? '#D8B296' : '#a1a1aa'
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
