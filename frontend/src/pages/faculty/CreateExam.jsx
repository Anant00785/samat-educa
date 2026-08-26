import React, { useState } from 'react';
import API from '../../api/axios';

export default function CreateExam() {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [questions, setQuestions] = useState([
    { text: '', optionA: '', optionB: '', correct: 'A' }
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', optionA: '', optionB: '', correct: 'A' }]);
  };

  const updateQ = (index, field, val) => {
    const fresh = [...questions];
    fresh[index][field] = val;
    setQuestions(fresh);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Enter exam title");

    setIsPublishing(true);
    try {
      await API.post('/exams/create', { title, duration, questions });
      alert("Exam Successfully Published for students!");
    } catch (err) {
      console.error(err);
      alert("Error publishing exam");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📝 Create New Exam</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Design a new test to be monitored by AI Proctoring.</p>

      <form onSubmit={handleSubmit} style={{ 
        marginTop: '2rem', background: 'var(--bg-glass)', 
        padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' 
      }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 2 }}>
            <label>Exam Title / Subject</label>
            <input 
              required
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Advanced Java Exam"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid gray', borderRadius: '8px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Duration (mins)</label>
            <input 
              type="number"
              value={duration} onChange={e => setDuration(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid gray', borderRadius: '8px' }}
            />
          </div>
        </div>

        <h3>Questions</h3>
        {questions.map((q, i) => (
          <div key={i} style={{ 
            marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', 
            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' 
          }}>
            <input 
              required
              value={q.text} onChange={e => updateQ(i, 'text', e.target.value)}
              placeholder={`Question ${i + 1}`}
              style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none', borderBottom: '1px solid gray', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
              <input 
                required
                value={q.optionA} onChange={e => updateQ(i, 'optionA', e.target.value)}
                placeholder="Option A"
                style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid gray', borderRadius: '4px' }}
              />
              <input 
                required
                value={q.optionB} onChange={e => updateQ(i, 'optionB', e.target.value)}
                placeholder="Option B"
                style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid gray', borderRadius: '4px' }}
              />
              <select 
                value={q.correct} onChange={e => updateQ(i, 'correct', e.target.value)}
                style={{ padding: '0.5rem', background: 'var(--accent-1)', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                <option value="A">A is Correct</option>
                <option value="B">B is Correct</option>
              </select>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button type="button" onClick={addQuestion} style={{ padding: '0.8rem 1.5rem', border: '1px solid var(--accent-1)', background: 'transparent', color: 'var(--accent-1)', borderRadius: '8px', cursor: 'pointer' }}>
            + Add Question
          </button>
          <button type="submit" disabled={isPublishing} style={{ padding: '0.8rem 2rem', background: 'linear-gradient(90deg, #00d2ff, #3a7bd5)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isPublishing ? 'Publishing...' : 'Publish Exam'}
          </button>
        </div>

      </form>
    </div>
  );
}
