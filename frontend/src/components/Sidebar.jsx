import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = {
  ADMIN: [
    { path: '/admin', label: 'Overview OS', icon: '🏠' },
    { path: '/admin/predictive', label: 'Predictive Risk', icon: '🔮' },
    { path: '/admin/cctv', label: 'Smart CCTV', icon: '📹' },
    { path: '/admin/departments', label: 'Departments', icon: '🏛️' },
    { path: '/admin/students', label: 'Manage Students', icon: '🎓' },
    { path: '/admin/faculty', label: 'Manage Faculty', icon: '👩‍🏫' },
    { path: '/admin/fees', label: 'Fees & Finance', icon: '💰' },
  ],
  STUDENT: [
    { path: '/student', label: 'Dashboard', icon: '🏠' },
    { path: '/student/360', label: 'Student 360°', icon: '🎯' },
    { path: '/student/learning-hub', label: 'Learning Hub', icon: '📚' },
    { path: '/student/study-plan', label: 'AI Study Planner', icon: '📅' },
    { path: '/student/career', label: 'AI Career Guide', icon: '🚀' },
    { path: '/student/wellness', label: 'Mood Fusion Check', icon: '🧠' },
    { path: '/student/wearable', label: 'Wearable Health', icon: '⌚' },
    { path: '/student/leaderboard', label: 'Gamification & XP', icon: '🏆' },
    { path: '/student/attendance', label: 'Attendance', icon: '📋' },
    { path: '/student/marks', label: 'Grades & Marks', icon: '📊' },
    { path: '/student/fees', label: 'Fees & Dues', icon: '💳' },
    { path: '/student/exam', label: 'Proctored Exam', icon: '📝' },
  ],
  FACULTY: [
    { path: '/faculty', label: 'Dashboard', icon: '🏠' },
    { path: '/faculty/attendance', label: 'Face Attendance', icon: '📷' },
    { path: '/faculty/predictive', label: 'At-Risk Students', icon: '⚠️' },
    { path: '/faculty/exam-violations', label: 'Exam Violations', icon: '🛡️' },
    { path: '/faculty/create-exam', label: 'Create Assessment', icon: '✍️' },
  ],
  PARENT: [
    { path: '/parent', label: 'Child Performance', icon: '👨‍👩‍👧' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = menuItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    ADMIN: 'role-admin',
    FACULTY: 'role-faculty',
    STUDENT: 'role-student',
    PARENT: 'role-admin',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-text" style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
              HyperCampus
            </span>
            <span style={{ fontSize: '9px', color: 'var(--accent-color)', fontWeight: '600', letterSpacing: '1px' }}>
              INTELLIGENT OS
            </span>
          </div>
        </div>
        <div className={`role-badge ${roleColors[user?.role]}`}>
          {user?.role}
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/student' || item.path === '/faculty' || item.path === '/parent'}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
          <div className="user-details">
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
