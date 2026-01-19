'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore, useSessionStats } from '@/lib/store/sessionStore';
import { StrengthMindMap } from './visualization/StrengthMindMap';
import { ProgressIndicator } from './ui/ProgressIndicator';
import type { ChatMessage } from '@/lib/services/aiServiceClaude';
import {
  Save,
  RefreshCw,
  Send,
  Download,
  Loader2,
  Sparkles,
  Target,
  MessageCircle,
  User,
  Bot,
  ArrowRight
} from 'lucide-react';

/* =============================================================================
 * Terra Editorial Design - Chat Interface
 * Warm, conversational AI interface with editorial typography
 * ============================================================================= */

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
      <div className="flex flex-col h-screen max-w-editorial-wide mx-auto p-6 items-center justify-center bg-surface-cream">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-elevated animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-display-sm text-neutral-900 mb-3">Loading LifeCraft...</h2>
          <p className="text-body-md text-neutral-500">Initializing your strength discovery journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-editorial-wide mx-auto p-4 md:p-6 bg-surface-cream">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 card p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-neutral-900 tracking-tight">LifeCraft</h1>
            <p className="text-body-sm text-neutral-500">Strength Discovery through Stories</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveProgress}
            disabled={!sessionId || isLoading || !isClient}
            className="btn-secondary flex items-center gap-2 px-4 py-2.5"
          >
            <Save size={18} />
            <span className="hidden sm:inline">Save</span>
          </button>
          {stage === 'summary' && (
            <button
              onClick={exportStrengthProfile}
              className="btn-accent flex items-center gap-2 px-4 py-2.5"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          <button
            onClick={handleNewSession}
            className="btn-primary flex items-center gap-2 px-4 py-2.5"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar - Progress */}
        <div className="w-72 min-w-64 hidden md:block flex-shrink-0">
          <div className="card p-6 h-full overflow-y-auto">
            <div className="mb-6">
              <span className="text-label text-neutral-400 uppercase tracking-wider">Progress</span>
              <h2 className="font-display text-lg font-semibold text-neutral-900 mt-1">Your Journey</h2>
            </div>
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
          <div className="chat-container flex-1 overflow-y-auto mb-4">
            {/* Welcome Message */}
            {showWelcome && messages.length === 0 && (
              <div className="text-center py-16 px-6 animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Target className="w-12 h-12 text-primary-600" />
                </div>
                <h2 className="font-display text-display-sm text-neutral-900 mb-4 tracking-tight">
                  Welcome to Your Strength Discovery Journey
                </h2>
                {showNameInput ? (
                  <div className="max-w-md mx-auto mt-10 animate-fade-up">
                    <p className="text-body-md text-neutral-600 mb-8">Let&apos;s start by getting to know you!</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleNameKeyPress}
                        placeholder="What's your name?"
                        className="input flex-1"
                        autoFocus
                      />
                      <button
                        onClick={handleNameSubmit}
                        disabled={!tempName.trim()}
                        className="btn-primary px-8 py-3 flex items-center gap-2"
                      >
                        Start
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : userName ? (
                  <div className="animate-fade-up">
                    <p className="text-body-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-10">
                      Hi <span className="font-semibold text-primary-700">{userName}</span>! I&apos;m here to help you uncover your unique strengths through the power of storytelling.
                      By reflecting on meaningful work experiences, we&apos;ll identify the skills, attitudes,
                      and values that make you exceptional.
                    </p>
                    <div className="p-6 bg-primary-50 border border-primary-100 rounded-2xl max-w-2xl mx-auto">
                      <p className="text-body-md text-primary-800 font-medium flex items-center justify-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        Ready to begin? Think of a time when you felt deeply satisfied with your work...
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6 p-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message animate-fade-in ${
                    msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'
                  }`}
                >
                  <div className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {msg.role === 'assistant' ? (
                      <div className="chat-avatar-assistant">
                        <Bot className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="chat-avatar-user">
                        <User className="w-5 h-5" />
                      </div>
                    )}

                    {/* Message Content */}
                    <div
                      className={`chat-bubble max-w-[85%] ${
                        msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                      {msg.timestamp && (
                        <div className="chat-timestamp mt-3">
                          {formatMessageTime(msg.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="chat-message chat-message-assistant animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="chat-avatar-assistant">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="chat-bubble chat-bubble-assistant">
                      <div className="flex items-center gap-3">
                        <span className="text-body-sm font-medium text-neutral-600">Thinking about your response</span>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mx-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                  <p className="text-body-sm text-red-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="card p-4">
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
                className="textarea flex-1 min-h-[60px] max-h-32 resize-none"
                disabled={isLoading}
                rows={2}
              />
              <button
                onClick={handleStreamingSend}
                disabled={isLoading || !input.trim()}
                className="btn-primary px-6 flex items-center justify-center min-w-[60px]"
              >
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Send size={24} />
                )}
              </button>
            </div>
            <div className="mt-3 flex justify-between text-caption text-neutral-400 px-1">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Press Enter to send, Shift+Enter for new line
              </span>
              <span>{stats.messageCount} messages • Session: {isClient ? sessionId?.slice(0, 8) : '...'}</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Visualization */}
        {stage === 'summary' && (
          <div className="w-96 min-w-80 max-h-full hidden xl:block flex-shrink-0">
            <div className="card p-6 h-full overflow-y-auto">
              <div className="mb-6">
                <span className="text-label text-neutral-400 uppercase tracking-wider">Results</span>
                <h2 className="font-display text-lg font-semibold text-neutral-900 mt-1">Your Strengths</h2>
              </div>
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
