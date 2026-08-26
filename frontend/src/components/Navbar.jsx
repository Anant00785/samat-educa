import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const pageTitles = {
  '/admin':              'Admin Campus OS',
  '/admin/predictive':   'Predictive Campus Risk Intelligence',
  '/admin/cctv':         'Smart CCTV & Safety Analytics',
  '/admin/students':     'Manage Students',
  '/admin/faculty':      'Manage Faculty',
  '/admin/departments':  'Departments & Campuses',
  '/admin/fees':         'Financial Management',

  '/faculty':            'Faculty Dashboard',
  '/faculty/attendance': 'Smart Face Attendance Scanner',
  '/faculty/predictive': 'Student Early Warning & Risk Engine',
  '/faculty/exam-violations': 'Proctored Exam Violations Review',
  '/faculty/create-exam': 'Create Proctored Assessment',

  '/student':            'Student Portal',
  '/student/attendance': 'Attendance Analytics',
  '/student/marks':      'Gradebook & Performance',
  '/student/fees':       'Fee Status & Payments',
  '/student/study-plan': 'AI Adaptive Study Planner',
  '/student/career':     'AI Career Path Guidance',
  '/student/wellness':   'Mood Fusion & Wellness Check',
  '/student/wearable':   'Wearable BioStress Monitor',
  '/student/leaderboard':'Academic Gamification & Leaderboard',
  '/student/exam':       'AI Proctored Examination',

  '/parent':             'Parent Portal — Child Performance Dashboard',
};

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'HyperCampus AI';

  return (
    <header className="navbar" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'rgba(10, 12, 24, 0.75)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>
          {title}
        </h1>
        <span style={{
          fontSize: '11px',
          padding: '3px 8px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--accent-color)',
          fontWeight: '500'
        }}>
          🏢 Tech Campus Pune
        </span>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a
          href="/presentation.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '5px 12px',
            background: 'rgba(216, 178, 150, 0.12)',
            border: '1px solid rgba(216, 178, 150, 0.3)',
            borderRadius: '20px',
            color: '#F3E5D8',
            fontSize: '11.5px',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.2s'
          }}
          title="Open Hackathon Master Presentation Deck"
        >
          <span>📊</span> Pitch Deck ↗
        </a>

        <NotificationDropdown />

        <div className="navbar-user" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '5px 12px 5px 6px',
          borderRadius: '30px',
          border: '1px solid var(--border)'
        }}>
          <div className="user-avatar-sm" style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="navbar-email" style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-dark)' }}>
              {user?.email}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
