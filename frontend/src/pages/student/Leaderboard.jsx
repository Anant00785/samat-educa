import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const prn = user?.prn || 'PRN000';

  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [profRes, leadRes] = await Promise.all([
          API.get(`/gamification/profile/${prn}`),
          API.get('/gamification/leaderboard')
        ]);
        setProfile(profRes.data);
        setLeaderboard(leadRes.data);
      } catch (err) {
        console.error("Error loading gamification hub:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [prn]);

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Calculating Academic XP & Leaderboard Standings...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER GAMIFICATION STATS */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(234, 179, 8, 0.12))',
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
            <span style={{ fontSize: '28px' }}>🏆</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Academic Gamification Hub</h2>
          </div>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Earn XP and unlock achievement badges strictly through academic consistency, high test scores, and study streak milestones.
          </p>
        </div>

        {/* PROFILE STATS CAPSULE */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border)',
            padding: '0.8rem 1.5rem',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Academic Level</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#a5b4fc' }}>
              Lvl {profile?.level}
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border)',
            padding: '0.8rem 1.5rem',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Focus Streak</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fb923c' }}>
              🔥 {profile?.streakDays} Days
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border)',
            padding: '0.8rem 1.5rem',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Total Academic XP</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34d399' }}>
              {profile?.xpPoints} XP
            </div>
          </div>
        </div>
      </div>

      {/* LEVEL PROGRESSION BAR */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span>Current Rank: <strong style={{ color: '#a5b4fc' }}>{profile?.rankTitle}</strong></span>
          <span style={{ color: 'var(--text-light)' }}>{profile?.currentLevelProgress} / {profile?.nextLevelXp} XP to Level {(profile?.level || 1) + 1}</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((profile?.currentLevelProgress || 0) / (profile?.nextLevelXp || 250)) * 100}%`,
            background: 'linear-gradient(90deg, #6366f1, #34d399)',
            transition: 'width 0.8s ease'
          }} />
        </div>
      </div>

      {/* BADGES SHOWCASE */}
      <div>
        <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎖️</span> Earned Academic Badges
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {profile?.badges?.map((badge, idx) => (
            <div key={idx} style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: `1px solid ${badge.unlocked ? 'rgba(52, 211, 153, 0.4)' : 'var(--border)'}`,
              borderRadius: '14px',
              padding: '1.2rem',
              backdropFilter: 'blur(16px)',
              textAlign: 'center',
              opacity: badge.unlocked ? 1 : 0.45
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{badge.icon}</span>
              <strong style={{ fontSize: '14px', display: 'block', color: badge.unlocked ? 'var(--text-dark)' : 'var(--text-light)' }}>
                {badge.name}
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-light)' }}>
                {badge.desc}
              </p>
              {badge.unlocked ? (
                <span className="badge" style={{ marginTop: '8px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                  ✓ Unlocked
                </span>
              ) : (
                <span className="badge" style={{ marginTop: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
                  🔒 Locked
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CAMPUS LEADERBOARD TABLE */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(16px)'
      }}>
        <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👑</span> Campus Academic Leaderboard
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-light)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.8rem 1rem' }}>Rank</th>
              <th style={{ padding: '0.8rem 1rem' }}>Student</th>
              <th style={{ padding: '0.8rem 1rem' }}>Department</th>
              <th style={{ padding: '0.8rem 1rem' }}>Level</th>
              <th style={{ padding: '0.8rem 1rem' }}>Streak</th>
              <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Total XP</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((stu) => {
              const isCurrent = stu.prn === prn;
              return (
                <tr key={stu.prn} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  fontSize: '13px'
                }}>
                  <td style={{ padding: '1rem', fontWeight: '700', fontSize: '15px' }}>
                    {stu.badgeIcon} #{stu.rank}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{stu.name}</strong> {isCurrent && <span style={{ color: '#a5b4fc', fontSize: '11px' }}>(You)</span>}
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)' }}>{stu.prn}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{stu.department}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
                      Lvl {stu.level}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#fb923c', fontWeight: '600' }}>
                    🔥 {stu.streakDays}d
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: '#34d399', fontSize: '14px' }}>
                    {stu.xpPoints} XP
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
