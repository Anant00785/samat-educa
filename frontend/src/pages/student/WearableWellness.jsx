import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function WearableWellness() {
  const { user } = useAuth();
  const prn = user?.prn || 'PRN000';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/wearable/live/${prn}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading wearable telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [prn]);

  const triggerSimulation = async (mode) => {
    try {
      setSimulating(true);
      const res = await API.post('/wearable/simulate-reading', { prn, mode });
      setMessage(`BioSensor stream updated: ${res.data.telemetry.status_label}`);
      setTimeout(() => setMessage(null), 4000);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Syncing with Wearable Bio-Sensor Telemetry...</p>
      </div>
    );
  }

  const tel = data?.currentTelemetry || {};
  const isHighStress = tel.stress_index > 65;

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* NOTIFICATION TOAST */}
      {message && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
          border: '1px solid #6366f1',
          borderRadius: '12px',
          color: '#a5b4fc',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {message}
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
            <span style={{ fontSize: '28px' }}>⌚</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Wearable Bio-Stress & Recovery Monitor</h2>
          </div>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Continuous non-invasive autonomic stress tracking via PPG pulse rate, HRV indices, and sleep cycles.
          </p>
        </div>

        <div style={{
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#34d399',
          fontWeight: '600',
          fontSize: '13px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
          Sensor Sync Online (Demo Stream)
        </div>
      </div>

      {/* 4 BIOMETRIC GAUGES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        {/* HEART RATE */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>❤️</span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', marginTop: '6px' }}>Heart Rate</span>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: tel.heart_rate > 90 ? '#f87171' : '#34d399' }}>
            {tel.heart_rate} <span style={{ fontSize: '1rem', fontWeight: '500' }}>BPM</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Resting Target: 60-80 BPM</span>
        </div>

        {/* HRV */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>📈</span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', marginTop: '6px' }}>Heart Rate Variability (HRV)</span>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: tel.hrv > 50 ? '#34d399' : '#fb923c' }}>
            {tel.hrv} <span style={{ fontSize: '1rem', fontWeight: '500' }}>ms</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Higher HRV = Better Recovery</span>
        </div>

        {/* STRESS INDEX */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', marginTop: '6px' }}>Autonomic Stress Index</span>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: isHighStress ? '#f87171' : '#a5b4fc' }}>
            {tel.stress_index} <span style={{ fontSize: '1rem', fontWeight: '500' }}>/ 100</span>
          </div>
          <span style={{ fontSize: '11px', color: isHighStress ? '#f87171' : '#34d399', fontWeight: '600' }}>
            {tel.status_label}
          </span>
        </div>

        {/* SLEEP DURATION */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>🌙</span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', marginTop: '6px' }}>Sleep & Recovery</span>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: '#34d399' }}>
            {tel.sleep_hours} <span style={{ fontSize: '1rem', fontWeight: '500' }}>hrs</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Deep Sleep: 2.1 hrs • {tel.steps} Steps</span>
        </div>

      </div>

      {/* INTERACTIVE SIMULATION DEMO CONTROLS */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(16px)'
      }}>
        <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🧪</span> Live Telemetry Scenario Simulator
        </h3>
        <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: '0 0 1.2rem 0' }}>
          Demonstrate how the system handles physiological shifts during exam pressure versus deep parasympathetic restoration.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => triggerSimulation('EXAM_STRESS')} 
            disabled={simulating}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🚨 Simulate High Exam Stress (HR 105, HRV 32)
          </button>

          <button 
            onClick={() => triggerSimulation('DEEP_REST')} 
            disabled={simulating}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              background: 'rgba(52, 211, 153, 0.2)',
              border: '1px solid #34d399',
              color: '#34d399',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🌿 Simulate Deep Recovery State (HR 64, HRV 78)
          </button>

          <button 
            onClick={() => triggerSimulation('NORMAL')} 
            disabled={simulating}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid #6366f1',
              color: '#a5b4fc',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⚡ Normal Study Focus (HR 76, HRV 60)
          </button>
        </div>
      </div>

      {/* HARDWARE / API INTEGRATION READY SPECIFICATION */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
        backdropFilter: 'blur(16px)'
      }}>
        <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔌</span> Hardware Integration Specification (Production Ready)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '12px', color: 'var(--text-light)' }}>
          <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Fitbit Web API v1.2</strong>
            OAuth 2.0 Authorization Code Flow • Scopes: <code>heartrate</code>, <code>sleep</code>, <code>activity</code>
          </div>
          <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Garmin Health SDK</strong>
            Real-time Stress Index & Body Battery PUSH Webhooks via Enterprise Companion API
          </div>
          <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <strong style={{ color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Apple HealthKit Sync</strong>
            Direct iOS Client BLE sync via native CoreBluetooth & HealthKit telemetry daemon
          </div>
        </div>
      </div>

    </div>
  );
}
