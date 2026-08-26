import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

// Helper to load Razorpay SDK
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

export default function ParentDashboard() {
  const [childData, setChildData] = useState(null);
  const [summary, setSummary] = useState('');
  const [interventions, setInterventions] = useState([]);
  const [childFees, setChildFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [payingFee, setPayingFee] = useState(false);

  // SMS & WhatsApp State
  const [parentPhone, setParentPhone] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState(null);

  const fetchChildInfo = async () => {
    try {
      setLoading(true);
      const [childRes, sumRes] = await Promise.all([
        API.get('/parent/child'),
        API.get('/parent/summary')
      ]);
      setChildData(childRes.data.child);
      setSummary(sumRes.data.summary);

      if (childRes.data.child?.prn) {
        const prn = childRes.data.child.prn;
        const [invRes, feeRes] = await Promise.all([
          API.get(`/interventions/student/${prn}`).catch(() => ({ data: null })),
          API.get(`/fees/${prn}`).catch(() => ({ data: [] }))
        ]);
        if (invRes.data) setInterventions(invRes.data.activeInterventions || []);
        setChildFees(feeRes.data || []);
      }
    } catch (err) {
      console.error("Error loading parent dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildInfo();
  }, []);

  const refreshSummary = async () => {
    try {
      setGeneratingSummary(true);
      const res = await API.get('/parent/summary');
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Parent Razorpay Online Payment Flow
  const handlePayChildFee = async (fee) => {
    try {
      setPayingFee(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Unable to load Razorpay Checkout SDK.");
        setPayingFee(false);
        return;
      }

      const orderRes = await API.post('/payments/create-order', { fee_id: fee.fee_id });
      const { orderId, amountInPaise, currency, keyId, studentName, description } = orderRes.data;

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'HyperCampus AI University',
        description: `Parent Fee Payment for ${studentName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await API.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              fee_id: fee.fee_id
            });

            if (verifyRes.data.verified || verifyRes.data.success) {
              setSmsStatus(`✅ Payment of ₹${Number(verifyRes.data.amount).toLocaleString('en-IN')} confirmed! Receipt: ${verifyRes.data.receiptNumber}`);
              await fetchChildInfo();
            }
          } catch (verErr) {
            console.error(verErr);
            alert("Error verifying payment on server.");
          }
        },
        prefill: {
          name: 'Parent / Guardian',
          contact: parentPhone || '9876543210'
        },
        theme: {
          color: '#D8B296'
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to initiate payment.");
    } finally {
      setPayingFee(false);
    }
  };

  // 1-Click Real WhatsApp Dispatch
  const sendWhatsAppReport = () => {
    if (!childData) return;
    const marksText = childData.marks?.map(m => `• ${m.subject}: ${m.score}/${m.total}`).join('%0A') || 'Consistent Coursework';
    const text = `🎓 *HyperCampus AI — Student Academic Report*%0A%0A` +
      `👤 *Student:* ${childData.first_name} ${childData.last_name} (${childData.prn})%0A` +
      `🏛️ *Department:* ${childData.department}, Sem ${childData.semester}%0A` +
      `📋 *Attendance:* ${childData.attendancePercentage}%25 (${childData.presentCount}/${childData.totalClasses} Classes)%0A` +
      `💳 *Fee Status:* ${childData.fees?.status || 'PAID'}%0A%0A` +
      `📊 *Recent Evaluations:*%0A${marksText}%0A%0A` +
      `🤖 *AI Holistic Summary:*%0A${encodeURIComponent(summary)}%0A%0A` +
      `_Generated automatically by HyperCampus AI Campus OS_`;

    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(url, '_blank');
  };

  // Fast2SMS Real Indian Mobile Dispatch
  const sendFast2SMS = async () => {
    if (!parentPhone || parentPhone.replace(/[^0-9]/g, '').length < 10) {
      alert("Please enter a valid 10-digit mobile number for Fast2SMS dispatch.");
      return;
    }
    try {
      setSendingSms(true);
      const res = await API.post('/sms/send-alert', {
        phoneNumber: parentPhone,
        studentName: `${childData.first_name} ${childData.last_name}`,
        prn: childData.prn,
        customMessage: `HyperCampus AI: ${childData.first_name} has ${childData.attendancePercentage}% attendance. View full progress on Parent Portal.`
      });
      setSmsStatus(`✅ Real SMS dispatched to +91 ${res.data.phoneNumber}!`);
      setTimeout(() => setSmsStatus(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to dispatch SMS via gateway.");
    } finally {
      setSendingSms(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Connecting to Parent Portal & Child Records...</p>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="page-content" style={{ padding: '2rem' }}>
        <div className="alert alert-error">No linked student records found for this parent account.</div>
      </div>
    );
  }

  const isLowAttendance = childData.attendancePercentage < 75;

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* STATUS TOAST */}
      {smsStatus && (
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
          {smsStatus}
        </div>
      )}

      {/* HEADER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 203, 184, 0.08), rgba(212, 175, 148, 0.03))',
        border: '1px solid rgba(230, 203, 184, 0.18)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(243, 229, 216, 0.2), rgba(216, 178, 150, 0.1))',
            border: '1px solid rgba(216, 178, 150, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px'
          }}>
            🎓
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0, color: '#fafafa' }}>
                {childData.first_name} {childData.last_name}
              </h2>
              <span className="badge">
                {childData.prn}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
              {childData.department} • Semester {childData.semester} • <strong>Relation: {childData.relation}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{
            background: 'rgba(14, 14, 20, 0.7)',
            padding: '0.8rem 1.4rem',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Overall Attendance</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: isLowAttendance ? '#f87171' : '#34d399' }}>
              {childData.attendancePercentage}%
            </div>
          </div>

          <div style={{
            background: 'rgba(14, 14, 20, 0.7)',
            padding: '0.8rem 1.4rem',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Fee Status</span>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: childData.fees?.status === 'PAID' ? '#34d399' : '#fb923c' }}>
              {childData.fees?.status || 'PAID'}
            </div>
          </div>
        </div>
      </div>

      {/* SEMESTER FEE & ONLINE PAYMENT CARD FOR PARENTS */}
      {childFees.length > 0 && (
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.6rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>💳</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                Semester Fee & Tuition Desk
              </h3>
              <span className="badge" style={{
                background: childFees[0].status === 'PAID' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                color: childFees[0].status === 'PAID' ? '#34d399' : '#fb923c'
              }}>
                {childFees[0].status}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Semester {childFees[0].semester || 5} • Due Date: {new Date(childFees[0].due_date).toLocaleDateString('en-IN')} • Total: <strong>₹{Number(childFees[0].total_amount || childFees[0].amount || 50000).toLocaleString('en-IN')}</strong>
            </p>
          </div>

          <div>
            {childFees[0].status !== 'PAID' ? (
              <button
                onClick={() => handlePayChildFee(childFees[0])}
                disabled={payingFee}
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                  color: '#1a120c',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: payingFee ? 'wait' : 'pointer',
                  boxShadow: '0 4px 16px rgba(216, 178, 150, 0.25)'
                }}
              >
                {payingFee ? 'Processing...' : '💳 Pay Remaining Fee via Razorpay'}
              </button>
            ) : (
              <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '6px 12px', fontSize: '12px' }}>
                ✓ All Dues Cleared
              </span>
            )}
          </div>
        </div>
      )}

      {/* REAL SMS & WHATSAPP GATEWAY DISPATCHER CARD */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fafafa' }}>
            <span>📲</span> Live WhatsApp & Fast2SMS Gateway Dispatcher
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Send real-time attendance, grades, and AI summaries directly to parents' mobile phone numbers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input 
            type="tel"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="Enter 10-digit Mobile No."
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              fontSize: '13px',
              width: '210px'
            }}
          />
          <button 
            onClick={sendFast2SMS}
            disabled={sendingSms}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border)',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {sendingSms ? 'Sending...' : '📨 Send Real SMS'}
          </button>
          <button 
            onClick={sendWhatsAppReport}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
              color: '#1a120c',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📱 Send via WhatsApp
          </button>
        </div>
      </div>

      {/* AI PARENT ACADEMIC SUMMARY */}
      <div style={{
        background: 'rgba(18, 18, 24, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        backdropFilter: 'blur(16px)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
              AI Holistic Academic Progress Summary
            </h3>
          </div>
          <button 
            onClick={refreshSummary} 
            disabled={generatingSummary}
            className="btn-sm btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            {generatingSummary ? 'Synthesizing...' : '🔄 Refresh AI Insight'}
          </button>
        </div>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#e4e4e7', margin: 0, background: 'rgba(255, 255, 255, 0.02)', padding: '1.2rem', borderRadius: '12px', borderLeft: '4px solid #D8B296' }}>
          {summary || 'Loading student evaluation...'}
        </p>
      </div>

      {/* 3 COLUMNS: ATTENDANCE, GRADES, MENTOR CONTACT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* ATTENDANCE CARD */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fafafa' }}>
            <span>📋</span> Classroom Presence
          </h4>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span>Classes Attended</span>
              <strong>{childData.presentCount} / {childData.totalClasses} Sessions</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${childData.attendancePercentage}%`,
                background: isLowAttendance ? 'linear-gradient(90deg, #f87171, #dc2626)' : 'linear-gradient(90deg, #D8B296, #F3E5D8)',
                transition: 'width 0.8s ease'
              }} />
            </div>
          </div>
          {isLowAttendance ? (
            <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
              ⚠️ Attendance is below the mandatory 75% threshold. Please encourage your child to attend daily lectures.
            </div>
          ) : (
            <div style={{ padding: '0.8rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '8px', color: '#34d399', fontSize: '13px' }}>
              ✅ Consistent attendance record. Compliant with university criteria.
            </div>
          )}
        </div>

        {/* MARKS / ACADEMIC CARD */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fafafa' }}>
            <span>📊</span> Course Evaluation Scores
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {childData.marks?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No formal exams registered this week.</p>
            ) : (
              childData.marks.map((m, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.7rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: '#ffffff' }}>{m.subject}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.exam_type}</span>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: (m.score / m.total) >= 0.75 ? '#34d399' : '#fb923c' }}>
                    {m.score} / {m.total}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FACULTY MENTOR ADVISOR */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fafafa' }}>
              <span>👨‍🏫</span> Assigned Faculty Mentor
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '1rem',
              background: 'rgba(216, 178, 150, 0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(216, 178, 150, 0.2)',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '28px' }}>👨‍🏫</span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block', color: '#ffffff' }}>
                  Prof. Ramesh Sharma
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Faculty Advisor & Mentorship Lead
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Institutional Support Desk
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Email: prof.sharma@erp.com • Office: Tech Building Rm 204
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
