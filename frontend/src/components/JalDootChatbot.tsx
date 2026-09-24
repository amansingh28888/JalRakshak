import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export const JalDootChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Hi, I'm JalDoot. I can help you understand water quality, alerts, contaminants, and recommended actions." }
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue('');
    
    // Mock response as per instructions to not touch backend APIs
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "I am currently analyzing your query. As JalDoot, I will soon be fully connected to provide live insights on your local water quality." 
      }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 119, 182, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 380,
          height: 600,
          maxHeight: '85vh',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          fontFamily: 'Inter, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 2 }}>JalDoot</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Your guide to safer water</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: 20, 
            background: 'var(--color-bg-soft)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16 
          }}>
            {messages.length === 1 && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: '0.85rem', 
                color: 'var(--color-text-secondary)', 
                marginBottom: 12,
                fontWeight: 500
              }}>
                Start a conversation with JalDoot to get insights about water quality.
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--color-primary)' : '#fff',
                color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                maxWidth: '85%',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                {msg.text}
              </div>
            ))}

            {messages.length === 1 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--color-text-secondary)', 
                  marginBottom: 12, 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}>
                  Suggested Questions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        background: '#fff',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        fontSize: '0.9rem',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F0F9FF'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
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
          <div style={{ 
            padding: 16, 
            background: '#fff', 
            borderTop: '1px solid var(--color-border)', 
            display: 'flex', 
            gap: 12,
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="Ask JalDoot..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                fontSize: '0.95rem',
                outline: 'none',
                background: 'var(--color-bg-soft)'
              }}
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim()}
              style={{
                background: inputValue.trim() ? 'var(--color-primary)' : 'var(--color-border)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, transform 0.1s'
              }}
              onMouseDown={(e) => inputValue.trim() && (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => inputValue.trim() && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
