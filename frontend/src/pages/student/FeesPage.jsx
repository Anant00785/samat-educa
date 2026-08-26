import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import Tesseract from 'tesseract.js';

// Helper to load Razorpay Standard Checkout SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [history, setHistory] = useState([]);
  const [prn, setPrn] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // OCR Fallback States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState('');
  const fileInputRef = useRef(null);
  const [targetFeeId, setTargetFeeId] = useState(null);

  useEffect(() => {
    loadFeesAndHistory();
  }, [user.userId]);

  async function loadFeesAndHistory() {
    try {
      setLoading(true);
      const profileRes = await API.get(`/students/by-user/${user.userId}`);
      const studentPrn = profileRes.data.prn;
      setPrn(studentPrn);
      setStudentProfile(profileRes.data);

      const [feeRes, histRes] = await Promise.all([
        API.get(`/fees/${studentPrn}`),
        API.get(`/payments/history/${studentPrn}`).catch(() => ({ data: [] }))
      ]);

      setFees(feeRes.data || []);
      setHistory(histRes.data || []);
    } catch (err) {
      console.error("Error loading fee details:", err);
    } finally {
      setLoading(false);
    }
  }

  // Real Razorpay Standard Checkout Payment Flow
  const handlePayOnline = async (fee) => {
    try {
      setPaying(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Unable to load Razorpay Checkout SDK. Please check your internet connection.");
        setPaying(false);
        return;
      }

      // 1. Create Order on Server
      const orderRes = await API.post('/payments/create-order', {
        fee_id: fee.fee_id
      });

      const { orderId, amount, amountInPaise, currency, keyId, studentName, description, studentEmail } = orderRes.data;

      // 2. Open Official Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'HyperCampus AI University',
        description: description || `Semester ${fee.semester || 5} Fee Payment`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment on Server
            const verifyRes = await API.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              fee_id: fee.fee_id
            });

            if (verifyRes.data.verified || verifyRes.data.success) {
              setPaymentSuccess(verifyRes.data);
              await loadFeesAndHistory();
              // Fetch digital receipt
              if (verifyRes.data.receiptNumber) {
                openReceipt(verifyRes.data.receiptNumber);
              }
            } else {
              alert("Payment verification failed on server. Please contact finance support.");
            }
          } catch (verErr) {
            console.error("Verification error:", verErr);
            alert("Error finalizing payment verification.");
          }
        },
        prefill: {
          name: studentName,
          email: studentEmail || user?.email,
          contact: '9876543210'
        },
        notes: {
          prn: fee.prn,
          fee_id: fee.fee_id,
          semester: fee.semester
        },
        theme: {
          color: '#D8B296'
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        alert(`Payment Failed: ${response.error.description || 'Transaction declined by bank.'}`);
      });
      razorpayInstance.open();

    } catch (err) {
      console.error("Payment initiation error:", err);
      alert(err.response?.data?.error || "Failed to initiate online payment.");
    } finally {
      setPaying(false);
    }
  };

  const openReceipt = async (receiptNumber) => {
    try {
      const res = await API.get(`/payments/receipt/${receiptNumber}`);
      setReceiptData(res.data);
      setIsReceiptModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Unable to fetch receipt document.");
    }
  };

  // OCR Upload fallback
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
      if (text.includes('success') || text.includes('paid') || text.includes('transaction')) {
        await API.post(`/fees/ocr-pay/${targetFeeId}`);
        alert('🎉 AI Document Scanner verified your receipt! Fee marked as PAID!');
        await loadFeesAndHistory();
      } else {
        alert('AI Verification Failed: Could not detect confirmation text in image.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOcrScanning(false);
      setTargetFeeId(null);
      e.target.value = '';
    }
  };

  const totalBilled = fees.reduce((s, f) => s + Number(f.total_amount || f.amount || 50000), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.paid_amount || (f.status === 'PAID' ? (f.total_amount || f.amount || 50000) : 0)), 0);
  const totalRemaining = Math.max(0, totalBilled - totalPaid);
  const pendingList = fees.filter(f => f.status !== 'PAID');

  if (loading && fees.length === 0) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
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
            <span style={{ fontSize: '30px' }}>💳</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Fee Payment & Financial Desk
            </h2>
            <span className="badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Razorpay Secured
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Student: <strong style={{ color: '#ffffff' }}>{studentProfile?.first_name} {studentProfile?.last_name}</strong> • PRN: {prn} • {studentProfile?.department} • Semester {studentProfile?.semester || 5}
          </p>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Semester Dues</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#ffffff' }}>
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Year 2025-2026</span>
        </div>

        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount Paid</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#34d399' }}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: '#34d399' }}>✓ Verified Transactions</span>
        </div>

        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '600' }}>Remaining Balance</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: totalRemaining > 0 ? '#f87171' : '#34d399' }}>
            ₹{totalRemaining.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: totalRemaining > 0 ? '#f87171' : '#34d399' }}>
            {totalRemaining > 0 ? '🔴 Pending Payment' : '🟢 Fully Cleared'}
          </span>
        </div>
      </div>

      {/* 3. ACTIVE SEMESTER FEE INVOICES */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄</span> Current Semester Fee Breakdown
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fees.map((fee) => {
            const isPaid = fee.status === 'PAID';
            const total = Number(fee.total_amount || fee.amount || 50000);
            const paid = Number(fee.paid_amount || (isPaid ? total : 0));
            const remaining = Math.max(0, total - paid);

            return (
              <div 
                key={fee.fee_id}
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${isPaid ? '#34d399' : '#D8B296'}`,
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                      {fee.description || `Semester ${fee.semester || 5} Tuition & Lab Fee`}
                    </strong>
                    <span className="badge" style={{
                      background: isPaid ? 'rgba(52, 211, 153, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                      color: isPaid ? '#34d399' : '#fb923c',
                      fontWeight: '700'
                    }}>
                      {fee.status}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Invoice #{fee.fee_id} • Due Date: <strong style={{ color: '#ffffff' }}>{new Date(fee.due_date).toLocaleDateString('en-IN')}</strong>
                  </p>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                    <span>Total: <strong style={{ color: '#ffffff' }}>₹{total.toLocaleString('en-IN')}</strong></span>
                    <span>Paid: <strong style={{ color: '#34d399' }}>₹{paid.toLocaleString('en-IN')}</strong></span>
                    <span>Remaining: <strong style={{ color: remaining > 0 ? '#f87171' : '#34d399' }}>₹{remaining.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {!isPaid ? (
                    <>
                      <button
                        onClick={() => handlePayOnline(fee)}
                        disabled={paying}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                          color: '#1a120c',
                          border: '1px solid rgba(255, 255, 255, 0.6)',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '13.5px',
                          cursor: paying ? 'wait' : 'pointer',
                          boxShadow: '0 4px 18px rgba(216, 178, 150, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {paying ? 'Processing...' : `💳 Pay Remaining ₹${remaining.toLocaleString('en-IN')}`}
                      </button>

                      <button
                        onClick={() => handleUploadClick(fee.fee_id)}
                        disabled={ocrScanning}
                        style={{
                          padding: '11px 16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border)',
                          color: '#e4e4e7',
                          borderRadius: '12px',
                          fontSize: '12.5px',
                          cursor: ocrScanning ? 'wait' : 'pointer'
                        }}
                      >
                        📄 AI Scan Receipt
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openReceipt(fee.receipt_number || `HC-FEE-2026-0000${fee.fee_id}`)}
                      style={{
                        padding: '10px 18px',
                        background: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid rgba(52, 211, 153, 0.35)',
                        color: '#34d399',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      📄 View Digital Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden file input for OCR upload */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

      {/* 4. TRANSACTION & PAYMENT HISTORY */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 1.25rem 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🧾</span> Payment History & Transaction Records
        </h3>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Semester</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No previous online transactions recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((tx) => (
                  <tr key={tx.payment_id}>
                    <td><strong style={{ color: '#ffffff' }}>{tx.receipt_number || `HC-FEE-${tx.payment_id}`}</strong></td>
                    <td>Semester {tx.semester || 5}</td>
                    <td><strong style={{ color: '#34d399' }}>₹{Number(tx.amount).toLocaleString('en-IN')}</strong></td>
                    <td><span className="badge">{tx.payment_method || 'Razorpay'}</span></td>
                    <td>{new Date(tx.paid_at || tx.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openReceipt(tx.receipt_number)}
                        style={{
                          padding: '4px 10px',
                          background: 'transparent',
                          border: '1px solid rgba(216, 178, 150, 0.4)',
                          color: '#F3E5D8',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        View ↗
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DIGITAL RECEIPT MODAL */}
      {isReceiptModalOpen && receiptData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'rgba(14, 14, 20, 0.98)',
            border: '1px solid rgba(216, 178, 150, 0.35)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '650px',
            padding: '2.5rem',
            boxShadow: '0 25px 80px rgba(0,0,0,0.95)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <button 
              onClick={() => setIsReceiptModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border)',
                color: '#a1a1aa',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '4px' }}>🏛️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                HYPERCAMPUS AI UNIVERSITY
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Official Digital Fee Payment Receipt
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>STUDENT NAME</span>
                <strong style={{ color: '#ffffff' }}>{receiptData.studentName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>PRN NUMBER</span>
                <strong style={{ color: '#ffffff' }}>{receiptData.prn}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>DEPARTMENT</span>
                <span style={{ color: '#e4e4e7' }}>{receiptData.department || 'Computer Science & AI'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>SEMESTER / YEAR</span>
                <span style={{ color: '#e4e4e7' }}>Semester {receiptData.semester} ({receiptData.academicYear})</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>RECEIPT NUMBER</span>
                <strong style={{ color: '#D8B296' }}>{receiptData.receiptNumber}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>PAYMENT DATE</span>
                <span style={{ color: '#e4e4e7' }}>{new Date(receiptData.paidAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div style={{
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                  {receiptData.description}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Ref: {receiptData.razorpayPaymentId}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>AMOUNT PAID</span>
                <strong style={{ fontSize: '1.5rem', color: '#34d399' }}>
                  ₹{Number(receiptData.amount).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid #34d399' }}>
                ✓ VERIFIED & PAID
              </span>

              <button
                onClick={() => window.print()}
                style={{
                  padding: '9px 18px',
                  background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                  color: '#1a120c',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print / Download Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
