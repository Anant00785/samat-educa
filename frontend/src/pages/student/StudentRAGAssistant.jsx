import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function StudentRAGAssistant() {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Unit_3_Dynamic_Programming_Notes.pdf', size: '2.4 MB', pages: 18, status: 'Indexed & Ready' },
    { name: 'DBMS_Normalization_CheatSheet.pdf', size: '1.1 MB', pages: 8, status: 'Indexed & Ready' }
  ]);
  const [selectedDoc, setSelectedDoc] = useState('Unit_3_Dynamic_Programming_Notes.pdf');
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.name || 'Student'}! Upload your textbook, class notes, or syllabus PDF here. I will index the document and answer questions, explain complex concepts, and generate custom practice questions from your material.`
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
      status: 'Indexed & Ready'
    }));

    setUploadedFiles(prev => [...prev, ...newDocs]);
    setSelectedDoc(newDocs[0].name);

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `📄 Successfully indexed "${newDocs[0].name}". You can now ask questions, request concept summaries, or ask for quiz questions based on this document!`
      }
    ]);
  };

  const handleSendQuery = (customText) => {
    const textToSend = customText || query;
    if (!textToSend.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    if (!customText) setQuery('');
    setIsProcessing(true);

    // Mock RAG Vector Retrieval & Generative Synthesis
    setTimeout(() => {
      let aiResponse = `Based on your uploaded document (${selectedDoc}):\n\n`;

      if (textToSend.toLowerCase().includes('summary') || textToSend.toLowerCase().includes('explain')) {
        aiResponse += `📌 **Key Concept Summary:**\n- The document focuses on optimal substructure and overlapping subproblems.\n- Memory memoization reduces time complexity from exponential O(2^n) to polynomial O(n*W).\n- Crucial algorithms covered: 0/1 Knapsack, Longest Common Subsequence (LCS), and Matrix Chain Multiplication.`;
      } else if (textToSend.toLowerCase().includes('question') || textToSend.toLowerCase().includes('quiz')) {
        aiResponse += `🎯 **Practice Questions generated from ${selectedDoc}:**\n1. Explain the difference between Top-Down (Memoization) and Bottom-Up (Tabulation) approaches.\n2. Write the recurrence relation for the 0/1 Knapsack problem and state its space complexity.\n3. How does Dynamic Programming differ from the Greedy approach? Give a counter-example.`;
      } else {
        aiResponse += `According to section 3.2 of the uploaded document, the state transition table stores intermediate optimal solutions to avoid recomputing identical sub-problems. This guarantees deterministic runtime performance.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponse
        }
      ]);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(216, 178, 150, 0.05))',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '20px',
        padding: '1.8rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>📄</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#fafafa' }}>
              Student Document Intelligence (RAG Assistant)
            </h2>
            <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>
              RAG Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Upload syllabus notes, textbooks, and question banks to ask questions, extract key formulae, and get instant doubt assistance.
          </p>
        </div>

        <label style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
          color: '#1a120c',
          borderRadius: '10px',
          fontWeight: '700',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(216, 178, 150, 0.25)'
        }}>
          <span>📤 Upload PDF / Notes</span>
          <input type="file" accept=".pdf,.docx,.txt" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* WORKSPACE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: UPLOADED DOCUMENTS */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.4rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📚</span> Uploaded Documents ({uploadedFiles.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDoc(doc.name)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: selectedDoc === doc.name ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${selectedDoc === doc.name ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.08)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '13px', color: selectedDoc === doc.name ? '#c4b5fd' : '#ffffff', wordBreak: 'break-all' }}>
                  {doc.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>{doc.size} • {doc.pages} Pages</span>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>✓ {doc.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-secondary)' }}>
              ⚡ Quick Prompt Shortcuts
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <button
                onClick={() => handleSendQuery('Explain the key concepts of this PDF in simple terms')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                💡 Explain Key Concepts
              </button>
              <button
                onClick={() => handleSendQuery('Generate 3 exam-style practice questions with answers')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                🎯 Generate Practice Questions
              </button>
              <button
                onClick={() => handleSendQuery('List all important formulae and definitions from this document')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                📐 Extract Key Formulae
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RAG CHAT & QUERY WORKSPACE */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.4rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          height: '560px'
        }}>
          {/* ACTIVE DOCUMENT BAR */}
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Querying Active Context:</span>
              <strong style={{ color: 'var(--accent-color)' }}>{selectedDoc}</strong>
            </div>
            <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '11px' }}>
              Vector Store Connected
            </span>
          </div>

          {/* CHAT MESSAGES AREA */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.04)',
                  color: msg.sender === 'user' ? '#ffffff' : '#f4f4f5',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  ⏳ Retrieving relevant document chunks & generating answer...
                </div>
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendQuery()}
              placeholder={`Ask any doubt from "${selectedDoc}"...`}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: '#ffffff',
                fontSize: '13px'
              }}
            />
            <button
              onClick={() => handleSendQuery()}
              disabled={isProcessing || !query.trim()}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                color: '#1a120c',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: isProcessing || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !query.trim() ? 0.6 : 1
              }}
            >
              Ask AI ➔
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
