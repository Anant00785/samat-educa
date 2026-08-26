import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import Tesseract from 'tesseract.js';

export default function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [prn, setPrn] = useState('');
  const [loading, setLoading] = useState(true);
  
  // OCR States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState('');
  const fileInputRef = useRef(null);
  const [targetFeeId, setTargetFeeId] = useState(null);

  useEffect(() => {
    loadFees();
  }, [user.userId]);

  async function loadFees() {
    try {
      setLoading(true);
      const profileRes = await API.get(`/students/by-user/${user.userId}`);
      const studentPrn = profileRes.data.prn;
      setPrn(studentPrn);
      const { data } = await API.get(`/fees/${studentPrn}`);
      setFees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUploadClick = (fee_id) => {
    setTargetFeeId(fee_id);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrScanning(true);
    setOcrProgress(0);
    setOcrLog('Initializing AI OCR Engine...');

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
              setOcrLog(`Scanning Document Data: ${Math.round(m.progress * 100)}%`);
            } else {
              setOcrLog(m.status);
            }
          }
        }
      );

      const text = result.data.text.toLowerCase();
      console.log("[AI OCR Extracted Text]: ", text);

      // Simple AI Check for validation keywords (simulating payment verification)
      if (text.includes('success') || text.includes('successful') || text.includes('paid') || text.includes('transaction')) {
        setOcrLog('Verification Successful! Processing with Bank...');
        
        // Mark as paid in backend
        await API.post(`/fees/ocr-pay/${targetFeeId}`);
        alert('🎉 AI Document Scanner verified your receipt! Fee marked as PAID instantly!');
        await loadFees(); // refresh UI
      } else {
        alert('AI Verification Failed: Could not detect payment confirmation text (e.g. "Success", "Paid") in the uploaded image.');
      }
    } catch (err) {
      console.error(err);
      alert('Error analyzing document with AI.');
    } finally {
      setOcrScanning(false);
      setTargetFeeId(null);
      e.target.value = ''; // clear input
    }
  };

  const paid    = fees.filter(f => f.status === 'PAID');
  const pending = fees.filter(f => f.status === 'PENDING');
  const totalPending = pending.reduce((s, f) => s + Number(f.amount), 0);

  if (loading && fees.length === 0) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Fee Status & Receipts</h2>
          <p className="page-subtitle">PRN: {prn}</p>
        </div>
      </div>

      {ocrScanning && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(0,210,255,0.1), rgba(138,43,226,0.1))',
          border: '1px solid var(--accent-1)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--accent-1)', marginBottom: '1rem' }}>🤖 AI Document Scanner Active</h3>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${ocrProgress}%`, background: 'var(--accent-1)', height: '100%', transition: 'width 0.3s ease' }}></div>
          </div>
          <p style={{ marginTop: '1rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ocrLog}</p>
        </div>
      )}

      {/* Hidden File Input for OCR Verification */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={`stat-card ${pending.length > 0 ? 'stat-orange' : 'stat-green'}`}>
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{pending.length}</span>
            <span className="stat-label">Pending Dues</span>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{paid.length}</span>
            <span className="stat-label">Paid</span>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">₹{totalPending.toLocaleString('en-IN')}</span>
            <span className="stat-label">Amount Due</span>
          </div>
        </div>
      </div>

      <div className="table-card" style={{ marginTop: '2rem' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Fee ID</th><th>Amount</th><th>Due Date</th><th>Status</th><th>AI Verification</th></tr>
            </thead>
            <tbody>
              {fees.length === 0
                ? <tr><td colSpan="5" className="empty-row">No fee records found</td></tr>
                : fees.map(f => (
                  <tr key={f.fee_id}>
                    <td><span className="badge">#{f.fee_id}</span></td>
                    <td>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                    <td>{new Date(f.due_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`status-pill ${f.status === 'PAID' ? 'pill-green' : 'pill-orange'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      {f.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleUploadClick(f.fee_id)}
                          disabled={ocrScanning}
                          style={{
                            padding: '0.5rem 1rem', background: 'transparent',
                            border: '1px solid var(--accent-1)', color: 'var(--accent-1)',
                            borderRadius: '4px', cursor: ocrScanning ? 'not-allowed' : 'pointer', fontSize: '0.9rem'
                          }}>
                          📄 Upload Receipt
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success-color)' }}>✔️ Verified</span>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="info-box info-box-warning" style={{ marginTop: '2rem' }}>
          <span>⚠️</span>
          <p>You have {pending.length} pending payment{pending.length > 1 ? 's' : ''}. Use the AI Verifier to upload your bank/UPI screenshots for instant clearance.</p>
        </div>
      )}
    </div>
  );
}
