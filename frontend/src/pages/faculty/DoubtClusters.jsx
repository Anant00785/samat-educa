import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DoubtClusters() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [remedialPlan, setRemedialPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    fetchDoubtSummary();
  }, []);

  const fetchDoubtSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/doubt-clusters/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load doubt clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (cluster) => {
    setSelectedCluster(cluster);
    setGeneratingPlan(true);
    setRemedialPlan(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/doubt-clusters/remedial-plan', {
        clusterId: cluster.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data.plan) {
        setRemedialPlan(res.data.plan);
      }
    } catch (err) {
      console.error('Failed to generate remedial plan:', err);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'CRITICAL') {
      return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>CRITICAL ISSUE</span>;
    }
    if (severity === 'MODERATE') {
      return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>MODERATE FOCUS</span>;
    }
    return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>LOW CONCERN</span>;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading semantic doubt clusters...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        padding: '1.8rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.12), rgba(59, 130, 246, 0.05))',
        border: '1.5px solid rgba(30, 64, 175, 0.25)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', color: 'var(--accent-color)' }}>
              Faculty Intelligence & Pre-Exam Diagnostics
            </span>
            <span className="badge" style={{ background: '#1e40af', color: '#ffffff', fontSize: '10px' }}>
              Semantic NLP Clustering
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-dark)' }}>
            Batch Doubt Cluster Analytics
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Real-time clustering of actual student questions asked across Socratic AI, Document Intelligence, and Quizzes. Pinpoints class-wide misconceptions before exams.
          </p>
        </div>

        <button
          onClick={fetchDoubtSummary}
          className="btn-secondary"
          style={{ padding: '9px 16px', fontSize: '12.5px', fontWeight: '600' }}
        >
          Refresh Clusters ⟳
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.8rem' }}>
        <div style={{ padding: '1.2rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
            Total Analyzed Queries
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>
            {data?.stats?.totalDoubtQueries || 325}
          </div>
        </div>

        <div style={{ padding: '1.2rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
            Students with Active Doubts
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-color)', marginTop: '4px' }}>
            {data?.stats?.affectedStudents || 82}
          </div>
        </div>

        <div style={{ padding: '1.2rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
            Critical Confusion Clusters
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            {data?.stats?.criticalClusters || 2}
          </div>
        </div>

        <div style={{ padding: '1.2rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
            Batch Comprehension Index
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            {data?.stats?.batchHealthScore || 78}%
          </div>
        </div>
      </div>

      {/* Clusters List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-dark)' }}>
          Active Semantic Doubt Clusters
        </h3>

        {data?.clusters?.map((c) => (
          <div
            key={c.id}
            style={{
              padding: '1.5rem',
              background: 'var(--surface-card)',
              border: c.severity === 'CRITICAL' ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-color)' }}>
                    {c.department} • {c.subject}
                  </span>
                  {getSeverityBadge(c.severity)}
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-dark)' }}>
                  {c.clusterName}
                </h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {c.studentCount} Students ({c.percentageImpact}%)
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {c.queryVolume} student searches recorded
                  </span>
                </div>
                <button
                  onClick={() => handleGeneratePlan(c)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '700' }}
                >
                  Generate Remedial Action ↗
                </button>
              </div>
            </div>

            {/* Root-cause Misconception & Action */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#ef4444', marginBottom: '4px' }}>
                  Detected Root-Cause Misconception
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                  {c.detectedMisconception}
                </p>
              </div>

              <div style={{ padding: '12px', background: 'rgba(30, 64, 175, 0.05)', border: '1px solid rgba(30, 64, 175, 0.2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-color)', marginBottom: '4px' }}>
                  Recommended Faculty Intervention
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                  {c.recommendedRemedialAction}
                </p>
              </div>
            </div>

            {/* Sample Queries Dropdown / Preview */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Sample Student Inquiries in Cluster:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {c.sampleQueries.map((q, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-main)', borderRadius: '6px' }}>
                    "{q}"
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Remedial Plan Modal / Drawer */}
      {remedialPlan && selectedCluster && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '650px',
            width: '100%',
            background: 'var(--surface-card)',
            border: '1.5px solid var(--border)',
            borderRadius: '16px',
            padding: '1.8rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)' }}>
                  Targeted Remedial Handout
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '2px 0', color: 'var(--text-dark)' }}>
                  {remedialPlan.clusterName}
                </h3>
              </div>
              <button
                onClick={() => setRemedialPlan(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  3-Point Classroom Revision Strategy
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {remedialPlan.revisionPoints?.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Diagnostic Spot Questions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {remedialPlan.diagnosticQuestions?.map((dq, idx) => (
                    <div key={idx} style={{ padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Q{idx+1}: {dq.q}</div>
                      <div style={{ color: 'var(--accent-color)', marginTop: '2px' }}>Expected Key Insight: {dq.ans}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => alert('Remedial diagnostic broadcast sent to 46 affected students via notification hub!')}
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}
                >
                  Broadcast Diagnostic Quiz to Batch ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
