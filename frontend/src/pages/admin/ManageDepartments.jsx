import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    try {
      const res = await API.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (editId) {
        await API.put(`/departments/${editId}`, { name });
        setMessage({ type: 'success', text: 'Department updated!' });
      } else {
        await API.post('/departments', { name });
        setMessage({ type: 'success', text: 'Department created!' });
      }
      setName('');
      setEditId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Operation failed' });
    }
  };

  const handleEdit = (d) => {
    setName(d.name);
    setEditId(d.dept_id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? Data might be affected.')) return;
    try {
      await API.delete(`/departments/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete department. It might be in use.');
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Manage Departments</h2>
          <p className="page-subtitle">{departments.length} registered departments</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setName(''); }}>
          {showForm ? '✕ Cancel' : '+ Add Dept'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">{editId ? 'Edit Department' : 'New Department'}</h3>
          <form onSubmit={handleSubmit} className="grid-form" style={{ gridTemplateColumns: '1fr' }}>
            <div className="field-group">
              <label className="field-label">Department Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="field-input" required />
            </div>
            {message && <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>}
            <button type="submit" className="btn-primary" style={{ width: '200px' }}>Save</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Department Name</th><th>Students</th><th>Teachers</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {departments.length === 0
                ? <tr><td colSpan="5" className="empty-row">No departments</td></tr>
                : departments.map(d => (
                  <tr key={d.dept_id}>
                    <td><span className="badge">D{String(d.dept_id).padStart(2,'0')}</span></td>
                    <td>{d.name}</td>
                    <td>{d.student_count || 0}</td>
                    <td>{d.teacher_count || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-sm btn-success" onClick={() => handleEdit(d)}>Edit</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(d.dept_id)}>Delete</button>
                      </div>
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
