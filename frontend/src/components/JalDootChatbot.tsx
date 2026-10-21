import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Droplets } from 'lucide-react';

export const JalDootChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    {
      role: 'bot',
      text: "Hi, I'm JalDoot! I can help you understand water quality reports, contamination alerts, safety parameters, and recommended steps."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Is my area's water safe?",
    "What does this water-quality result mean?",
    "Why was this area given an alert?",
    "What should I do if fluoride or arsenic is high?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue('');

    // Simulated response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: "I am analyzing your query with our IS 10500:2012 water quality engine. Safe drinking water is essential — always follow boil advisories for biological alerts, and never boil water containing heavy chemical hazards like arsenic or fluoride."
        }
      ]);
    }, 800);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open JalDoot Chat"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            height: 56,
            padding: '0 20px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'transform 0.2s, box-shadow 0.2s',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 600,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(2, 132, 199, 0.55)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.4)';
          }}
        >
          <Droplets size={22} style={{ color: '#38bdf8' }} />
          <span>Ask JalDoot</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 390,
            maxWidth: 'calc(100vw - 32px)',
            height: 580,
            maxHeight: '85vh',
            background: 'rgba(255, 255, 255, 0.97)',
            borderRadius: 16,
            boxShadow: '0 16px 48px rgba(14, 165, 233, 0.18), 0 0 0 1px rgba(14, 165, 233, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
              borderBottom: '1px solid rgba(14, 165, 233, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0c2340', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>JalDoot</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: '#38bdf8',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    AI GUIDE
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Your guide to safer drinking water</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: 'none',
                color: '#0284c7',
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)';
                e.currentTarget.style.color = '#0c2340';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                e.currentTarget.style.color = '#0284c7';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              background: '#f0f9ff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Friendly introduction banner */}
            <div
              style={{
                textAlign: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(14, 165, 233, 0.06)',
                border: '1px solid rgba(14, 165, 233, 0.15)',
                fontSize: '0.82rem',
                color: '#475569',
                lineHeight: 1.45,
              }}
            >
              Ask questions about water safety in your district, lab tests, or safe purification methods.
            </div>

            {/* Conversation Bubbles */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : 'rgba(255, 255, 255, 0.9)',
                    color: isUser ? '#ffffff' : '#0f172a',
                    border: isUser
                      ? '1px solid rgba(14, 165, 233, 0.4)'
                      : '1px solid rgba(14, 165, 233, 0.15)',
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              );
            })}

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div style={{ marginTop: 6 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    marginBottom: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Suggested Questions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        borderRadius: 10,
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(14, 165, 233, 0.12)';
                        e.currentTarget.style.borderColor = '#0ea5e9';
                        e.currentTarget.style.color = '#0284c7';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.25)';
                        e.currentTarget.style.color = '#0f172a';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(240, 249, 255, 0.95)',
              borderTop: '1px solid rgba(14, 165, 233, 0.15)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="Ask JalDoot about water quality..."
              style={{
                flex: 1,
                padding: '11px 16px',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: 24,
                fontSize: '0.9rem',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#0ea5e9')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.25)')}
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim()}
              aria-label="Send message"
              style={{
                background: inputValue.trim()
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'rgba(14, 165, 233, 0.08)',
                color: inputValue.trim() ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '50%',
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
