import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminFees() {
  const [analytics, setAnalytics] = useState(null);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionToast, setActionToast] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, overdueRes] = await Promise.all([
        API.get('/fees/admin/analytics'),
        API.get('/fees/admin/overdue').catch(() => ({ data: [] }))
      ]);
      setAnalytics(analyticsRes.data);
      setOverdueList(overdueRes.data || []);
    } catch (err) {
      console.error("Error loading fee analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);

  const handleSendReminder = async (fee_id) => {
    try {
      setSendingId(fee_id);
      const res = await API.post('/fees/admin/send-reminder', { fee_id });
      setSentIds(prev => [...prev, fee_id]);
      setActionToast(res.data.message || "Fee reminder alert dispatched successfully to student & parent!");
      setTimeout(() => setActionToast(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to send reminder alert.");
    } finally {
      setSendingId(null);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Aggregating campus-wide financial & fee analytics...</p>
      </div>
    );
  }

  const { summary, departmentStats, allInvoices } = analytics || { summary: {}, departmentStats: [], allInvoices: [] };

  // Filter invoices
  const filteredInvoices = (allInvoices || []).filter(inv => {
    const matchDept = deptFilter === 'ALL' || (inv.department && inv.department.toLowerCase().includes(deptFilter.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchDept && matchStatus;
  });

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1250px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* TOAST ALERT */}
      {actionToast && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(216, 178, 150, 0.15))',
          border: '1px solid #34d399',
          borderRadius: '12px',
          color: '#34d399',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {actionToast}
        </div>
      )}

      {/* 1. HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.2)',
        borderRadius: '24px',
        padding: '2.25rem',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '30px' }}>💰</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Campus Fee Management & Financial Hub
            </h2>
            <span className="badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Razorpay Integrated
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Live collection tracking, department-wise analytics, automated overdue detection, and digital reconciliation.
          </p>
        </div>
      </div>

      {/* 2. OVERALL KPI SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Invoiced</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#ffffff' }}>
            ₹{Number(summary.totalBilled || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across {summary.totalStudents || 0} Enrolled Students</span>
        </div>

        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Collected</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#34d399' }}>
            ₹{Number(summary.totalCollected || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: '#34d399' }}>Collection Rate: <strong>{summary.collectionRate || '0%'}</strong></span>
        </div>

        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Pending</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#fb923c' }}>
            ₹{Number(summary.totalPending || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{summary.pendingInvoices || 0} Invoices Pending</span>
        </div>

        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Overdue Invoices</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: summary.overdueInvoices > 0 ? '#f87171' : '#34d399' }}>
            {summary.overdueInvoices || 0}
          </div>
          <span style={{ fontSize: '11px', color: summary.overdueInvoices > 0 ? '#f87171' : '#34d399' }}>
            {summary.overdueInvoices > 0 ? 'Past Due Threshold' : 'No Critical Overdues'}
          </span>
        </div>
      </div>

      {/* 3. DEPARTMENT-WISE FEE COLLECTION ANALYTICS */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 1.25rem 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏛️</span> Department-wise Fee Collection Analytics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {departmentStats.map((dept, i) => (
            <div 
              key={i}
              style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px', color: '#ffffff' }}>{dept.department}</strong>
                <span className="badge" style={{ fontSize: '11px' }}>
                  {dept.studentCount} Students
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Collection Rate:</span>
                <strong style={{ color: dept.collectionRate >= 75 ? '#34d399' : '#fb923c' }}>
                  {dept.collectionRate}%
                </strong>
              </div>

              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${dept.collectionRate}%`,
                  background: dept.collectionRate >= 75 ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #fb923c, #f97316)',
                  transition: 'width 0.8s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span>Collected: ₹{Number(dept.totalCollected).toLocaleString('en-IN')}</span>
                <span>Pending: ₹{Number(dept.totalPending).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. OVERDUE INVOICES TRIAGE & REMINDERS */}
      {overdueList.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '20px',
          padding: '1.8rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚨</span> Overdue Fee Invoices Requiring Action ({overdueList.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {overdueList.map((od) => (
              <div 
                key={od.fee_id}
                style={{
                  padding: '1.1rem 1.25rem',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '14px', color: '#ffffff' }}>{od.first_name} {od.last_name}</strong>
                    <span className="badge">{od.prn}</span>
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                      {od.daysOverdue} Days Overdue
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {od.department} • Semester {od.semester || 5} • Amount Due: <strong style={{ color: '#f87171' }}>₹{Number(od.remainingAmount).toLocaleString('en-IN')}</strong> • Due Date: {new Date(od.due_date).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <button
                  onClick={() => handleSendReminder(od.fee_id)}
                  disabled={sendingId === od.fee_id}
                  style={{
                    padding: '9px 18px',
                    background: sentIds.includes(od.fee_id) ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: sentIds.includes(od.fee_id) ? '1px solid #34d399' : '1px solid rgba(239, 68, 68, 0.4)',
                    color: sentIds.includes(od.fee_id) ? '#34d399' : '#f87171',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: sendingId === od.fee_id ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {sendingId === od.fee_id ? '⏳ Dispatching...' : sentIds.includes(od.fee_id) ? '✓ Reminder Sent' : '📢 Send Smart Reminder'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ALL INVOICES TABLE WITH FILTER CONTROLS */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Student Fee Invoices & Records ({filteredInvoices.length})
          </h3>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border)',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12.5px'
              }}
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border)',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12.5px'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Student</th>
                <th>PRN</th>
                <th>Department</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No fee records match selected filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.fee_id}>
                    <td><span className="badge">#{inv.fee_id}</span></td>
                    <td><strong style={{ color: '#ffffff' }}>{inv.first_name} {inv.last_name}</strong></td>
                    <td>{inv.prn}</td>
                    <td>{inv.department}</td>
                    <td>₹{Number(inv.total_amount || inv.amount || 50000).toLocaleString('en-IN')}</td>
                    <td><span style={{ color: '#34d399', fontWeight: '600' }}>₹{Number(inv.paid_amount || (inv.status === 'PAID' ? (inv.total_amount || inv.amount) : 0)).toLocaleString('en-IN')}</span></td>
                    <td>{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className="badge" style={{
                        background: inv.status === 'PAID' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                        color: inv.status === 'PAID' ? '#34d399' : '#fb923c'
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      {inv.status !== 'PAID' ? (
                        <button
                          onClick={() => handleSendReminder(inv.fee_id)}
                          disabled={sendingId === inv.fee_id}
                          style={{
                            padding: '5px 12px',
                            background: sentIds.includes(inv.fee_id) ? 'rgba(52, 211, 153, 0.15)' : 'rgba(216, 178, 150, 0.08)',
                            border: sentIds.includes(inv.fee_id) ? '1px solid #34d399' : '1px solid rgba(216, 178, 150, 0.35)',
                            color: sentIds.includes(inv.fee_id) ? '#34d399' : '#F3E5D8',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: sendingId === inv.fee_id ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {sendingId === inv.fee_id ? 'Sending...' : sentIds.includes(inv.fee_id) ? '✓ Sent' : '📢 Remind'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>✓ Cleared</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
