import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function ManageFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', dept_id: '', email: '', password: '', subjects: [] });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [fRes, dRes, sRes] = await Promise.all([
        API.get('/faculty'), 
        API.get('/departments'),
        API.get('/subjects')
      ]);
      setFaculty(fRes.data);
      setDepartments(dRes.data);
      setSubjectsList(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubjectToggle = (e) => {
    const value = parseInt(e.target.value, 10);
    setFormData(prev => {
      if (e.target.checked) return { ...prev, subjects: [...prev.subjects, value] };
      else return { ...prev, subjects: prev.subjects.filter(id => id !== value) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    try {
      await API.post('/faculty', formData);
      setFormSuccess('Faculty added successfully!');
      setFormData({ first_name: '', last_name: '', dept_id: '', email: '', password: '', subjects: [] });
      fetchData();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add faculty');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty member?')) return;
    try {
      await API.delete(`/faculty/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete faculty');
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Manage Faculty</h2>
          <p className="page-subtitle">{faculty.length} faculty members</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Faculty'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">New Faculty Registration</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="field-group">
              <label className="field-label">First Name</label>
              <input name="first_name" className="field-input" placeholder="First Name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Last Name</label>
              <input name="last_name" className="field-input" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input name="email" type="email" className="field-input" placeholder="faculty@erp.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input name="password" type="password" className="field-input" placeholder="Initial Password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="field-group col-span-2">
              <label className="field-label">Department</label>
              <select name="dept_id" className="field-input" value={formData.dept_id} onChange={handleChange} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.name}</option>)}
              </select>
            </div>
            
            <div className="field-group col-span-2">
              <label className="field-label">Assign Subjects (Multi-Select)</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                {subjectsList.filter(s => formData.dept_id ? s.dept_id === parseInt(formData.dept_id) : true).map(sub => (
                  <label key={sub.subject_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" value={sub.subject_id} checked={formData.subjects.includes(sub.subject_id)} onChange={handleSubjectToggle} />
                    <span style={{color: '#e2e8f0', fontSize: '0.9rem'}}>{sub.name}</span>
                  </label>
                ))}
              </div>
              <small style={{ color: 'var(--text-light)', marginTop: '0.5rem', display: 'block' }}>Select department first to filter subjects.</small>
            </div>

            {formError   && <div className="alert alert-error col-span-2">{formError}</div>}
            {formSuccess && <div className="alert alert-success col-span-2">{formSuccess}</div>}
            <button type="submit" className="btn-primary col-span-2">Create Faculty Account</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Subjects</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {faculty.length === 0
                ? <tr><td colSpan="6" className="empty-row">No faculty records found</td></tr>
                : faculty.map(f => (
                  <tr key={f.faculty_id}>
                    <td><span className="badge">F{String(f.faculty_id).padStart(3,'0')}</span></td>
                    <td>{f.first_name} {f.last_name}</td>
                    <td>{f.email}</td>
                    <td>{f.department}</td>
                    <td><span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{f.subjects || '-'}</span></td>
                    <td>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(f.faculty_id)}>Delete</button>
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
