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
        setNotification(`🎉 Task Completed! +${res.data.xpGained || 75} XP awarded to your profile!`);
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
      setNotification('✨ AI adaptive schedule synthesized based on upcoming exams & weak topics!');
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
      case 'URGENT': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '#ef4444' };
      case 'HIGH':   return { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '#f97316' };
      case 'MEDIUM': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '#eab308' };
      default:       return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '#6366f1' };
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Synthesizing Adaptive Study Schedule...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* NOTIFICATION TOAST */}
      {notification && (
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
          {notification}
        </div>
      )}

      {/* HEADER SECTION */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>📅</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>AI Adaptive Study Planner</h2>
          </div>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Dynamically shifts study priority toward upcoming exam dates & subjects requiring score improvement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={generateAdaptivePlan} 
            disabled={generating}
            className="btn-primary"
            style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
          >
            {generating ? 'Calculating Priority...' : '⚡ AI Refresh Priorities'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.8rem 1.2rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* UPCOMING EXAM COUNTDOWN CARDS */}
      <div>
        <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏳</span> Upcoming Exam Countdowns
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {data.upcomingExams?.map((exam) => (
            <div key={exam.id} style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.2rem',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-dark)' }}>{exam.subject}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{exam.type} • {exam.examDate}</span>
              </div>
              <div style={{
                background: exam.daysLeft <= 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                border: `1px solid ${exam.daysLeft <= 3 ? '#ef4444' : '#6366f1'}`,
                padding: '6px 12px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', display: 'block', color: exam.daysLeft <= 3 ? '#f87171' : '#a5b4fc' }}>
                  {exam.daysLeft}d
                </span>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-light)' }}>Countdown</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STUDY TASKS LIST */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            Active Revision & Lab Practice Tasks ({data.totalCompleted} Done / {data.tasks.length} Total)
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            Each completed task earns XP for your Academic Rank!
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
                padding: '1rem 1.2rem',
                background: isDone ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isDone ? 'rgba(52, 211, 153, 0.3)' : 'var(--border)'}`,
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}>
                <input 
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleTaskStatus(task)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#34d399' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{
                      fontSize: '14px',
                      color: isDone ? 'var(--text-light)' : 'var(--text-dark)',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}>
                      {task.subject_name}
                    </strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {task.priority}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: isDone ? '#64748b' : '#cbd5e1',
                    textDecoration: isDone ? 'line-through' : 'none'
                  }}>
                    {task.topic}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    Est. {task.estimated_hours} hrs • Due {task.target_date}
                  </span>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
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
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            width: '450px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Add Custom Study Goal</h3>
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
