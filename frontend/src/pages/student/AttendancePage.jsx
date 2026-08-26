import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function AttendancePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [records, setRecords] = useState([]);
  const [prn, setPrn] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await API.get(`/students/by-user/${user.userId}`);
        const studentPrn = profileRes.data.prn;
        setPrn(studentPrn);

        const [summaryRes, recordsRes] = await Promise.all([
          API.get(`/attendance/summary/${studentPrn}`),
          API.get(`/attendance/${studentPrn}`),
        ]);
        setSummary(summaryRes.data);
        setRecords(recordsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.userId]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const overall = summary.length
    ? Math.round(summary.reduce((s, r) => s + Number(r.percentage), 0) / summary.length)
    : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Your Attendance</h2>
          <p className="page-subtitle">PRN: {prn} · Overall: {overall}%</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className={`status-pill ${overall >= 75 ? 'pill-green' : 'pill-red'}`}>
            {overall >= 75 ? '✓ Adequate' : '⚠ Low Attendance'}
          </span>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'summary' ? 'tab-active' : ''}`} onClick={() => setActiveTab('summary')}>📊 Summary</button>
        <button className={`tab-btn ${activeTab === 'records' ? 'tab-active' : ''}`} onClick={() => setActiveTab('records')}>📋 All Records</button>
      </div>

      {activeTab === 'summary' && (
        <div className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Subject</th><th>Total Classes</th><th>Present</th><th>Absent</th><th>Percentage</th><th>Status</th></tr>
              </thead>
              <tbody>
                {summary.length === 0
                  ? <tr><td colSpan="6" className="empty-row">No attendance records yet</td></tr>
                  : summary.map(s => (
                    <tr key={s.subject}>
                      <td>{s.subject}</td>
                      <td>{s.total_classes}</td>
                      <td className="text-success">{s.present}</td>
                      <td className="text-danger">{s.total_classes - s.present}</td>
                      <td>
                        <div className="mini-bar-track">
                          <div className={`mini-bar-fill ${s.percentage < 75 ? 'att-fill-low' : 'att-fill-ok'}`} style={{ width: `${s.percentage}%` }} />
                        </div>
                        <span className={s.percentage < 75 ? 'text-danger' : 'text-success'}>{s.percentage}%</span>
                      </td>
                      <td>
                        <span className={`status-pill ${s.percentage >= 75 ? 'pill-green' : 'pill-red'}`}>
                          {s.percentage >= 75 ? 'OK' : 'LOW'}
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Subject</th><th>Faculty</th><th>Status</th></tr>
              </thead>
              <tbody>
                {records.length === 0
                  ? <tr><td colSpan="4" className="empty-row">No records found</td></tr>
                  : records.map(r => (
                    <tr key={r.attendance_id}>
                      <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                      <td>{r.subject}</td>
                      <td>{r.faculty_first} {r.faculty_last}</td>
                      <td>
                        <span className={`status-pill ${r.status === 'PRESENT' ? 'pill-green' : 'pill-red'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// trigger reload
