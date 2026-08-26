import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ prn: '', first_name: '', last_name: '', dept_id: '', semester: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [sRes, dRes] = await Promise.all([API.get('/students'), API.get('/departments')]);
      setStudents(sRes.data);
      setDepartments(dRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    try {
      await API.post('/students', formData);
      setFormSuccess('Student added successfully!');
      setFormData({ prn: '', first_name: '', last_name: '', dept_id: '', semester: '', email: '', password: '' });
      fetchData();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add student');
    }
  };

  const handleDelete = async (prn) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await API.delete(`/students/${prn}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete student');
    }
  }

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.prn} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Manage Students</h2>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Student'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">New Student Registration</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="field-group">
              <label className="field-label">PRN</label>
              <input name="prn" className="field-input" placeholder="e.g. PRN003" value={formData.prn} onChange={handleChange} required />
            </div>
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
              <input name="email" type="email" className="field-input" placeholder="student@erp.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input name="password" type="password" className="field-input" placeholder="Initial Password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Department</label>
              <select name="dept_id" className="field-input" value={formData.dept_id} onChange={handleChange} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Semester</label>
              <select name="semester" className="field-input" value={formData.semester} onChange={handleChange} required>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            {formError   && <div className="alert alert-error col-span-2">{formError}</div>}
            {formSuccess && <div className="alert alert-success col-span-2">{formSuccess}</div>}
            <button type="submit" className="btn-primary col-span-2">Create Student Account</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar">
          <input className="search-input" placeholder="🔍 Search by name, PRN, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRN</th><th>Name</th><th>Email</th><th>Department</th><th>Semester</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan="6" className="empty-row">No students found</td></tr>
                : filtered.map(s => (
                  <tr key={s.prn}>
                    <td><span className="badge">{s.prn}</span></td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.email}</td>
                    <td>{s.department}</td>
                    <td>Semester {s.semester}</td>
                    <td>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(s.prn)}>Delete</button>
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
