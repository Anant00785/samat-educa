import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function CCTVMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchCCTV = async () => {
    try {
      setLoading(true);
      const res = await API.get('/cctv/zones');
      setData(res.data);
      if (res.data.zones?.length > 0 && !selectedZone) {
        setSelectedZone(res.data.zones[0]);
      }
    } catch (err) {
      console.error("Error fetching CCTV analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCCTV();
  }, []);

  const triggerAnomaly = async (camName) => {
    try {
      await API.post('/cctv/trigger-anomaly', {
        camera_name: camName,
        description: 'Occupancy surge: Zone density exceeded safety threshold by +35%'
      });
      setActionMessage(`🚨 Security flag logged on ${camName}`);
      setTimeout(() => setActionMessage(null), 4000);
      fetchCCTV();
    } catch (err) {
      console.error(err);
    }
  };

  const clearAnomaly = async (camName) => {
    try {
      await API.post('/cctv/resolve-anomaly', { camera_name: camName });
      setActionMessage(`✅ Anomaly cleared on ${camName}`);
      setTimeout(() => setActionMessage(null), 4000);
      fetchCCTV();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Connecting to Campus CCTV Stream Analytics...</p>
      </div>
    );
  }

  const zones = data?.zones || [];
  const summary = data?.summary || {};

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ACTION MESSAGE */}
      {actionMessage && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(239, 68, 68, 0.2))',
          border: '1px solid #f87171',
          borderRadius: '12px',
          color: '#f87171',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {actionMessage}
        </div>
      )}

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))',
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
            <span style={{ fontSize: '28px' }}>📹</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Smart CCTV & Campus Safety Analytics</h2>
          </div>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Real-time classroom occupancy headcounts, restricted perimeter monitoring, and computer vision anomaly alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Campus Headcount</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34d399' }}>{summary.totalOccupancy} Students</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', padding: '0.8rem 1.2rem', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Active Cameras</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#a5b4fc' }}>{summary.totalCameras} Feeds</div>
          </div>
        </div>
      </div>

      {/* FEED & DETAIL SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* LIVE CAMERA FEED SIMULATOR */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.8rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong style={{ fontSize: '14px' }}>
              🔴 Feed: {selectedZone?.camera_name || 'CAM-01'} ({selectedZone?.zone_location})
            </strong>
            <span className="badge" style={{ background: selectedZone?.anomaly_detected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)', color: selectedZone?.anomaly_detected ? '#f87171' : '#34d399' }}>
              {selectedZone?.anomaly_detected ? '⚠️ ANOMALY' : 'LIVE'}
            </span>
          </div>

          {/* SIMULATED CAMERA SCREEN */}
          <div style={{
            width: '100%',
            height: '240px',
            background: '#050508',
            borderRadius: '12px',
            border: `2px solid ${selectedZone?.anomaly_detected ? '#ef4444' : '#6366f1'}`,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0,0,0,0.8)'
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              pointerEvents: 'none'
            }} />

            <div style={{ textAlign: 'center', zIndex: 2 }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {selectedZone?.anomaly_detected ? '🚨' : '👥'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>
                {selectedZone?.occupancy_count} / {selectedZone?.capacity} Occupants
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Computer Vision Density Estimation: {Math.round(((selectedZone?.occupancy_count || 0) / (selectedZone?.capacity || 1)) * 100)}%
              </span>
            </div>

            <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', color: '#34d399', fontFamily: 'monospace' }}>
              REC • 30 FPS • 1080p
            </div>
          </div>

          {/* SIMULATION CONTROLS FOR SELECTED ZONE */}
          <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
            <button 
              onClick={() => triggerAnomaly(selectedZone?.camera_name)}
              className="btn-danger"
              style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
            >
              ⚠️ Trigger Surge Anomaly
            </button>
            <button 
              onClick={() => clearAnomaly(selectedZone?.camera_name)}
              className="btn-success"
              style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
            >
              ✓ Clear Anomaly
            </button>
          </div>
        </div>

        {/* ZONE LIST */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.8rem',
          backdropFilter: 'blur(16px)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>All Monitored Campus Zones</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {zones.map((z) => {
              const isSelected = selectedZone?.camera_name === z.camera_name;
              const occPct = Math.round((z.occupancy_count / z.capacity) * 100);
              return (
                <div 
                  key={z.camera_name}
                  onClick={() => setSelectedZone(z)}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? '#6366f1' : z.anomaly_detected ? '#ef4444' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{z.camera_name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', marginLeft: '8px' }}>{z.zone_location}</span>
                    </div>
                    <span className="badge" style={{
                      background: z.anomaly_detected ? 'rgba(239, 68, 68, 0.2)' : occPct > 80 ? 'rgba(249, 115, 22, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                      color: z.anomaly_detected ? '#f87171' : occPct > 80 ? '#fb923c' : '#34d399'
                    }}>
                      {z.status} ({occPct}%)
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, occPct)}%`,
                      background: z.anomaly_detected ? '#ef4444' : occPct > 80 ? '#fb923c' : '#34d399'
                    }} />
                  </div>

                  {z.anomaly_description && (
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#f87171' }}>
                      🚨 {z.anomaly_description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
