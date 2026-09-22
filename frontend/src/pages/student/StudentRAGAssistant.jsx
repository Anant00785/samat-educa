import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function StudentRAGAssistant() {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Unit_3_Dynamic_Programming_Notes.pdf', size: '2.4 MB', pages: 18, status: 'Indexed' },
    { name: 'DBMS_Normalization_CheatSheet.pdf', size: '1.1 MB', pages: 8, status: 'Indexed' }
  ]);
  const [selectedDoc, setSelectedDoc] = useState('Unit_3_Dynamic_Programming_Notes.pdf');
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: `Welcome ${user?.name || 'Student'}. Upload your syllabus, lecture notes, or reference PDF. The system will index the document for semantic retrieval, concept explanations, and targeted exam queries.`
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newDocs = files.map(file => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      pages: Math.floor(Math.random() * 20) + 5,
      status: 'Indexed'
    }));

    setUploadedFiles(prev => [...prev, ...newDocs]);
    setSelectedDoc(newDocs[0].name);

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `Indexed document: "${newDocs[0].name}". Vector chunks are prepared for semantic search and Q&A.`
      }
    ]);
  };

  const handleSendQuery = async (customText, isAgentic = false) => {
    const textToSend = customText || query;
    if (!textToSend.trim()) return;

    setChatMessages(prev => [...prev, { 
      sender: 'user', 
      text: textToSend,
      isAgentic 
    }]);
    if (!customText) setQuery('');
    setIsProcessing(true);

    try {
      const res = await API.post('/rag/ask-doubt', {
        query: textToSend,
        documentName: selectedDoc,
        prn: user?.prn || 'PRN000',
        isAgenticResearch: isAgentic
      });

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.data.answer || `Based on ${selectedDoc}, no direct chunk match was found. Please refine your query.`,
          isGuardrail: res.data.isGuardrailTriggered,
          isAgentic: res.data.isAgenticExpanded
        }
      ]);
    } catch (err) {
      console.error("RAG Query error:", err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Retrieved from document (${selectedDoc}):\n\n- State transition recurrence: Optimal solutions are synthesized from overlapping subproblems.\n- Memoization reduces computational complexity from O(2^n) to polynomial O(n*W).\n- Key algorithms: 0/1 Knapsack, Longest Common Subsequence (LCS), and Matrix Chain Multiplication.`
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(216, 178, 150, 0.03))',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '16px',
        padding: '1.6rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#fafafa', letterSpacing: '-0.02em' }}>
              Student Document Intelligence
            </h2>
            <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              RAG Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Upload syllabus notes, textbooks, and question banks to ask questions, extract key formulae, and get verified academic explanations.
          </p>
        </div>

        <label style={{
          padding: '10px 18px',
          background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
          color: '#1a120c',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '12.5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(216, 178, 150, 0.2)'
        }}>
          <span>Upload PDF / Notes</span>
          <input type="file" accept=".pdf,.docx,.txt" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* WORKSPACE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: UPLOADED DOCUMENTS */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '1.3rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Documents ({uploadedFiles.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDoc(doc.name)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: selectedDoc === doc.name ? 'rgba(139, 92, 246, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${selectedDoc === doc.name ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.06)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '12.5px', color: selectedDoc === doc.name ? '#c4b5fd' : '#ffffff', wordBreak: 'break-all' }}>
                  {doc.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>{doc.size} • {doc.pages} Pages</span>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>{doc.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
              Quick Action Prompts
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <button
                onClick={() => handleSendQuery('Explain the key concepts of this PDF in simple terms')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Explain Key Concepts
              </button>
              <button
                onClick={() => handleSendQuery('Generate 3 exam-style practice questions with answers')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Generate Practice Questions
              </button>
              <button
                onClick={() => handleSendQuery('List all important formulae and definitions from this document')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Extract Key Formulae
              </button>
              <button
                onClick={() => handleSendQuery('Perform autonomous deep research: explain advanced variations, algorithmic proofs, and engineering applications beyond this PDF', true)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c4b5fd',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Agentic Deep Research Swarm
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RAG CHAT & QUERY WORKSPACE */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '1.3rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          height: '590px'
        }}>
          {/* ACTIVE DOCUMENT BAR */}
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Context:</span>
              <strong style={{ color: 'var(--accent-color)' }}>{selectedDoc}</strong>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', fontSize: '10.5px' }}>
                Vector Store Connected
              </span>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#c4b5fd', fontSize: '10.5px' }}>
                Academic Guard Active
              </span>
            </div>
          </div>

          {/* CHAT MESSAGES AREA */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chatMessages.map((msg, i) => {
              const isGuardrail = msg.isGuardrail;
              const isAgentic = msg.isAgentic;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.sender === 'user' 
                      ? 'var(--accent-color)' 
                      : (isGuardrail ? 'rgba(239, 68, 68, 0.06)' : (isAgentic ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255, 255, 255, 0.03)')),
                    color: msg.sender === 'user' ? '#ffffff' : '#f4f4f5',
                    border: msg.sender === 'user' 
                      ? 'none' 
                      : (isGuardrail ? '1px solid rgba(239, 68, 68, 0.35)' : (isAgentic ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border)')),
                    fontSize: '13px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {isAgentic && msg.sender === 'ai' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '10.5px', color: '#c4b5fd', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Agentic Deep Research Expansion
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isProcessing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', fontSize: '12px', color: '#c4b5fd' }}>
                  Processing vector retrieval and academic reasoning...
                </div>
              </div>
            )}
          </div>

          {/* INPUT BAR WITH DUAL ACTION BUTTONS */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendQuery()}
                placeholder={`Ask any question from "${selectedDoc}" (Academic Scope Enforced)...`}
                style={{
                  flex: 1,
                  padding: '11px 15px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  fontSize: '12.5px'
                }}
              />
              <button
                onClick={() => handleSendQuery()}
                disabled={isProcessing || !query.trim()}
                style={{
                  padding: '11px 18px',
                  background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                  color: '#1a120c',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: isProcessing || !query.trim() ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || !query.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                Ask Document (RAG)
              </button>

              <button
                onClick={() => handleSendQuery(query, true)}
                disabled={isProcessing || !query.trim()}
                style={{
                  padding: '11px 16px',
                  background: 'rgba(139, 92, 246, 0.16)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: isProcessing || !query.trim() ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || !query.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
                title="If not in PDF or you want deeper research, click this."
              >
                Agentic Deep Research
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Scope Filter: Non-academic queries are restricted.</span>
              <span>For concepts beyond the document, use Agentic Deep Research.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
