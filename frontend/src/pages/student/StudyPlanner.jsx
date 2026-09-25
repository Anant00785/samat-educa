import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudyPlanner() {
  const { user } = useAuth();
  const prn = user?.prn || 'PRN000';

  const [data, setData] = useState({ tasks: [], upcomingExams: [], totalCompleted: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ subject_name: '', topic: '', target_date: '', priority: 'HIGH', estimated_hours: 2 });
  const [notification, setNotification] = useState(null);

  const fetchPlanner = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/study-planner/${prn}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading study planner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanner();
  }, [prn]);

  const toggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await API.put(`/study-planner/${task.plan_id}/status`, {
        status: nextStatus,
        prn
      });

      if (nextStatus === 'COMPLETED') {
        setNotification(`Task Completed: +${res.data.xpGained || 75} XP awarded.`);
        setTimeout(() => setNotification(null), 4000);
      }

      fetchPlanner();
    } catch (err) {
      console.error(err);
    }
  };

  const generateAdaptivePlan = async () => {
    try {
      setGenerating(true);
      await API.post('/study-planner/generate', { prn });
      setNotification('AI adaptive schedule synthesized based on upcoming exams and weak topics.');
      setTimeout(() => setNotification(null), 4000);
      fetchPlanner();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.subject_name || !newTask.topic) return;
    try {
      await API.post('/study-planner/add-custom', {
        prn,
        ...newTask
      });
      setShowAddModal(false);
      setNewTask({ subject_name: '', topic: '', target_date: '', priority: 'HIGH', estimated_hours: 2 });
      fetchPlanner();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT': return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH':   return { bg: 'rgba(249, 115, 22, 0.12)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'MEDIUM': return { bg: 'rgba(234, 179, 8, 0.12)', color: '#d97706', border: 'rgba(234, 179, 8, 0.3)' };
      default:       return { bg: 'rgba(99, 102, 241, 0.12)', color: '#1e40af', border: 'rgba(99, 102, 241, 0.3)' };
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Synthesizing Adaptive Study Schedule...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(52, 211, 153, 0.12)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '10px',
          color: '#16a34a',
          fontWeight: '600',
          fontSize: '13.5px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {notification}
        </div>
      )}

      {/* HEADER SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(139, 92, 246, 0.04))',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0, color: 'var(--text-dark)' }}>
              Adaptive Study Planner
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '0.9rem' }}>
            Dynamically shifts study priority toward upcoming exam dates and subjects requiring score improvement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={generateAdaptivePlan} 
            disabled={generating}
            className="btn-primary"
            style={{ padding: '0.75rem 1.3rem', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            {generating ? 'Calculating Priorities...' : 'Refresh AI Priorities'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.75rem 1.1rem',
              borderRadius: '8px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-dark)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* EXAM READINESS & BURNOUT RISK SCORECARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* Exam Readiness Score */}
        <div style={{ padding: '1.3rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
              Aggregate Exam Readiness
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              84% Ready
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Based on syllabus & quiz coverage
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: '#10b981' }}>
            84%
          </div>
        </div>

        {/* Study Density & Burnout Index */}
        <div style={{ padding: '1.3rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
              Study Density / Burnout Risk
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3b82f6', marginTop: '4px' }}>
              Optimal (2.4h/d)
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Low burnout risk • Balanced pace
            </span>
          </div>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 10px', fontSize: '11px' }}>
            NORMAL
          </span>
        </div>

        {/* Syllabus Topics Covered */}
        <div style={{ padding: '1.3rem', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
              Syllabus Coverage Depth
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-color)', marginTop: '4px' }}>
              18 / 22 Topics
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              4 topics scheduled for revision
            </span>
          </div>
          <span className="badge" style={{ background: 'rgba(30, 64, 175, 0.12)', color: 'var(--accent-color)', padding: '6px 10px', fontSize: '11px' }}>
            ON TRACK
          </span>
        </div>
      </div>

      {/* SYLLABUS TOPIC HEATMAP */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '1.5rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-dark)' }}>
              Live Syllabus Topic Heatmap
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Green = Mastered, Yellow = In Progress, Red = Immediate Revision Needed
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>🟢 Mastered (12)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>🟡 In Progress (6)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>🔴 Needs Review (4)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {[
            { topic: "Snell's Law & Wave Optics", subject: 'Physics', status: 'MASTERED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)' },
            { topic: 'Projectile 2D Motion', subject: 'Physics', status: 'MASTERED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)' },
            { topic: 'Binary Search Trees & AVL', subject: 'DSA', status: 'MASTERED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)' },
            { topic: 'Recursion Call Stack Frames', subject: 'DSA', status: 'NEEDS_REVIEW', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)' },
            { topic: 'OS Deadlock & Banker Algorithm', subject: 'OS', status: 'IN_PROGRESS', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)' },
            { topic: 'Virtual Memory & Page Replacement', subject: 'OS', status: 'MASTERED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)' },
            { topic: 'Gibbs Free Energy & Entropy', subject: 'Chemistry', status: 'IN_PROGRESS', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)' },
            { topic: 'Buffer Solutions & Equilibrium', subject: 'Chemistry', status: 'NEEDS_REVIEW', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 12px',
                background: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong style={{ fontSize: '12.5px', color: 'var(--text-dark)', display: 'block' }}>{item.topic}</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{item.subject}</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: item.color, textTransform: 'uppercase' }}>
                {item.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING EXAM COUNTDOWN CARDS */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0', color: 'var(--text-dark)' }}>
          Upcoming Exam Countdowns
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {data.upcomingExams?.map((exam) => (
            <div key={exam.id} style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div>
                <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--text-dark)' }}>{exam.subject}</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{exam.type} • {exam.examDate}</span>
              </div>
              <div style={{
                background: exam.daysLeft <= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 64, 175, 0.08)',
                border: `1px solid ${exam.daysLeft <= 3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 64, 175, 0.25)'}`,
                padding: '6px 12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', display: 'block', color: exam.daysLeft <= 3 ? '#ef4444' : 'var(--accent-color)' }}>
                  {exam.daysLeft}d
                </span>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Countdown</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STUDY TASKS LIST */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '1.6rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.3rem', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-dark)' }}>
            Active Revision & Lab Practice Tasks ({data.totalCompleted} Done / {data.tasks.length} Total)
          </h3>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            Each completed task awards XP to your profile.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {data.tasks?.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const badge = getPriorityBadge(task.priority);
            return (
              <div key={task.plan_id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem 1.1rem',
                background: isDone ? 'rgba(52, 211, 153, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDone ? 'rgba(52, 211, 153, 0.3)' : 'var(--border)'}`,
                borderRadius: '10px',
                transition: 'all 0.2s ease'
              }}>
                <input 
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleTaskStatus(task)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{
                      fontSize: '13.5px',
                      color: isDone ? 'var(--text-muted)' : 'var(--text-dark)',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}>
                      {task.subject_name}
                    </strong>
                    <span style={{
                      padding: '2px 7px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '700',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {task.priority}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12.5px',
                    color: isDone ? 'var(--text-muted)' : 'var(--text-secondary)',
                    textDecoration: isDone ? 'line-through' : 'none'
                  }}>
                    {task.topic}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Est. {task.estimated_hours} hrs • Due {task.target_date}
                  </span>
                  <span className="badge" style={{ background: 'rgba(30, 64, 175, 0.1)', color: 'var(--accent-color)' }}>
                    +{task.xp_reward || 50} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD CUSTOM TASK MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '2rem',
            width: '450px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-dark)' }}>Add Custom Study Goal</h3>
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field-group">
                <label className="field-label">Subject</label>
                <input 
                  className="field-input" 
                  value={newTask.subject_name} 
                  onChange={e => setNewTask({...newTask, subject_name: e.target.value})}
                  placeholder="e.g. Operating Systems" 
                  required 
                />
              </div>
              <div className="field-group">
                <label className="field-label">Topic / Chapter</label>
                <input 
                  className="field-input" 
                  value={newTask.topic} 
                  onChange={e => setNewTask({...newTask, topic: e.target.value})}
                  placeholder="e.g. Solve 5 scheduling algorithm problems" 
                  required 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="field-group">
                  <label className="field-label">Target Date</label>
                  <input 
                    type="date"
                    className="field-input" 
                    value={newTask.target_date} 
                    onChange={e => setNewTask({...newTask, target_date: e.target.value})}
                    required 
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Priority</label>
                  <select 
                    className="field-input" 
                    value={newTask.priority} 
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Goal</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-danger" style={{ padding: '0 1.5rem' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
