import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchFees = async () => {
    try {
      const { data } = await API.get('/fees');
      setFees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const markPaid = async (fee_id) => {
    setUpdating(fee_id);
    try {
      await API.put(`/fees/${fee_id}`);
      fetchFees();
    } catch (err) {
      alert('Failed to update fee status');
    } finally {
      setUpdating(null);
    }
  };

  const paid    = fees.filter(f => f.status === 'PAID');
  const pending = fees.filter(f => f.status === 'PENDING');
  const totalPending = pending.reduce((s, f) => s + Number(f.amount), 0);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Fees Management</h2>
          <p className="page-subtitle">{pending.length} pending dues — ₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card stat-orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info"><span className="stat-value">{pending.length}</span><span className="stat-label">Pending</span></div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info"><span className="stat-value">{paid.length}</span><span className="stat-label">Paid</span></div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon">💰</div>
          <div className="stat-info"><span className="stat-value">₹{totalPending.toLocaleString('en-IN')}</span><span className="stat-label">Total Due</span></div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>PRN</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {fees.length === 0
                ? <tr><td colSpan="6" className="empty-row">No fee records</td></tr>
                : fees.map(f => (
                  <tr key={f.fee_id}>
                    <td>{f.first_name} {f.last_name}</td>
                    <td><span className="badge">{f.prn}</span></td>
                    <td>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                    <td>{new Date(f.due_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`status-pill ${f.status === 'PAID' ? 'pill-green' : 'pill-orange'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      {f.status === 'PENDING' && (
                        <button
                          className="btn-sm btn-success"
                          onClick={() => markPaid(f.fee_id)}
                          disabled={updating === f.fee_id}
                        >
                          {updating === f.fee_id ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
