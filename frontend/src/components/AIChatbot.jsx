import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AIChatbot() {
  const { user } = useAuth();
  const prn = user?.prn || 'PRN000';

  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'bn'
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I am EduERP Guide, your multilingual AI Counselor. I can guide your study plan, answer campus queries, and provide career mentorship. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recog = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let stream = null;
    if (isOpen && cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.warn("Camera blocked or unavailable.", err);
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isOpen, cameraActive]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice language
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'bn') {
      utterance.lang = 'bn-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    if (!recog) {
      alert("Voice recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recog.stop();
      setIsListening(false);
      return;
    }

    recog.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-US';
    recog.start();
    setIsListening(true);

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      sendMessage(transcript);
    };

    recog.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };
  };

  const sendMessage = async (textToSubmit = input) => {
    if (!textToSubmit.trim()) return;
    const userMessage = { sender: 'user', text: textToSubmit };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      let imageBase64 = null;
      if (cameraActive && videoRef.current && canvasRef.current) {
         const video = videoRef.current;
         const canvas = canvasRef.current;
         if (video.videoWidth > 0 && video.videoHeight > 0) {
             canvas.width = video.videoWidth;
             canvas.height = video.videoHeight;
             const ctx = canvas.getContext('2d');
             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
             imageBase64 = canvas.toDataURL('image/jpeg');
         }
      }

      const res = await API.post('/ai/chat', { 
         message: textToSubmit,
         imageBase64,
         language,
         prn
      });
      const aiReply = res.data.reply;
      
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
      speak(aiReply);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: "EduERP Guide is online and ready to assist you!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        className="ai-fab" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          color: 'white',
          fontSize: '24px',
          border: 'none',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '2rem',
          width: '380px',
          height: '540px',
          background: 'rgba(12, 14, 28, 0.95)',
          backdropFilter: 'blur(25px)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* HEADER WITH LANGUAGE SELECTOR */}
          <div style={{
            padding: '0.9rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'white' }}>EduERP Guide</h3>
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '500' }}>● Multilingual Voice AI</span>
              </div>
            </div>

            {/* LANGUAGE SELECTOR PILL */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setLanguage('en')}
                style={{
                  background: language === 'en' ? '#6366f1' : 'transparent',
                  border: 'none',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('hi')}
                style={{
                  background: language === 'hi' ? '#6366f1' : 'transparent',
                  border: 'none',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                हिन्दी
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                style={{
                  background: language === 'bn' ? '#6366f1' : 'transparent',
                  border: 'none',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* HIDDEN VIDEO & CANVAS */}
          <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

          {/* MESSAGES LIST */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.sender === 'user' ? '#6366f1' : 'rgba(255,255,255,0.06)',
                padding: '0.7rem 1rem',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                color: 'white',
                fontSize: '13px',
                lineHeight: '1.4',
                border: '1px solid var(--border)'
              }}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-light)', fontSize: '12px', fontStyle: 'italic' }}>
                EduERP Guide is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div style={{
            padding: '0.8rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button 
              onClick={handleListen}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isListening ? '#ef4444' : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
              title="Click to speak (English, Hindi, Bengali)"
            >
              🎤
            </button>
            <input 
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                color: 'white',
                outline: 'none',
                fontSize: '13px'
              }}
              placeholder={isListening ? "Listening..." : language === 'hi' ? "हिंदी में पूछें..." : language === 'bn' ? "বাংলায় লিখুন..." : "Ask your AI counselor..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            />
            <button 
              onClick={() => sendMessage(input)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#6366f1',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
