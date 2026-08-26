import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, faculty: 0, departments: 0, pendingFees: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [studentsRes, facultyRes, deptRes, feesRes] = await Promise.all([
          API.get('/students'),
          API.get('/faculty'),
          API.get('/departments'),
          API.get('/fees'),
        ]);
        const pending = feesRes.data.filter(f => f.status === 'PENDING').length;
        setStats({
          students:    studentsRes.data.length,
          faculty:     facultyRes.data.length,
          departments: deptRes.data.length,
          pendingFees: pending,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Students',    value: stats.students,    icon: '🎓', color: 'stat-blue',   link: '/admin/students' },
    { label: 'Total Faculty',     value: stats.faculty,     icon: '👩‍🏫', color: 'stat-purple', link: '/admin/faculty' },
    { label: 'Departments',       value: stats.departments, icon: '🏛️', color: 'stat-green',  link: '#' },
    { label: 'Pending Fee Dues',  value: stats.pendingFees, icon: '💰', color: 'stat-orange', link: '/admin/fees' },
  ];

  const barData = {
    labels: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Information Tech'],
    datasets: [
      {
        label: 'Students Enrollment',
        data: [120, 90, 60, 45, 110], // Mock Data (or use real data if available via API)
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Faculty Count',
        data: [15, 12, 8, 5, 14],
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0' }
      }
    },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-heading">Admin Overview</h2>
        <p className="page-subtitle">College ERP at a glance</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <Link to={card.link} key={card.label} className={`stat-card ${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="chart-container" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', height: '400px' }}>
          <h3 className="section-title">Department Insights</h3>
          <div style={{ height: '300px' }}>
            <Bar options={chartOptions} data={barData} />
          </div>
        </div>

        <div className="dashboard-actions" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <Link to="/admin/students" className="action-card">
              <span className="action-icon">➕</span>
              <span>Add New Student</span>
            </Link>
            <Link to="/admin/faculty" className="action-card">
              <span className="action-icon">➕</span>
              <span>Add New Faculty</span>
            </Link>
            <Link to="/admin/fees" className="action-card">
              <span className="action-icon">💳</span>
              <span>Manage Fees</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
