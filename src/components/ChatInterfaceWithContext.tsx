'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSessionStore, useSessionStats } from '@/lib/store/sessionStore';
import { StrengthMindMap } from './visualization/StrengthMindMap';
import { ProgressIndicator } from './ui/ProgressIndicator';
import type { ChatMessage } from '@/lib/services/aiServiceClaude';
import { useModuleContext } from '@/hooks/useModuleProgress';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleId } from '@/lib/types/modules';
import {
  Save, RefreshCw, Send, Download, Loader2, Sparkles, Target,
  Heart, ChevronDown, ChevronUp, Info
} from 'lucide-react';

interface Props {
  moduleId: ModuleId;
}

/**
 * Enhanced ChatInterface with cross-module context injection
 */
export const ChatInterfaceWithContext: React.FC<Props> = ({ moduleId }) => {
  const [input, setInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showContext, setShowContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuth();
  const { context, loading: contextLoading } = useModuleContext(moduleId);

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
          context: {
            // Include cross-module context for AI
            moduleContext: context?.promptContext || '',
            hasValuesData: !!context?.availableData?.values,
            completedModules: context?.completedModules || [],
          }
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
      setError(error instanceof Error ? error.message : 'Failed to send message.');
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
    }
  };

  // Render values context panel
  const renderContextPanel = () => {
    if (!isAuthenticated || !context?.hasContext) return null;

    const valuesData = context.availableData?.values as {
      terminalTop3?: string[];
      instrumentalTop3?: string[];
      workTop3?: string[];
    } | undefined;

    if (!valuesData) return null;

    return (
      <div className="mb-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-600" />
            <span className="font-medium text-pink-900 text-sm">Your Values (from Values Discovery)</span>
          </div>
          {showContext ? (
            <ChevronUp className="w-4 h-4 text-pink-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-pink-600" />
          )}
        </button>

        {showContext && (
          <div className="px-3 pb-3 space-y-2">
            {valuesData.terminalTop3 && valuesData.terminalTop3.length > 0 && (
              <div>
                <span className="text-xs font-medium text-pink-800">Terminal Values:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {valuesData.terminalTop3.map((v, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {valuesData.instrumentalTop3 && valuesData.instrumentalTop3.length > 0 && (
              <div>
                <span className="text-xs font-medium text-purple-800">Instrumental Values:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {valuesData.instrumentalTop3.map((v, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start gap-1.5 mt-2 text-xs text-pink-700">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>This context is shared with the AI to personalize your strengths discovery.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Strengths Discovery
              </h1>
              <p className="text-sm text-gray-600">
                {userName ? `Welcome, ${userName}!` : 'Discover your unique strengths'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveProgress}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={clearSession}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          stage={stage}
          messageCount={messages.length}
          strengthsFound={Object.values(strengths).flat().length}
        />

        {/* Cross-module context panel */}
        {renderContextPanel()}

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {showWelcome && messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Let's discover your strengths!
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  {context?.hasContext
                    ? "I've loaded your values from the Values Discovery module. Let's use them to explore your strengths!"
                    : "Share your experiences and I'll help you identify your unique strengths."}
                </p>
              </div>
            )}

            {showNameInput && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-blue-900 mb-2">Before we begin, what's your name?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    placeholder="Your name"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleNameSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                disabled={isLoading || showNameInput}
              />
              <button
                onClick={handleStreamingSend}
                disabled={isLoading || !input.trim() || showNameInput}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Strengths Mind Map */}
        {Object.values(strengths).flat().length > 0 && (
          <div className="mt-6">
            <StrengthMindMap strengths={strengths} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterfaceWithContext;
