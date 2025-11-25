'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore, useSessionStats } from '@/lib/store/sessionStore';
import { StrengthMindMap } from './visualization/StrengthMindMap';
import { ProgressIndicator } from './ui/ProgressIndicator';
import type { ChatMessage } from '@/lib/services/aiServiceClaude';
import { Save, RefreshCw, Send, Download, Loader2, Sparkles, Target } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessionId,
    messages,
    strengths,
    stage,
    isLoading,
    error,
    userName,
    initSession,
    addMessage,
    updateLastMessage,
    updateStage,
    updateStrengths,
    setLoading,
    setError,
    setUserName,
    clearSession,
    saveProgress,
    getProgressStatus
  } = useSessionStore();

  const stats = useSessionStats();
  const progressStatus = getProgressStatus();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Client-side hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId && isClient) {
      initSession();
    }
    // Show name input if we don't have a name yet
    if (isClient && !userName && messages.length === 0) {
      setShowNameInput(true);
    }
  }, [sessionId, initSession, isClient, userName, messages.length]);

  // Auto-save every few messages
  useEffect(() => {
    if (messages.length > 0 && messages.length % 4 === 0) {
      saveProgress();
    }
  }, [messages.length, saveProgress]);

  const handleStreamingSend = async () => {
    if (!input.trim() || isLoading || !sessionId || !isClient) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    addMessage(userMessage);
    setInput('');
    setLoading(true);
    setError(null);
    setShowWelcome(false);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, userMessage],
          stage,
          context: {}
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body reader');

      let assistantMessage = '';
      const streamingMessage: ChatMessage = { role: 'assistant', content: '' };
      addMessage(streamingMessage);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                assistantMessage += data.content;
                updateLastMessage({ role: 'assistant', content: assistantMessage });
              } else if (data.type === 'metadata') {
                updateStage(data.stage);
              } else if (data.type === 'strengths') {
                updateStrengths(data.strengths);
              } else if (data.type === 'complete') {
                // Final update with complete response
                updateLastMessage({ role: 'assistant', content: data.fullResponse });
                updateStage(data.stage);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStreamingSend();
    }
  };

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setShowNameInput(false);
      setTempName('');
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  const handleNewSession = () => {
    clearSession();
    initSession();
    setShowWelcome(true);
    setShowNameInput(true);
    setInput('');
    setTempName('');
  };

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportStrengthProfile = () => {
    const profile = {
      sessionId,
      timestamp: new Date().toISOString(),
      stage,
      strengths,
      stats,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecraft-strengths-${sessionId?.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex flex-col h-screen max-w-7xl mx-auto p-4 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-outfit">Loading LifeCraft...</h2>
          <div className="text-gray-600">Initializing your strength discovery journey</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-outfit">LifeCraft</h1>
            <p className="text-sm text-gray-600">Strength Discovery through Stories</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveProgress}
            disabled={!sessionId || isLoading || !isClient}
            className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 text-gray-700 rounded-xl transition-colors border border-white/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save size={18} /> <span className="hidden sm:inline">Save</span>
          </button>
          {stage === 'summary' && (
            <button
              onClick={exportStrengthProfile}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 font-medium"
            >
              <Download size={18} /> <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors shadow-lg font-medium"
          >
            <RefreshCw size={18} /> <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar - Progress */}
        <div className="w-1/4 min-w-64 hidden md:block">
          <div className="glass-panel rounded-2xl p-6 h-full overflow-y-auto">
            <ProgressIndicator
              currentStage={stage}
              progressPercentage={progressStatus.completion}
              className="sticky top-0"
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto glass-panel rounded-2xl p-6 mb-4 scroll-smooth">
            {/* Welcome Message */}
            {showWelcome && messages.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-primary-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 font-outfit">
                  Welcome to Your Strength Discovery Journey
                </h2>
                {showNameInput ? (
                  <div className="max-w-md mx-auto mt-8 animate-slide-up">
                    <p className="text-gray-600 mb-6 text-lg">Let&apos;s start by getting to know you!</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleNameKeyPress}
                        placeholder="What's your name?"
                        className="flex-1 p-4 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm transition-all"
                        autoFocus
                      />
                      <button
                        onClick={handleNameSubmit}
                        disabled={!tempName.trim()}
                        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ) : userName ? (
                  <div className="animate-slide-up">
                    <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8 text-lg">
                      Hi <span className="font-semibold text-primary-700">{userName}</span>! I&apos;m here to help you uncover your unique strengths through the power of storytelling.
                      By reflecting on meaningful work experiences, we&apos;ll identify the skills, attitudes,
                      and values that make you exceptional.
                    </p>
                    <div className="mt-8 p-6 bg-primary-50/50 border border-primary-100 rounded-2xl max-w-2xl mx-auto backdrop-blur-sm">
                      <p className="text-primary-800 font-medium flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Ready to begin? Think of a time when you felt deeply satisfied with your work...
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-8 animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                  }`}
              >
                <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                      AI
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                      Me
                    </div>
                  )}

                  <div
                    className={`p-5 rounded-2xl shadow-sm backdrop-blur-sm ${msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-white/80 text-gray-800 rounded-tl-none border border-white/50'
                      }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {msg.content}
                    </div>
                    {msg.timestamp && (
                      <div
                        className={`text-xs mt-2 ${msg.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                          }`}
                      >
                        {formatMessageTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-8 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                  <div className="p-5 rounded-2xl rounded-tl-none bg-white/80 text-gray-800 shadow-sm border border-white/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Thinking about your response</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-xl text-red-700 backdrop-blur-sm flex items-center gap-3 animate-fade-in">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  messages.length === 0
                    ? "Think of a time when you felt deeply satisfied with your work. Share that experience from beginning to end..."
                    : "Continue sharing your thoughts..."
                }
                className="flex-1 p-4 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[60px] max-h-32 transition-all placeholder:text-gray-400"
                disabled={isLoading}
                rows={2}
              />
              <button
                onClick={handleStreamingSend}
                disabled={isLoading || !input.trim()}
                className="px-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[60px]"
              >
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Send size={24} />
                )}
              </button>
            </div>
            <div className="mt-3 flex justify-between text-xs font-medium text-gray-500 px-1">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{stats.messageCount} messages • Session: {isClient ? sessionId?.slice(0, 8) : '...'}</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Visualization */}
        {stage === 'summary' && (
          <div className="w-1/3 min-w-96 max-h-full hidden xl:block">
            <div className="glass-panel rounded-2xl p-6 h-full overflow-y-auto">
              <StrengthMindMap
                data={strengths}
                userName={userName}
                className="h-fit"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
