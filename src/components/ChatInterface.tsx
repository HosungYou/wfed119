'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore, useSessionStats } from '@/lib/store/sessionStore';
import { StrengthMindMap } from './visualization/StrengthMindMap';
import { ProgressIndicator } from './ui/ProgressIndicator';
import { ChatMessage } from '@/lib/services/aiServiceClaude';
import { Save, RefreshCw, Send, Download, Loader2 } from 'lucide-react';

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
      <div className="flex flex-col h-screen max-w-7xl mx-auto p-4 bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading LifeCraft...</h2>
          <div className="animate-pulse text-gray-600">Initializing your strength discovery journey</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-4 bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">LifeCraft</h1>
          <p className="text-sm text-gray-600">Strength Discovery through Stories</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveProgress}
            disabled={!sessionId || isLoading || !isClient}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} /> Save
          </button>
          {stage === 'summary' && (
            <button
              onClick={exportStrengthProfile}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download size={16} /> Export
            </button>
          )}
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={16} /> New Session
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Sidebar - Progress */}
        <div className="w-1/4 min-w-64">
          <ProgressIndicator
            currentStage={stage}
            progressPercentage={progressStatus.completion}
            className="sticky top-0"
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm p-4 mb-4">
            {/* Welcome Message */}
            {showWelcome && messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to Your Strength Discovery Journey
                </h2>
                {showNameInput ? (
                  <div className="max-w-md mx-auto mt-6">
                    <p className="text-gray-600 mb-4">Let&apos;s start by getting to know you!</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleNameKeyPress}
                        placeholder="What's your name?"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleNameSubmit}
                        disabled={!tempName.trim()}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ) : userName ? (
                  <div>
                    <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4">
                      Hi {userName}! I&apos;m here to help you uncover your unique strengths through the power of storytelling. 
                      By reflecting on meaningful work experiences, we&apos;ll identify the skills, attitudes, 
                      and values that make you exceptional.
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto">
                      <p className="text-blue-800 font-medium">
                        💡 Ready to begin? Think of a time when you felt deeply satisfied with your work...
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
                className={`mb-6 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      AI
                    </div>
                  )}
                  <div
                    className={`inline-block max-w-[80%] p-4 rounded-lg shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                    {msg.timestamp && (
                      <div
                        className={`text-xs mt-2 ${
                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      Me
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="text-left mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="inline-block p-4 rounded-lg shadow-sm bg-gray-100 text-gray-800">
                    <div className="flex items-center space-x-2">
                      <span>Thinking about your response</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-100" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-lg shadow-sm p-4">
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
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[60px] max-h-32"
                disabled={isLoading}
                rows={2}
              />
              <button
                onClick={handleStreamingSend}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{stats.messageCount} messages • Session: {isClient ? sessionId?.slice(0, 8) : '...'}</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Visualization */}
        {stage === 'summary' && (
          <div className="w-1/3 min-w-96 max-h-full overflow-y-auto">
            <StrengthMindMap 
              data={strengths}
              userName={userName}
              className="h-fit"
            />
          </div>
        )}
      </div>
    </div>
  );
};