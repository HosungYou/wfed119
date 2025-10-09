'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatBoxProps {
  step: number;
  context: any;
  onResponseComplete?: (response: string) => void;
  placeholder?: string;
  initialMessage?: string;
}

export default function AIChatBox({
  step,
  context,
  onResponseComplete,
  placeholder = "Type your message...",
  initialMessage
}: AIChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialMessageSentRef = useRef(false);

  // Display initial message (but don't auto-send to AI)
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;

      // Add AI's initial greeting message (not user message)
      const aiMessage: Message = {
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      };

      setMessages([aiMessage]);
    }
  }, [initialMessage]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/discover/vision/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step,
          userMessage: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          context
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('AI 응답 실패');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                fullResponse += data.content;
                setStreamingContent(fullResponse);
              } else if (data.type === 'done') {
                // 스트리밍 완료
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingContent('');
                setIsStreaming(false);

                // 콜백 호출
                if (onResponseComplete) {
                  onResponseComplete(fullResponse);
                }

                console.log('[AI Chat] Response completed:', {
                  tokens: data.tokens,
                  responseTime: data.responseTime
                });
              } else if (data.type === 'error') {
                console.error('[AI Chat] Error:', data.message);
                setIsStreaming(false);
                setStreamingContent('');
                alert(data.message);
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[AI Chat] Request aborted');
      } else {
        console.error('[AI Chat] Error:', error);
        alert('An error occurred during AI response.');
      }
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent('');
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border-2 border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 rounded-t-xl">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Chat with AI Coach</h3>
        <span className="ml-auto text-xs text-gray-500">Step {step}</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingContent && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              AI
            </div>
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl rounded-tl-none p-4 border border-purple-200">
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {streamingContent}
                <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isStreaming}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={2}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Shift + Enter for new line, Enter to send
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
            : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Message content */}
      <div
        className={`flex-1 max-w-[80%] rounded-2xl p-4 ${
          isUser
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-tr-none'
            : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-tl-none'
        }`}
      >
        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    </div>
  );
}
