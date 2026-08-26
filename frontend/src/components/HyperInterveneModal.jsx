import React, { useState, useEffect } from 'react';
import API from '../api/axios';

export default function HyperInterveneModal({ prn, studentName, isOpen, onClose, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchPlan = async () => {
    if (!prn) return;
    try {
      setLoading(true);
      const res = await API.get(`/interventions/student/${prn}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching intervention data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && prn) {
      fetchPlan();
    }
  }, [isOpen, prn]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await API.post(`/interventions/generate/${prn}`);
      setData(prev => ({
        ...prev,
        riskScore: res.data.riskScore,
        riskLevel: res.data.riskLevel,
        breakdown: res.data.breakdown,
        reasons: res.data.reasons,
        activeInterventions: res.data.interventions,
        allInterventions: res.data.interventions
      }));
      setToast(`⚡ HyperIntervene plan formulated! ${res.data.interventions.length} actions assigned.`);
      if (onRefresh) onRefresh();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to generate plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (interventionId) => {
    try {
      await API.post(`/interventions/${interventionId}/complete`, {
        outcome: "Verified and completed via HyperIntervene Command Center."
      });
      setToast("✅ Intervention marked COMPLETED!");
      fetchPlan();
      if (onRefresh) onRefresh();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to complete intervention.");
    }
  };

  const handleReEvaluate = async () => {
    try {
      setReEvaluating(true);
      const res = await API.post(`/interventions/${prn}/re-evaluate`);
      setToast(`🔄 Risk re-evaluated from ${res.data.beforeRisk} ➔ ${res.data.currentRisk} (${res.data.currentLevel})! Delta: ${res.data.riskDelta >= 0 ? `-${res.data.riskDelta}` : `+${Math.abs(res.data.riskDelta)}`} pts`);
      fetchPlan();
      if (onRefresh) onRefresh();
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to re-evaluate risk.");
    } finally {
      setReEvaluating(false);
    }
  };

  if (!isOpen) return null;

  const riskScore = data?.riskScore || 0;
  const riskLevel = data?.riskLevel || 'LOW';
  const isHigh = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';
  const riskColor = riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'HIGH' ? '#f97316' : riskLevel === 'MEDIUM' ? '#eab308' : '#34d399';

  // Extract timeline from the first active intervention if present
  const activeList = data?.activeInterventions || [];
  const completedList = data?.completedInterventions || [];
  const latestTimeline = activeList[0]?.timeline || completedList[0]?.timeline || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'rgba(14, 14, 20, 0.96)',
        border: '1px solid rgba(216, 178, 150, 0.22)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2.25rem',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(216, 178, 150, 0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem'
      }}>
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            color: '#a1a1aa',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          ✕
        </button>

        {/* TOAST ALERT */}
        {toast && (
          <div style={{
            padding: '0.85rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(216, 178, 150, 0.15))',
            border: '1px solid #34d399',
            borderRadius: '12px',
            color: '#34d399',
            fontWeight: '600',
            fontSize: '13px'
          }}>
            {toast}
          </div>
        )}

        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingRight: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                HyperIntervene AI Command Center
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Target: <strong style={{ color: '#ffffff' }}>{studentName || data?.student?.first_name || prn}</strong> ({prn}) • {data?.student?.department || 'Computer Science'} • Semester {data?.student?.semester || 4}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              border: `1.5px solid ${riskColor}`,
              borderRadius: '12px',
              padding: '6px 14px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: '700' }}>
                Calculated Risk
              </span>
              <strong style={{ fontSize: '1.4rem', color: riskColor, fontWeight: '800' }}>
                {riskScore} <span style={{ fontSize: '12px', opacity: 0.8 }}>/100 ({riskLevel})</span>
              </strong>
            </div>

            <button 
              onClick={handleReEvaluate}
              disabled={reEvaluating}
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(216, 178, 150, 0.3)',
                color: '#F3E5D8',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '12.5px',
                cursor: reEvaluating ? 'wait' : 'pointer'
              }}
            >
              {reEvaluating ? 'Evaluating...' : '🔄 Re-evaluate Risk'}
            </button>
          </div>
        </div>

        {/* 1. WHY SECTION: MULTI-FACTOR REASON BREAKDOWN */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.4rem',
          backdropFilter: 'blur(16px)'
        }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> 1. Why is this student flagged? (Root Cause Breakdown)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data?.reasons?.map((reason, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderLeft: `3px solid ${isHigh ? '#ef4444' : '#D8B296'}`,
                borderRadius: '8px',
                fontSize: '13px',
                color: '#e4e4e7'
              }}>
                <span style={{ color: isHigh ? '#f87171' : '#D8B296', fontWeight: 'bold' }}>{idx + 1}.</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. WHAT SHOULD WE DO NEXT? RECOMMENDED ACTION PLAN */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.4rem',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> 2. What Should We Do Next? (Assigned Action Plan)
            </h3>

            <button 
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                color: '#1a120c',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: generating ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(216, 178, 150, 0.25)'
              }}
            >
              {generating ? 'Synthesizing...' : '⚡ Formulate / Refresh AI Actions'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading assigned actions...
            </div>
          ) : activeList.length === 0 && completedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px 0' }}>
                No active intervention plan generated yet for this student.
              </p>
              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 20px' }}
              >
                {generating ? 'Generating Plan...' : '🚀 Formulate HyperIntervene Plan'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activeList.map((inv) => (
                <div key={inv.intervention_id} style={{
                  padding: '1.1rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${inv.priority === 'URGENT' ? '#ef4444' : inv.priority === 'HIGH' ? '#f97316' : '#D8B296'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{inv.title}</strong>
                      <span className="badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {inv.priority}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {inv.description}
                    </p>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>👤 <strong>Owner:</strong> {inv.owner_role} ({inv.owner_name})</span>
                      <span>📅 <strong>Due:</strong> {inv.due_date}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleComplete(inv.intervention_id)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      color: '#34d399',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Mark Complete
                  </button>
                </div>
              ))}

              {completedList.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Completed Interventions ({completedList.length})
                  </span>
                  {completedList.map(c => (
                    <div key={c.intervention_id} style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.015)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#a1a1aa',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <span>✓ {c.title} ({c.owner_role})</span>
                      <span style={{ color: '#34d399', fontSize: '11px' }}>Completed: {new Date(c.completed_at || c.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. EVENT TIMELINE & AUDIT TRAIL */}
        {latestTimeline.length > 0 && (
          <div style={{
            background: 'rgba(18, 18, 24, 0.6)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.4rem',
            backdropFilter: 'blur(16px)'
          }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span> 3. Intervention Progression Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '8px' }}>
              {latestTimeline.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#D8B296',
                    marginTop: '6px',
                    boxShadow: '0 0 8px rgba(216, 178, 150, 0.6)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#ffffff' }}>{item.title}</strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
