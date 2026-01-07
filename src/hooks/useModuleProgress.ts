'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleId, ModuleStatus, ModuleProgress, MODULE_CONFIGS } from '@/lib/types/modules';

interface ModuleProgressState {
  progress: ModuleProgress | null;
  canStart: boolean;
  missingPrerequisites: ModuleId[];
  config: {
    name: string;
    description: string;
    route: string;
    stages?: string[];
  };
}

interface AllModulesProgress {
  modules: Record<ModuleId, ModuleProgressState>;
  completedModules: ModuleId[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing module progress
 */
export function useModuleProgress(moduleId?: ModuleId) {
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<ModuleProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated || !moduleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/modules/progress?moduleId=${moduleId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await res.json();
      setProgress({
        progress: data.progress,
        canStart: data.canStart,
        missingPrerequisites: data.missingPrerequisites || [],
        config: data.config,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, moduleId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = useCallback(async (
    updates: Partial<{
      status: ModuleStatus;
      currentStage: string;
      completionPercentage: number;
    }>
  ) => {
    if (!moduleId) return false;

    try {
      const res = await fetch('/api/modules/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, ...updates }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update progress');
      }

      // Refresh progress
      await fetchProgress();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [moduleId, fetchProgress]);

  const startModule = useCallback(async () => {
    return updateProgress({ status: 'in_progress' });
  }, [updateProgress]);

  const completeModule = useCallback(async () => {
    return updateProgress({ status: 'completed', completionPercentage: 100 });
  }, [updateProgress]);

  const updateStage = useCallback(async (stage: string, percentage?: number) => {
    return updateProgress({
      currentStage: stage,
      completionPercentage: percentage,
    });
  }, [updateProgress]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    startModule,
    completeModule,
    updateStage,
    refresh: fetchProgress,
    // Convenience aliases
    canStartModule: progress?.canStart ?? true,  // Default to true to allow starting
    missingPrerequisites: progress?.missingPrerequisites ?? [],
  };
}

/**
 * Hook for fetching all modules progress
 */
export function useAllModulesProgress(): AllModulesProgress {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<AllModulesProgress>({
    modules: {} as Record<ModuleId, ModuleProgressState>,
    completedModules: [],
    loading: true,
    error: null,
  });

  const fetchAllProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      const res = await fetch('/api/modules/progress');

      if (!res.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await res.json();
      setState({
        modules: data.modules || {},
        completedModules: data.completedModules || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAllProgress();
  }, [fetchAllProgress]);

  return state;
}

/**
 * Hook for getting cross-module context for AI prompts
 */
export function useModuleContext(moduleId: ModuleId) {
  const { isAuthenticated } = useAuth();
  const [context, setContext] = useState<{
    promptContext: string;
    hasContext: boolean;
    availableData: Record<string, unknown>;
    completedModules: ModuleId[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        setLoading(true);

        // Fetch both JSON and prompt format
        const [jsonRes, promptRes] = await Promise.all([
          fetch(`/api/modules/context?moduleId=${moduleId}&format=json`),
          fetch(`/api/modules/context?moduleId=${moduleId}&format=prompt`),
        ]);

        if (!jsonRes.ok || !promptRes.ok) {
          throw new Error('Failed to fetch context');
        }

        const jsonData = await jsonRes.json();
        const promptData = await promptRes.json();

        setContext({
          promptContext: promptData.promptContext || '',
          hasContext: promptData.hasContext || false,
          availableData: jsonData.availableData || {},
          completedModules: jsonData.completedModules || [],
        });
      } catch (err) {
        console.error('Error fetching module context:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [isAuthenticated, moduleId]);

  return { context, loading };
}
