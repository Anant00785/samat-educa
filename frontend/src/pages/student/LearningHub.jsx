import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function LearningHub() {
  const [subjectsData, setSubjectsData] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await API.get('/learning-hub');
        setSubjectsData(res.data.subjects || []);
      } catch (err) {
        console.error("Error loading learning hub resources:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleExplainWithAi = async (concept, subjectName) => {
    try {
      setLoadingAi(true);
      const res = await API.post('/learning-hub/explain-concept', {
        conceptName: concept.name,
        subject: subjectName
      });
      setAiExplanation(res.data.explanation);
    } catch (err) {
      console.error(err);
      setAiExplanation("Unable to generate AI explanation at this time. Please refer to standard definition.");
    } finally {
      setLoadingAi(false);
    }
  };

  const openConceptModal = (concept, subjectName) => {
    setSelectedConcept({ ...concept, subjectName });
    setAiExplanation(null);
  };

  // Filtered list
  const filteredSubjects = selectedSubjectId === 'all'
    ? subjectsData
    : subjectsData.filter(s => s.id === selectedSubjectId);

  // Search through all concepts across subjects
  const allConcepts = subjectsData.flatMap(s => s.concepts.map(c => ({ ...c, subjectName: s.subject, subjectId: s.id })));
  const searchResults = searchQuery.trim().length > 1
    ? allConcepts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading verified university literature and interactive visualizers...</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. HEADER SECTION */}
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
            <span style={{ fontSize: '30px' }}>📚</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Student Learning Hub
            </h2>
            <span className="badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Books & Concept Resources
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', maxWidth: '750px' }}>
            Curated verified university literature, rapid concept definitions, and interactive visual simulators for seamless semester revision.
          </p>
        </div>
      </div>

      {/* 2. SEARCH CONCEPTS BAR */}
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(18, 18, 24, 0.7)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '0.75rem 1.25rem',
          backdropFilter: 'blur(16px)',
          gap: '12px'
        }}>
          <span style={{ fontSize: '18px', opacity: 0.7 }}>🔍</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts across all subjects (e.g. Binary Search, K-Map, Cache, Flip-Flop, Dijkstra, Stack)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Real-time search dropdown results */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'rgba(14, 14, 20, 0.98)',
            border: '1px solid rgba(216, 178, 150, 0.3)',
            borderRadius: '16px',
            padding: '1rem',
            zIndex: 100,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            maxHeight: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Found {searchResults.length} Matching Concept(s)
            </span>
            {searchResults.map((c, i) => (
              <div 
                key={i}
                onClick={() => { openConceptModal(c, c.subjectName); setSearchQuery(''); }}
                style={{
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{c.name}</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {c.definition.substring(0, 110)}...
                  </p>
                </div>
                <span className="badge" style={{ fontSize: '10px' }}>{c.subjectName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. SUBJECT FILTER TABS */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.75rem'
      }}>
        <button
          onClick={() => setSelectedSubjectId('all')}
          style={{
            padding: '9px 18px',
            background: selectedSubjectId === 'all' ? 'rgba(216, 178, 150, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: selectedSubjectId === 'all' ? '1px solid rgba(216, 178, 150, 0.4)' : '1px solid var(--border-subtle)',
            color: selectedSubjectId === 'all' ? '#F3E5D8' : 'var(--text-secondary)',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          All Subjects ({subjectsData.length})
        </button>

        {subjectsData.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(sub.id)}
            style={{
              padding: '9px 18px',
              background: selectedSubjectId === sub.id ? 'rgba(216, 178, 150, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: selectedSubjectId === sub.id ? '1px solid rgba(216, 178, 150, 0.4)' : '1px solid var(--border-subtle)',
              color: selectedSubjectId === sub.id ? '#F3E5D8' : 'var(--text-secondary)',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {sub.shortName}
          </button>
        ))}
      </div>

      {/* 4. SUBJECT SECTIONS */}
      {filteredSubjects.map((sub) => (
        <div key={sub.id} style={{
          background: 'rgba(18, 18, 24, 0.65)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem'
        }}>
          
          {/* Subject Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff' }}>
                {sub.subject}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {sub.description}
              </p>
            </div>
            <span className="badge" style={{ fontSize: '11px', padding: '4px 10px' }}>
              Core Curriculum
            </span>
          </div>

          {/* A. RECOMMENDED BOOKS */}
          <div>
            <h4 style={{ fontSize: '1.1rem', color: '#fafafa', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📖</span> Recommended Textbooks & University Literature
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {sub.books.map((book) => (
                <div key={book.id} style={{
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid #D8B296',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
                      {book.publisher} • {book.edition}
                    </span>
                    <h5 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '4px 0 6px 0', fontWeight: '700', lineHeight: '1.3' }}>
                      {book.title}
                    </h5>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#D8B296', fontWeight: '500' }}>
                      ✍️ {book.authors}
                    </p>

                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Concepts Covered:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {book.conceptsCovered.map((c, idx) => (
                          <span key={idx} style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            color: '#e4e4e7'
                          }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {book.verifiedUrl && (
                    <a
                      href={book.verifiedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '9px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(216, 178, 150, 0.35)',
                        color: '#F3E5D8',
                        borderRadius: '10px',
                        fontWeight: '600',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      View Publisher Page ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* B. QUICK CONCEPTS LIST */}
          <div>
            <h4 style={{ fontSize: '1.1rem', color: '#fafafa', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡</span> Quick Revision Concepts (Click to Inspect)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {sub.concepts.map((concept, idx) => (
                <div 
                  key={idx}
                  onClick={() => openConceptModal(concept, sub.subject)}
                  style={{
                    padding: '1.1rem 1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(216, 178, 150, 0.45)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{concept.name}</strong>
                      <span style={{ fontSize: '11px', color: '#D8B296' }}>Inspect →</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {concept.definition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C. INTERACTIVE LEARNING TOOL / SIMULATOR */}
          {sub.interactiveTool && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(216, 178, 150, 0.08), rgba(243, 229, 216, 0.02))',
              border: '1px solid rgba(216, 178, 150, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px' }}>🎮</span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                    {sub.interactiveTool.title}
                  </h4>
                  <span className="badge" style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    {sub.interactiveTool.badge}
                  </span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {sub.interactiveTool.description} <strong style={{ color: '#D8B296' }}>(External Learning Resource)</strong>
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {sub.interactiveTool.topics.map((t, idx) => (
                    <span key={idx} style={{
                      fontSize: '10.5px',
                      padding: '3px 8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      color: '#d4d4d8'
                    }}>
                      • {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href={sub.interactiveTool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                    color: '#1a120c',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(216, 178, 150, 0.3)'
                  }}
                >
                  ⚡ Open {sub.interactiveTool.name} ↗
                </a>
              </div>
            </div>
          )}

        </div>
      ))}

      {/* 5. CONCEPT EXPLANATION MODAL */}
      {selectedConcept && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'rgba(14, 14, 20, 0.96)',
            border: '1px solid rgba(216, 178, 150, 0.25)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '650px',
            padding: '2.25rem',
            boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedConcept(null)}
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
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <span className="badge" style={{ fontSize: '11px', marginBottom: '6px', display: 'inline-block' }}>
                {selectedConcept.subjectName}
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                {selectedConcept.name}
              </h3>
            </div>

            {/* Definition */}
            <div style={{
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderLeft: '4px solid #D8B296',
              borderRadius: '12px',
              borderTop: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#D8B296', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Core Definition
              </span>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#e4e4e7', lineHeight: '1.5' }}>
                {selectedConcept.definition}
              </p>
            </div>

            {/* Real World Example */}
            {selectedConcept.example && (
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  💡 Real-World / Technical Example
                </span>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12.5px',
                  color: '#d4d4d8'
                }}>
                  {selectedConcept.example}
                </div>
              </div>
            )}

            {/* Used in */}
            {selectedConcept.usedIn && (
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  📌 Industry & Academic Applications
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedConcept.usedIn.map((u, i) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      background: 'rgba(216, 178, 150, 0.1)',
                      border: '1px solid rgba(216, 178, 150, 0.25)',
                      borderRadius: '6px',
                      color: '#F3E5D8'
                    }}>
                      • {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation Extension */}
            {aiExplanation && (
              <div style={{
                padding: '1.25rem',
                background: 'rgba(52, 211, 153, 0.06)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  ⚡ AI Simplified Explanation
                </span>
                <p style={{ margin: 0, fontSize: '13px', color: '#e4e4e7', lineHeight: '1.5' }}>
                  {aiExplanation}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => handleExplainWithAi(selectedConcept, selectedConcept.subjectName)}
                disabled={loadingAi}
                style={{
                  padding: '9px 18px',
                  background: 'linear-gradient(135deg, #F3E5D8 0%, #D8B296 50%, #C99E80 100%)',
                  color: '#1a120c',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: loadingAi ? 'wait' : 'pointer'
                }}
              >
                {loadingAi ? 'Synthesizing with AI...' : '⚡ Explain with AI'}
              </button>

              <button
                onClick={() => setSelectedConcept(null)}
                style={{
                  padding: '9px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
