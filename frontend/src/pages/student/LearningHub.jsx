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
        background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(139, 92, 246, 0.04))',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2rem',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '700', margin: 0, color: 'var(--text-dark)', letterSpacing: '-0.4px' }}>
              Student Learning Hub & Visual Labs
            </h2>
            <span className="badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Textbooks & 3D Simulators
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', maxWidth: '750px' }}>
            Verified university literature, rapid concept definitions, and interactive 3D visual simulators for seamless STEM and engineering revision.
          </p>
        </div>
      </div>

      {/* 2. SPOTLIGHT: 3D PHYSICS & STEM VISUAL SIMULATION LABS */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.8rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-dark)' }}>
              Interactive 3D Visualizers & Simulation Labs
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Hands-on interactive 3D physics simulators, algorithm visualizers, and virtual circuit builders.
            </p>
          </div>
          <span className="badge" style={{ background: 'rgba(30, 64, 175, 0.1)', color: 'var(--accent-color)' }}>
            4 Virtual Labs Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          
          {/* FEATURED: oPhysics 3D Physics Simulator */}
          <div style={{
            padding: '1.4rem',
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(59, 130, 246, 0.04))',
            border: '1.5px solid rgba(30, 64, 175, 0.35)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
            gridColumn: 'span 2'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>
                  Featured 3D Physics Simulation Lab
                </span>
                <span className="badge" style={{ fontSize: '10.5px', background: '#1e40af', color: '#ffffff' }}>
                  oPhysics Lab
                </span>
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-dark)' }}>
                oPhysics: Interactive 3D Physics Simulations
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Real-time interactive 3D animations and simulations covering Kinematics, 2D Projectile Motion, Ray Optics & Refraction, Waves, Electromagnetism, Circular Motion, and Fluid Dynamics.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                {[
                  { name: 'Kinematics & 2D', link: 'https://ophysics.com/k1.html' },
                  { name: 'Forces & Newton', link: 'https://ophysics.com/f1.html' },
                  { name: 'Waves & Sound', link: 'https://ophysics.com/w1.html' },
                  { name: 'Light & Optics', link: 'https://ophysics.com/l1.html' },
                  { name: 'Electro & Magnetism', link: 'https://ophysics.com/em1.html' },
                  { name: 'Fluids & Gravity', link: 'https://ophysics.com/fl1.html' }
                ].map((mod, idx) => (
                  <a
                    key={idx}
                    href={mod.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '11.5px',
                      padding: '6px 10px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-dark)',
                      textDecoration: 'none',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                  >
                    <span>{mod.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="https://ophysics.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  flex: '1',
                  minWidth: '220px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  padding: '11px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Launch Complete oPhysics 3D Portal ↗
              </a>
            </div>
          </div>

          {/* VisuAlgo */}
          <div style={{
            padding: '1.2rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.8rem'
          }}>
            <div>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                Algorithms & Data Structures
              </span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '4px 0', color: 'var(--text-dark)' }}>
                VisuAlgo Visualizer
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Step-by-step interactive animations for Trees, Graphs, Sorting, and Dynamic Programming.
              </p>
            </div>
            <a
              href="https://visualgo.net/en"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', textAlign: 'center', fontSize: '12px', padding: '8px' }}
            >
              Open VisuAlgo ↗
            </a>
          </div>

          {/* EveryCircuit */}
          <div style={{
            padding: '1.2rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.8rem'
          }}>
            <div>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                Digital Electronics & Hardware
              </span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '4px 0', color: 'var(--text-dark)' }}>
                EveryCircuit Lab
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Real-time interactive schematic builder for logic gates, flip-flops, and counters.
              </p>
            </div>
            <a
              href="https://everycircuit.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', textAlign: 'center', fontSize: '12px', padding: '8px' }}
            >
              Open EveryCircuit ↗
            </a>
          </div>

        </div>
      </div>

      {/* 3. SEARCH CONCEPTS BAR */}
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          gap: '12px'
        }}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts across all subjects (e.g. Projectile Motion, Snell's Law, Binary Search, K-Map, Cache, Flip-Flop)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dark)',
              fontSize: '13.5px',
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
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            zIndex: 100,
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
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
                  background: 'var(--surface-card-hover)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-dark)' }}>{c.name}</strong>
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

      {/* 4. SUBJECT FILTER TABS */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem'
      }}>
        <button
          onClick={() => setSelectedSubjectId('all')}
          style={{
            padding: '8px 16px',
            background: selectedSubjectId === 'all' ? 'rgba(30, 64, 175, 0.12)' : 'var(--surface-card)',
            border: selectedSubjectId === 'all' ? '1px solid rgba(30, 64, 175, 0.4)' : '1px solid var(--border)',
            color: selectedSubjectId === 'all' ? 'var(--accent-color)' : 'var(--text-secondary)',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '12.5px',
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
              padding: '8px 16px',
              background: selectedSubjectId === sub.id ? 'rgba(30, 64, 175, 0.12)' : 'var(--surface-card)',
              border: selectedSubjectId === sub.id ? '1px solid rgba(30, 64, 175, 0.4)' : '1px solid var(--border)',
              color: selectedSubjectId === sub.id ? 'var(--accent-color)' : 'var(--text-secondary)',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {sub.shortName}
          </button>
        ))}
      </div>

      {/* 5. SUBJECT SECTIONS */}
      {filteredSubjects.map((sub) => (
        <div key={sub.id} style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          
          {/* Subject Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-dark)' }}>
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

          {/* A. INTERACTIVE TOOL BANNER */}
          {sub.interactiveTool && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.06), rgba(59, 130, 246, 0.03))',
              border: '1px solid rgba(30, 64, 175, 0.25)',
              borderRadius: '12px',
              padding: '1.3rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>
                  {sub.interactiveTool.badge}
                </span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '2px 0 4px 0', color: 'var(--text-dark)' }}>
                  {sub.interactiveTool.title} ({sub.interactiveTool.name})
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {sub.interactiveTool.description}
                </p>

                {sub.interactiveTool.topics && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {sub.interactiveTool.topics.slice(0, 6).map((t, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        background: 'rgba(30, 64, 175, 0.08)',
                        borderRadius: '4px',
                        color: 'var(--accent-color)'
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <a
                href={sub.interactiveTool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '9px 16px', fontSize: '12.5px' }}
              >
                Launch Simulator ↗
              </a>
            </div>
          )}

          {/* B. RECOMMENDED BOOKS */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-dark)', margin: '0 0 1rem 0' }}>
              Recommended Textbooks & Literature
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {sub.books.map((book) => (
                <div key={book.id} style={{
                  padding: '1.3rem',
                  background: 'var(--surface-card-hover)',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--accent-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.9rem'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
                      {book.publisher} • {book.edition}
                    </span>
                    <h5 style={{ fontSize: '1.05rem', color: 'var(--text-dark)', margin: '4px 0', fontWeight: '700' }}>
                      {book.title}
                    </h5>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--accent-color)', fontWeight: '600' }}>
                      {book.authors}
                    </p>

                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Key Concepts:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {book.conceptsCovered.slice(0, 6).map((c, idx) => (
                          <span key={idx} style={{
                            fontSize: '10.5px',
                            padding: '2px 6px',
                            background: 'rgba(0, 0, 0, 0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)'
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
                      className="btn-secondary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '11.5px',
                        textDecoration: 'none',
                        textAlign: 'center'
                      }}
                    >
                      View Publisher Page ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* C. CORE CONCEPTS */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-dark)', margin: '0 0 1rem 0' }}>
              Core Syllabus Concepts & Rapid Explanations
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem' }}>
              {sub.concepts.map((c, idx) => (
                <div 
                  key={idx}
                  onClick={() => openConceptModal(c, sub.subject)}
                  style={{
                    padding: '1.1rem',
                    background: 'var(--surface-card-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-dark)' }}>{c.name}</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {c.definition.substring(0, 110)}...
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600', marginTop: '6px' }}>
                    View Details & AI Tutor ➔
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ))}

      {/* CONCEPT DETAIL MODAL */}
      {selectedConcept && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge" style={{ fontSize: '10px' }}>{selectedConcept.subjectName}</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0 0', color: 'var(--text-dark)' }}>
                  {selectedConcept.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedConcept(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Definition:
                </strong>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                  {selectedConcept.definition}
                </p>
              </div>

              {selectedConcept.example && (
                <div style={{ padding: '10px 12px', background: 'rgba(30, 64, 175, 0.06)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                  <strong style={{ fontSize: '11.5px', color: 'var(--accent-color)', display: 'block', marginBottom: '2px' }}>
                    Real-World / Technical Analogy:
                  </strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-dark)' }}>
                    {selectedConcept.example}
                  </span>
                </div>
              )}

              {aiExplanation && (
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  <strong style={{ fontSize: '11.5px', color: '#8b5cf6', display: 'block', marginBottom: '4px' }}>
                    AI Tutor Explanation:
                  </strong>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                    {aiExplanation}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => handleExplainWithAi(selectedConcept, selectedConcept.subjectName)}
                disabled={loadingAi}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '12.5px' }}
              >
                {loadingAi ? 'Synthesizing...' : 'Explain with AI Tutor'}
              </button>
              <button
                onClick={() => setSelectedConcept(null)}
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '12.5px' }}
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
