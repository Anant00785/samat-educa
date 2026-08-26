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
      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#f87171', icon: '🚨' };
      case 'HIGH':     return { bg: 'rgba(249, 115, 22, 0.1)', border: '#f97316', text: '#fb923c', icon: '⚠️' };
      case 'WARNING':  return { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', text: '#facc15', icon: '🔔' };
      default:         return { bg: 'rgba(124, 107, 196, 0.08)', border: '#7C6BC4', text: '#d4d4d8', icon: 'ℹ️' };
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#ffffff',
          fontSize: '16px',
          transition: 'all 0.2s ease'
        }}
        title="Smart Alerts Center"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            background: '#ffffff',
            color: '#000000',
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: '800',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(124, 107, 196, 0.5)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: '350px',
          maxHeight: '460px',
          background: 'rgba(14, 14, 20, 0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            padding: '0.9rem 1.1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <strong style={{ fontSize: '14px', color: '#ffffff' }}>Smart Alert System</strong>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '11px',
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
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {loading && notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>
                Fetching live alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>
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
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      background: n.is_read ? 'rgba(255, 255, 255, 0.015)' : style.bg,
                      borderLeft: `3px solid ${style.border}`,
                      borderTop: '1px solid var(--border-subtle)',
                      borderRight: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: n.is_read ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '600', fontSize: '12.5px', color: style.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{style.icon}</span> {n.title}
                      </span>
                      {!n.is_read && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.border }} />
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#e4e4e7', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
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
