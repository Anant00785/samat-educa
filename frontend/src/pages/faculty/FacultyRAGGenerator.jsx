import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function FacultyRAGGenerator() {
  const { user } = useAuth();
  const [courseFile, setCourseFile] = useState('Operating_Systems_Concurrency_Semaphores.pdf');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionType, setQuestionType] = useState('MIXED');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([
    {
      id: 1,
      type: 'MCQ',
      difficulty: 'MEDIUM',
      question: 'Which of the following conditions is NOT necessary for a deadlock to occur according to Coffman\'s conditions?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
      correctAnswer: 'Preemption Allowed',
      explanation: 'No preemption is the required condition for deadlock. If preemption is allowed, deadlock cannot occur.'
    },
    {
      id: 2,
      type: 'DESCRIPTIVE',
      difficulty: 'HARD',
      question: 'Explain how Peterson\'s Solution guarantees mutual exclusion for two processes sharing critical section resources. State any modern hardware limitations.',
      correctAnswer: 'Requires flag[2] array and turn variable. Guarantees mutual exclusion, progress, and bounded waiting, but fails on modern out-of-order execution architectures without memory barriers.'
    }
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourseFile(file.name);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const newBatch = [
        {
          id: 1,
          type: 'MCQ',
          difficulty: difficulty,
          question: `Based on ${courseFile}: What is the primary purpose of counting semaphores in concurrent programming?`,
          options: [
            'To control access to a given resource consisting of a finite number of instances',
            'To synchronize CPU clock cycles between threads',
            'To prevent virtual memory page faults',
            'To compile assembly code to machine code'
          ],
          correctAnswer: 'To control access to a given resource consisting of a finite number of instances',
          explanation: 'Extracted directly from Section 2.1 of uploaded syllabus notes.'
        },
        {
          id: 2,
          type: 'DESCRIPTIVE',
          difficulty: difficulty,
          question: `Differentiate between Binary Semaphores and Mutex Locks as discussed in ${courseFile}.`,
          correctAnswer: 'A mutex can only be unlocked by the process that locked it (ownership principle), whereas any process can signal a binary semaphore.'
        },
        {
          id: 3,
          type: 'CODING',
          difficulty: 'HARD',
          question: 'Write a pseudo-code implementation of the Producer-Consumer problem using Semaphores (mutex, empty, full).',
          correctAnswer: 'Producer: wait(empty); wait(mutex); add_item(); signal(mutex); signal(full);'
        }
      ];

      setGeneratedQuestions(newBatch);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(216, 178, 150, 0.12), rgba(139, 92, 246, 0.05))',
        border: '1px solid rgba(216, 178, 150, 0.25)',
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
            <span style={{ fontSize: '24px' }}>✍️</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#fafafa' }}>
              Faculty AI Assessment & Question Generator (RAG)
            </h2>
            <span className="badge" style={{ background: 'rgba(216, 178, 150, 0.2)', color: 'var(--accent-color)' }}>
              RAG Generator
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Upload syllabus notes, research papers, or chapter PDFs to auto-generate customized question papers with answer keys.
          </p>
        </div>
      </div>

      {/* WORKSPACE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: RAG CONFIGURATION & UPLOAD */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            ⚙️ Generator Settings
          </h3>

          {/* DOCUMENT DROPZONE */}
          <div>
            <label className="field-label" style={{ marginBottom: '6px', display: 'block' }}>Course Document / Notes PDF:</label>
            <div style={{
              border: '2px dashed rgba(216, 178, 150, 0.4)',
              borderRadius: '12px',
              padding: '1.2rem',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '24px' }}>📄</span>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fafafa', marginTop: '4px' }}>
                {courseFile}
              </div>
              <label style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '5px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}>
                Change Document
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* QUESTION TYPE */}
          <div>
            <label className="field-label" style={{ marginBottom: '6px', display: 'block' }}>Question Format:</label>
            <select
              value={questionType}
              onChange={e => setQuestionType(e.target.value)}
              className="field-input"
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
            >
              <option value="MIXED">Mixed (MCQ + Theory + Coding)</option>
              <option value="MCQ">Multiple Choice Only (MCQ)</option>
              <option value="DESCRIPTIVE">Descriptive & Short Answer</option>
              <option value="CASE_STUDY">Case Study / Problem Solving</option>
            </select>
          </div>

          {/* DIFFICULTY */}
          <div>
            <label className="field-label" style={{ marginBottom: '6px', display: 'block' }}>Difficulty Level:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['EASY', 'MEDIUM', 'HARD'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: `1px solid ${difficulty === lvl ? 'var(--accent-color)' : 'var(--border)'}`,
                    background: difficulty === lvl ? 'rgba(216, 178, 150, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: difficulty === lvl ? 'var(--accent-color)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* NUMBER OF QUESTIONS */}
          <div>
            <label className="field-label" style={{ marginBottom: '6px', display: 'block' }}>Number of Questions: ({questionCount})</label>
            <input
              type="range"
              min="3"
              max="20"
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#D8B296' }}
            />
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
              color: '#1a120c',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: isGenerating ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(216, 178, 150, 0.3)'
            }}
          >
            {isGenerating ? '⏳ Extracting & Generating...' : '✨ Generate Question Paper via RAG'}
          </button>
        </div>

        {/* RIGHT COLUMN: GENERATED QUESTIONS & EXPORT */}
        <div style={{
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Generated Assessment ({generatedQuestions.length} Questions)
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Source: <strong>{courseFile}</strong> • Difficulty: <strong>{difficulty}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => alert("Question Paper exported to Assessment Bank!")}
                style={{
                  padding: '7px 14px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💾 Save to Assessment Bank
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '7px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🖨️ Export PDF
              </button>
            </div>
          </div>

          {/* QUESTIONS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {generatedQuestions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: 'var(--accent-color)', fontSize: '13px' }}>
                    Q{idx + 1}. [{q.type}]
                  </span>
                  <span className="badge" style={{ fontSize: '10.5px' }}>
                    {q.difficulty}
                  </span>
                </div>

                <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#ffffff', lineHeight: '1.5' }}>
                  {q.question}
                </div>

                {q.options && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '4px 0' }}>
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: opt === q.correctAnswer ? 'rgba(52, 211, 153, 0.12)' : 'rgba(0, 0, 0, 0.3)',
                          border: `1px solid ${opt === q.correctAnswer ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                          fontSize: '12px',
                          color: opt === q.correctAnswer ? '#34d399' : 'var(--text-secondary)'
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.correctAnswer && '✓'}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderLeft: '3px solid #34d399',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#e4e4e7',
                  marginTop: '4px'
                }}>
                  <strong style={{ color: '#34d399' }}>Answer / Evaluation Guide:</strong> {q.correctAnswer}
                  {q.explanation && <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '11px' }}>{q.explanation}</div>}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
