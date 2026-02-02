'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Send,
  Sparkles,
  CheckCircle,
  RefreshCw,
  X,
  ChevronRight,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useTranslation } from '@/lib/i18n';
import {
  ConversationMessage,
  SuggestedThemeData,
  ConversationState,
} from '@/lib/types/lifeThemes';

const MAX_EXCHANGES = 5;
const MIN_EXCHANGES_FOR_THEMES = 3;

// Wrapper component to handle Suspense for useSearchParams
export default function ConversationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConversationContent />
    </Suspense>
  );
}

function ConversationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const { updateStage } = useModuleProgress('life-themes');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [themesSuggested, setThemesSuggested] = useState(false);
  const [themesConfirmed, setThemesConfirmed] = useState(false);
  const [suggestedThemes, setSuggestedThemes] = useState<SuggestedThemeData[] | null>(null);
  const [userInput, setUserInput] = useState('');

  // Auto-scroll to bottom when messages update
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch conversation state
  const fetchConversation = useCallback(async () => {
    try {
      const sessionIdParam = searchParams.get('sessionId');
      const url = sessionIdParam
        ? `/api/life-themes/conversation?sessionId=${sessionIdParam}`
        : '/api/life-themes/conversation';

      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        if (data.conversation) {
          setMessages(data.conversation.messages || []);
          setExchangeCount(data.conversation.exchangeCount || 0);
          setThemesSuggested(data.conversation.themesSuggested || false);
          setThemesConfirmed(data.conversation.themesConfirmed || false);
          setSuggestedThemes(data.conversation.suggestedThemes || null);
        }
      } else {
        const errorData = await res.json();
        if (res.status === 404) {
          // No active session, redirect to start
          router.push('/discover/life-themes');
          return;
        }
        setError(errorData.error || 'Failed to load conversation');
      }
    } catch (err) {
      console.error('[Conversation] Fetch error:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Send initial AI message if conversation is empty
  useEffect(() => {
    if (!loading && sessionId && messages.length === 0 && !sending) {
      sendMessage('', true);
    }
  }, [loading, sessionId, messages.length]);

  // Send message
  const sendMessage = async (message: string, isInitial: boolean = false) => {
    if (!sessionId) return;
    if (!isInitial && (!message.trim() || sending)) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/life-themes/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: isInitial ? '__INIT__' : message.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Add user message if not initial
        if (!isInitial) {
          const userMessage: ConversationMessage = {
            role: 'user',
            content: message.trim(),
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, userMessage]);
        }

        // Add AI response
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }

        setExchangeCount(data.exchangeCount);
        setThemesSuggested(data.themesSuggested || false);

        if (data.suggestedThemes) {
          setSuggestedThemes(data.suggestedThemes);
        }

        setUserInput('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('[Conversation] Send error:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Confirm themes and proceed
  const confirmThemes = async () => {
    if (!sessionId) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await fetch('/api/life-themes/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'confirm_themes',
        }),
      });

      if (res.ok) {
        await updateStage('findings', 70);
        router.push('/discover/life-themes/findings');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to confirm themes');
      }
    } catch (err) {
      console.error('[Conversation] Confirm error:', err);
      setError('Failed to confirm themes');
    } finally {
      setConfirming(false);
    }
  };

  // Continue chatting (dismiss themes temporarily)
  const continueChatting = () => {
    // Just dismiss the theme card and allow more exchanges
    setThemesSuggested(false);
    inputRef.current?.focus();
  };

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
    }
  };

  // Calculate progress percentage (Q1-Q6 = 60%, Conversation = 10%, Findings onwards = remaining)
  const progressPercent = Math.min(60 + (exchangeCount / MIN_EXCHANGES_FOR_THEMES) * 10, 70);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '대화 불러오는 중...' : 'Loading conversation...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {language === 'ko'
                ? `7단계: AI 대화 (${exchangeCount}/${MIN_EXCHANGES_FOR_THEMES}+ 교환)`
                : `Step 7: AI Conversation (${exchangeCount}/${MIN_EXCHANGES_FOR_THEMES}+ exchanges)`}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-3 shadow-lg">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'ko' ? '더 깊이 탐구해 봅시다' : "Let's Explore Deeper"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === 'ko'
              ? 'AI가 당신의 응답을 바탕으로 몇 가지 질문을 드립니다. 편하게 대화해 주세요.'
              : 'Based on your responses, I have some questions to help uncover your life themes.'}
          </p>
        </div>

        {/* Exchange Progress Dots */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {Array.from({ length: MIN_EXCHANGES_FOR_THEMES }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < exchangeCount
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
          {exchangeCount > MIN_EXCHANGES_FOR_THEMES && (
            <span className="text-sm text-gray-500 ml-2">+{exchangeCount - MIN_EXCHANGES_FOR_THEMES}</span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Messages Area */}
          <div className="h-[400px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-secondary-500" />
                      <span className="text-xs font-medium text-secondary-600">
                        {language === 'ko' ? 'AI 코치' : 'AI Coach'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span className="text-sm text-gray-500">
                      {language === 'ko' ? '생각 중...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Theme Suggestion Card */}
          {themesSuggested && suggestedThemes && suggestedThemes.length > 0 && (
            <div className="border-t border-gray-100 p-6 bg-gradient-to-r from-secondary-50 to-primary-50">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-secondary-600" />
                <h3 className="font-semibold text-gray-900">
                  {language === 'ko' ? '발견된 인생 테마' : 'Suggested Life Themes'}
                </h3>
              </div>

              <div className="grid gap-3 mb-4">
                {suggestedThemes.map((theme, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                        {theme.evidence.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {theme.evidence.slice(0, 3).map((ev, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 text-right">
                        <div
                          className={`text-xs font-medium ${
                            theme.confidence >= 80
                              ? 'text-green-600'
                              : theme.confidence >= 60
                              ? 'text-yellow-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {theme.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmThemes}
                  disabled={confirming}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {confirming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {language === 'ko' ? '테마 확인하고 계속' : 'Confirm & Continue'}
                    </>
                  )}
                </button>

                {exchangeCount < MAX_EXCHANGES && (
                  <button
                    onClick={continueChatting}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5 mr-2 inline" />
                    {language === 'ko' ? '더 대화하기' : 'Chat More'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Input Area - Only show if themes not suggested or continuing */}
          {(!themesSuggested || exchangeCount < MAX_EXCHANGES) && !themesSuggested && (
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      language === 'ko'
                        ? '생각을 자유롭게 적어주세요...'
                        : 'Share your thoughts freely...'
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={2}
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={() => sendMessage(userInput)}
                  disabled={!userInput.trim() || sending}
                  className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {language === 'ko'
                  ? 'Enter로 전송, Shift+Enter로 줄바꿈'
                  : 'Press Enter to send, Shift+Enter for new line'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/life-themes/questions/6')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {language === 'ko' ? '질문으로 돌아가기' : 'Back to Questions'}
          </button>

          {themesSuggested && (
            <button
              onClick={confirmThemes}
              disabled={confirming}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {confirming ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {language === 'ko' ? 'Findings로 이동' : 'Go to Findings'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
