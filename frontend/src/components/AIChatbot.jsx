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
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: 'white',
          fontSize: '22px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(124, 107, 196, 0.25)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title="Open Multilingual AI Counselor"
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
          background: 'rgba(14, 14, 20, 0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 107, 196, 0.15)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* HEADER WITH LANGUAGE SELECTOR */}
          <div style={{
            padding: '0.9rem 1.1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🤖
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: '600' }}>EduERP Guide</h3>
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '500' }}>● Multilingual Voice AI</span>
              </div>
            </div>

            {/* LANGUAGE SELECTOR PILL */}
            <div style={{
              display: 'flex',
              gap: '3px',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '3px',
              borderRadius: '20px',
              border: '1px solid var(--border)'
            }}>
              <button 
                onClick={() => setLanguage('en')}
                style={{
                  background: language === 'en' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  color: language === 'en' ? '#ffffff' : '#a1a1aa',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('hi')}
                style={{
                  background: language === 'hi' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  color: language === 'hi' ? '#ffffff' : '#a1a1aa',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                हिन्दी
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                style={{
                  background: language === 'bn' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  color: language === 'bn' ? '#ffffff' : '#a1a1aa',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
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
            gap: '0.75rem'
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.sender === 'user' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.035)',
                padding: '0.75rem 1rem',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                color: '#ffffff',
                fontSize: '13px',
                lineHeight: '1.45',
                border: `1px solid ${m.sender === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'var(--border)'}`
              }}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                EduERP Guide is synthesizing advice...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.35)',
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
                background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isListening ? '#ef4444' : 'var(--border)'}`,
                color: isListening ? '#f87171' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                transition: 'all 0.2s ease'
              }}
              title="Click to speak (English, Hindi, Bengali)"
            >
              🎤
            </button>
            <input 
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                color: '#ffffff',
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
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
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
