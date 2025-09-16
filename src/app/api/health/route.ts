import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const dbUrl = process.env.DATABASE_URL;

  // Default status: OK even if DB is down; report as degraded
  let database: 'connected' | 'unconfigured' | 'timeout' | 'error' | 'skipped' = 'skipped';
  let dbError: string | undefined;

  if (!dbUrl) {
    database = 'unconfigured';
  } else {
    try {
      // Add a short timeout so health doesn’t hang
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
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
  });
}
