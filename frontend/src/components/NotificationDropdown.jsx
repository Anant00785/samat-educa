import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.alert_id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', icon: '🚨' };
      case 'HIGH':     return { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fb923c', icon: '⚠️' };
      case 'WARNING':  return { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', text: '#facc15', icon: '🔔' };
      default:         return { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#818cf8', icon: 'ℹ️' };
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-dark)',
          fontSize: '18px',
          transition: 'all 0.2s ease'
        }}
        title="Smart Alerts Center"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            borderRadius: '50%',
            fontSize: '11px',
            fontWeight: 'bold',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: 0,
          width: '360px',
          maxHeight: '480px',
          background: 'rgba(12, 14, 28, 0.95)',
          backdropFilter: 'blur(25px)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <strong style={{ fontSize: '15px' }}>Smart Alert System</strong>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            {loading && notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', fontSize: '13px' }}>
                Fetching live campus alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', fontSize: '13px' }}>
                ✨ All clear! No active notifications.
              </div>
            ) : (
              notifications.map((n) => {
                const style = getSeverityStyle(n.severity);
                return (
                  <div 
                    key={n.alert_id}
                    onClick={(e) => markAsRead(n.alert_id, e)}
                    style={{
                      padding: '0.8rem',
                      borderRadius: '10px',
                      background: n.is_read ? 'rgba(255, 255, 255, 0.02)' : style.bg,
                      borderLeft: `4px solid ${style.border}`,
                      borderTop: '1px solid var(--border)',
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: n.is_read ? 0.65 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: style.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{style.icon}</span> {n.title}
                      </span>
                      {!n.is_read && (
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: style.border }} />
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dark)', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '10px', color: 'var(--text-light)' }}>
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {n.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
