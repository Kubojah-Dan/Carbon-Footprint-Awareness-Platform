'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatAssistant() {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const firstName = userProfile?.displayName?.split(' ')[0] ?? 'Nurturer';
  const localStorageKey = user?.uid ? `earthprint_chat_history_${user.uid}` : '';

  // Load chat history from localStorage on mount/uid change
  useEffect(() => {
    if (!localStorageKey) return;
    const cached = localStorage.getItem(localStorageKey);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached chat history:', e);
      }
    } else {
      // Default welcome message
      const welcomeMsg: Message = {
        role: 'assistant',
        content: `Hello, ${firstName}! I am Arbor, your biophilic guide. 🦉 I am here to help you navigate EarthPrint, understand your carbon footprint graphs, and explore new habits to nurture your digital biome. How can I assist you on your sustainability journey today?`,
      };
      setMessages([welcomeMsg]);
    }
  }, [localStorageKey, firstName]);

  // Save chat history to localStorage
  useEffect(() => {
    if (!localStorageKey || messages.length === 0) return;
    localStorage.setItem(localStorageKey, JSON.stringify(messages));
  }, [messages, localStorageKey]);

  // Scroll to bottom when messages change or open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Close assistant and clear abort controller
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Clear chat history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your chat history with Arbor?')) {
      const welcomeMsg: Message = {
        role: 'assistant',
        content: `Hello, ${firstName}! History cleared. How can I help you nurture your biome today? 🌿`,
      };
      setMessages([welcomeMsg]);
      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }
    }
  };

  // Stop generation / cancel API call
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Generation stopped by user.' },
      ]);
    }
  };

  // Submit chat query
  const submitMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: userText } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          messages: updatedMessages,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (data.success && data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || "I'm having trouble connecting to the biome network right now. Please try again.",
          },
        ]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Chat fetch aborted');
      } else {
        console.error('Chat error:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'An error occurred while reaching Arbor. Please check your network connection.',
          },
        ]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  return (
    <>
      {/* ── Chat Float Button ── */}
      <button
        onClick={handleToggle}
        id="btn-chat-trigger"
        aria-label="Open Arbor AI Assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-forest-action text-white flex items-center justify-center shadow-lg hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-300 group border border-white/20"
      >
        <span className="text-2xl lively-emoji group-hover:rotate-12 transition-transform duration-300">🦉</span>
        {/* Pulsing indicator ring */}
        <span className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping opacity-75" />
      </button>

      {/* ── Chat Window Widget ── */}
      {isOpen && (
        <div 
          id="chat-assistant-window"
          className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col glass-card shadow-2xl border border-emerald-300/30 overflow-hidden animate-slide-up rounded-2xl select-none"
        >
          {/* Header */}
          <div className="bg-forest-deep/95 text-white px-4 py-3 flex items-center justify-between border-b border-[#1A4A2E]/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <span className="text-lg lively-emoji">🦉</span>
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold tracking-wide text-white">Arbor Assistant</h4>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-pale-green/70 font-mono font-bold">Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Clear History Button */}
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                aria-label="Clear chat history"
                className="p-1.5 rounded-lg hover:bg-white/10 text-pale-green/80 hover:text-white transition-all text-sm"
              >
                🗑️
              </button>
              {/* Close Button */}
              <button
                onClick={handleToggle}
                title="Close Assistant"
                aria-label="Close chat assistant"
                className="p-1.5 rounded-lg hover:bg-white/10 text-pale-green/80 hover:text-white transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F0FAF4]/60 backdrop-blur-md flex flex-col">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-white/75 text-ink border border-[#D1E8D9]/40 rounded-tl-none shadow-sm'
                        : 'bg-forest-action text-white rounded-tr-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="max-w-[85%] rounded-2xl rounded-tl-none px-4 py-3 bg-white/70 text-ink-soft border border-[#D1E8D9]/30 text-xs flex items-center gap-2">
                  <span className="animate-spin text-sm">🌱</span>
                  <span>Arbor is whispering to the canopy...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Area */}
          <div className="p-3 bg-white/80 border-t border-[#D1E8D9]/40 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitMessage();
                  }
                }}
                placeholder="Ask Arbor about carbon stats or navigation..."
                disabled={loading}
                rows={1}
                className="flex-1 bg-white/90 border border-[#D1E8D9]/60 rounded-xl px-3 py-2 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-none min-h-[36px] max-h-[80px] overflow-y-auto leading-relaxed"
              />
              
              {loading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl flex items-center justify-center transition-all shrink-0 aspect-square h-9 w-9"
                  title="Stop Generating"
                >
                  <span className="w-2.5 h-2.5 bg-white rounded-sm" />
                </button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!input.trim()}
                  className="!px-3 !py-2 rounded-xl shrink-0 h-9"
                >
                  Send
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
