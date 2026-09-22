import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavSvgIcon({ name }) {
  const iconProps = {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (name) {
    case 'home':
      return <svg {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case 'predictive':
      return <svg {...iconProps}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
    case 'cctv':
      return <svg {...iconProps}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
    case 'department':
      return <svg {...iconProps}><path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3M9 11h2M13 11h2M9 15h2M13 15h2" /></svg>;
    case 'students':
      return <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'faculty':
      return <svg {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'fees':
      return <svg {...iconProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
    case '360':
      return <svg {...iconProps}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
    case 'learning':
      return <svg {...iconProps}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    case 'planner':
      return <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'career':
      return <svg {...iconProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case 'wellness':
      return <svg {...iconProps}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'wearable':
      return <svg {...iconProps}><rect x="6" y="2" width="12" height="20" rx="4" /><line x1="6" y1="6" x2="18" y2="6" /><line x1="6" y1="18" x2="18" y2="18" /></svg>;
    case 'leaderboard':
      return <svg {...iconProps}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" /></svg>;
    case 'attendance':
      return <svg {...iconProps}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case 'marks':
      return <svg {...iconProps}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    case 'exam':
      return <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>;
    case 'rag':
      return <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>;
    case 'camera':
      return <svg {...iconProps}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case 'alert':
      return <svg {...iconProps}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case 'shield':
      return <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    default:
      return <svg {...iconProps}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

const menuItems = {
  ADMIN: [
    { path: '/admin', label: 'Overview OS', icon: 'home' },
    { path: '/admin/predictive', label: 'Predictive Risk', icon: 'predictive' },
    { path: '/admin/cctv', label: 'Smart CCTV', icon: 'cctv' },
    { path: '/admin/departments', label: 'Departments', icon: 'department' },
    { path: '/admin/students', label: 'Manage Students', icon: 'students' },
    { path: '/admin/faculty', label: 'Manage Faculty', icon: 'faculty' },
    { path: '/admin/fees', label: 'Fees & Finance', icon: 'fees' },
  ],
  STUDENT: [
    { path: '/student', label: 'Dashboard', icon: 'home' },
    { path: '/student/360', label: 'Student 360°', icon: '360' },
    { path: '/student/learning-hub', label: 'Learning Hub', icon: 'learning' },
    { path: '/student/study-plan', label: 'AI Study Planner', icon: 'planner' },
    { path: '/student/career', label: 'AI Career Guide', icon: 'career' },
    { path: '/student/wellness', label: 'Mood Fusion Check', icon: 'wellness' },
    { path: '/student/leaderboard', label: 'Gamification & XP', icon: 'leaderboard' },
    { path: '/student/attendance', label: 'Attendance', icon: 'attendance' },
    { path: '/student/marks', label: 'Grades & Marks', icon: 'marks' },
    { path: '/student/fees', label: 'Fees & Dues', icon: 'fees' },
    { path: '/student/exam', label: 'Proctored Exam', icon: 'exam' },
    { path: '/student/rag-assistant', label: 'Document Intelligence', icon: 'rag' },
  ],
  FACULTY: [
    { path: '/faculty', label: 'Dashboard', icon: 'home' },
    { path: '/faculty/attendance', label: 'Face Attendance', icon: 'camera' },
    { path: '/faculty/predictive', label: 'At-Risk Students', icon: 'alert' },
    { path: '/faculty/exam-violations', label: 'Exam Violations', icon: 'shield' },
    { path: '/faculty/create-exam', label: 'Create Assessment', icon: 'exam' },
    { path: '/faculty/rag-generator', label: 'Question Generator', icon: 'rag' },
  ],
  PARENT: [
    { path: '/parent', label: 'Child Performance', icon: 'students' },
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
          <div className="logo-badge" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #F3E5D8, #C99E80)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#120f0d', fontWeight: '900', fontSize: '13px' }}>
            H
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-text" style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.3px' }}>
              HyperCampus
            </span>
            <span style={{ fontSize: '9px', color: 'var(--accent-color)', fontWeight: '600', letterSpacing: '1px' }}>
              INTELLIGENT ERP
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
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <NavSvgIcon name={item.icon} />
            </span>
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
        <button className="logout-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
