import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Default status: OK even if DB is down; report as degraded
  let database: 'connected' | 'unconfigured' | 'timeout' | 'error' | 'skipped' = 'skipped';
  let dbError: string | undefined;

  if (!supabaseUrl) {
    database = 'unconfigured';
  } else {
    try {
      const supabase = createServerSupabaseClient();

      // Add a short timeout so health doesn't hang
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));

      await Promise.race([
        supabase.from('users').select('id').limit(1),
        timeout,
      ]);
      database = 'connected';
    } catch (err) {
      if (err instanceof Error && err.message === 'timeout') {
        database = 'timeout';
        dbError = 'Database check timed out';
      } else {
        database = 'error';
        dbError = err instanceof Error ? err.message : 'Unknown DB error';
      }
    }
  }

  // Never fail the health endpoint; return degraded info instead
  return NextResponse.json({
    status: database === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database,
    dbError,
    openai: hasOpenAIKey ? 'configured' : 'missing',
    environment: process.env.NODE_ENV || 'development',
    supabase: supabaseUrl ? 'configured' : 'missing',
  });
}