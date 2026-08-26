import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function MarksPage() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [prn, setPrn] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await API.get(`/students/by-user/${user.userId}`);
        const studentPrn = profileRes.data.prn;
        setPrn(studentPrn);
        const { data } = await API.get(`/marks/${studentPrn}`);
        setMarks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.userId]);

  // Group marks by subject
  const grouped = marks.reduce((acc, m) => {
    if (!acc[m.subject]) acc[m.subject] = { subject: m.subject, credits: m.credits, entries: [] };
    acc[m.subject].entries.push(m);
    return acc;
  }, {});

  const examTypeColor = { CIA: 'pill-blue', SEMESTER: 'pill-purple', PRACTICAL: 'pill-green' };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Marks & Results</h2>
          <p className="page-subtitle">PRN: {prn}</p>
        </div>
      </div>

      {Object.values(grouped).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No marks records found yet.</p>
        </div>
      ) : (
        Object.values(grouped).map(({ subject, credits, entries }) => {
          const total = entries.reduce((s, e) => s + Number(e.score), 0);
          const max   = entries.reduce((s, e) => s + Number(e.total), 0);
          const pct   = max > 0 ? Math.round((total / max) * 100) : 0;
          return (
            <div key={subject} className="marks-card">
              <div className="marks-card-header">
                <div>
                  <h3 className="marks-subject">{subject}</h3>
                  <span className="marks-credits">{credits} Credits</span>
                </div>
                <div className="marks-total">
                  <span className={`marks-pct ${pct >= 60 ? 'text-success' : 'text-danger'}`}>{pct}%</span>
                  <span className="marks-raw">{total}/{max}</span>
                </div>
              </div>
              <div className="marks-entries">
                {entries.map(e => (
                  <div key={e.mark_id} className="mark-entry">
                    <span className={`status-pill ${examTypeColor[e.exam_type] || 'pill-blue'}`}>{e.exam_type}</span>
                    <div className="mini-bar-track flex-1">
                      <div className="mini-bar-fill att-fill-ok" style={{ width: `${(e.score / e.total) * 100}%` }} />
                    </div>
                    <span className="mark-score">{e.score}/{e.total}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
