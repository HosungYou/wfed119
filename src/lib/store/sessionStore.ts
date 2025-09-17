import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage, StrengthAnalysis } from '../services/aiServiceClaude';

export type SessionStage = 'initial' | 'exploration' | 'deepening' | 'analysis' | 'summary';

interface SessionState {
  // Core session data
  sessionId: string | null;
  stage: SessionStage;
  messages: ChatMessage[];
  strengths: StrengthAnalysis;
  isLoading: boolean;
  error: string | null;
  userName: string | null;
  
  // Session metadata
  startTime: Date | null;
  lastActivity: Date | null;
  progressPercentage: number;
  
  // Actions
  initSession: () => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (message: ChatMessage) => void;
  updateStage: (stage: SessionStage) => void;
  updateStrengths: (strengths: StrengthAnalysis) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUserName: (name: string) => void;
  clearSession: () => void;
  saveProgress: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  
  // Helper functions
  getConversationHistory: () => string;
  getProgressStatus: () => { stage: SessionStage; completion: number; nextStep: string };
}

const initialState = {
  sessionId: null,
  stage: 'initial' as SessionStage,
  messages: [],
  strengths: {
    skills: [],
    attitudes: [],
    values: []
  },
  isLoading: false,
  error: null,
  userName: null,
  startTime: null,
  lastActivity: null,
  progressPercentage: 0
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      initSession: () => {
        const newSessionId = crypto.randomUUID();
        const now = new Date();
        
        set({
          sessionId: newSessionId,
          stage: 'initial',
          messages: [],
          startTime: now,
          lastActivity: now,
          progressPercentage: 10,
          error: null
        });
      },

      addMessage: (message: ChatMessage) => {
        const now = new Date();
        set((state) => ({
          messages: [...state.messages, { ...message, timestamp: now.toISOString() }],
          lastActivity: now,
          progressPercentage: Math.min(90, state.progressPercentage + 5)
        }));
      },

      updateLastMessage: (message: ChatMessage) => {
        const now = new Date();
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = { ...message, timestamp: now.toISOString() };
          }
          return {
            messages: newMessages,
            lastActivity: now
          };
        });
      },

      updateStage: (stage: SessionStage) => {
        const progressMap: Record<SessionStage, number> = {
          initial: 20,
          exploration: 40,
          deepening: 60,
          analysis: 80,
          summary: 100
        };
        
        set({ 
          stage, 
          progressPercentage: progressMap[stage],
          lastActivity: new Date()
        });
      },

      updateStrengths: (strengths: StrengthAnalysis) => {
        set({ strengths, lastActivity: new Date() });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      setUserName: (name: string) => set({ userName: name.trim() }),

      clearSession: () => {
        set(initialState);
        // Force clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lifecraft-session');
          window.location.reload();
        }
      },

      saveProgress: async () => {
        const state = get();
        if (!state.sessionId) return;

        try {
          const response = await fetch('/api/session/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: state.sessionId,
              stage: state.stage,
              messages: state.messages,
              strengths: state.strengths,
              metadata: {
                startTime: state.startTime,
                lastActivity: state.lastActivity,
                progressPercentage: state.progressPercentage
              }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save session');
          }
        } catch (error) {
          console.error('Error saving progress:', error);
          set({ error: 'Failed to save progress. Please try again.' });
        }
      },

      loadSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch(`/api/session/${sessionId}`);
          if (!response.ok) {
            throw new Error('Session not found');
          }
          
          const data = await response.json();
          
          set({
            sessionId,
            stage: data.stage,
            messages: data.messages,
            strengths: data.strengths,
            startTime: data.metadata?.startTime ? new Date(data.metadata.startTime) : null,
            lastActivity: data.metadata?.lastActivity ? new Date(data.metadata.lastActivity) : new Date(),
            progressPercentage: data.metadata?.progressPercentage || 0,
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading session:', error);
          set({ 
            error: 'Failed to load session. Starting a new one.',
            isLoading: false
          });
          get().initSession();
        }
      },

      getConversationHistory: () => {
        const messages = get().messages;
        return messages
          .filter(m => m.role !== 'system')
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');
      },

      getProgressStatus: () => {
        const state = get();
        const stageDescriptions: Record<SessionStage, string> = {
          initial: 'Share your meaningful work experience',
          exploration: 'Exploring your story in detail',
          deepening: 'Uncovering deeper insights',
          analysis: 'Analyzing your strengths',
          summary: 'Your strength profile is complete!'
        };

        return {
          stage: state.stage,
          completion: state.progressPercentage,
          nextStep: stageDescriptions[state.stage] || 'Continue the conversation'
        };
      }
    }),
    {
      name: 'lifecraft-session',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        sessionId: state.sessionId,
        stage: state.stage,
        messages: state.messages,
        strengths: state.strengths,
        userName: state.userName,
        startTime: state.startTime,
        lastActivity: state.lastActivity,
        progressPercentage: state.progressPercentage
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert ISO strings back to Date objects
          if (state.startTime && typeof state.startTime === 'string') {
            state.startTime = new Date(state.startTime);
          }
          if (state.lastActivity && typeof state.lastActivity === 'string') {
            state.lastActivity = new Date(state.lastActivity);
          }
        }
      },
    }
  )
);

// Utility hook for getting session statistics
export const useSessionStats = () => {
  const { messages, stage, startTime, progressPercentage } = useSessionStore();
  
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.role === 'user').length;
  
  // Handle startTime being either Date object or ISO string
  let sessionDuration = 0;
  if (startTime) {
    const startTimeDate = startTime instanceof Date ? startTime : new Date(startTime);
    sessionDuration = Date.now() - startTimeDate.getTime();
  }
  
  const estimatedTimeRemaining = Math.max(0, (100 - progressPercentage) * 60000); // 1 min per 1%
  
  return {
    messageCount,
    userMessages,
    sessionDuration,
    estimatedTimeRemaining,
    stage,
    progressPercentage
  };
};
