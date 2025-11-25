/**
 * One-off backfill script to populate module_progress from existing module tables.
 *
 * Usage:
 *  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ts-node scripts/backfill-module-progress.ts
 *
 * The script is idempotent and uses upsert on (user_id, module_id).
 */
import { createClient } from '@supabase/supabase-js';

type ModuleId = 'values' | 'strengths' | 'vision' | 'swot' | 'dreams';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ProgressRecord = {
  user_id: string;
  module_id: ModuleId;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  current_stage?: string | null;
  completed_at?: string | null;
};

async function collectUserIds(): Promise<Set<string>> {
  const tables = [
    { name: 'value_results', column: 'user_id' },
    { name: 'strength_discovery_results', column: 'user_id' },
    { name: 'vision_statements', column: 'user_id' },
    { name: 'swot_analyses', column: 'user_id' },
    { name: 'dreams', column: 'user_id' },
  ];

  const ids = new Set<string>();

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table.name)
      .select(`${table.column}`)
      .not(table.column, 'is', null);

    if (error) {
      console.warn(`[backfill] Skipping ${table.name}:`, error.message);
      continue;
    }

    data?.forEach((row: any) => {
      if (row[table.column]) ids.add(row[table.column]);
    });
  }

  return ids;
}

async function deriveProgress(userId: string): Promise<ProgressRecord[]> {
  const results: ProgressRecord[] = [];

  // Values
  const { data: valuesRows } = await supabase
    .from('value_results')
    .select('value_set, updated_at')
    .eq('user_id', userId);
  if (valuesRows && valuesRows.length > 0) {
    const setsCompleted = new Set(valuesRows.map((r: any) => r.value_set));
    const percent = Math.min(100, Math.round((setsCompleted.size / 3) * 100));
    results.push({
      user_id: userId,
      module_id: 'values',
      status: setsCompleted.size === 3 ? 'completed' : 'in_progress',
      completion_percentage: percent,
      current_stage: null,
      completed_at: setsCompleted.size === 3 ? valuesRows[0]?.updated_at : null,
    });
  }

  // Strengths
  const { data: strengthsRow } = await supabase
    .from('strength_discovery_results')
    .select('is_completed, final_strengths, updated_at, current_step')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (strengthsRow) {
    const hasStrengths = !!strengthsRow.final_strengths;
    const status = strengthsRow.is_completed
      ? 'completed'
      : hasStrengths
        ? 'in_progress'
        : 'not_started';
    const completionPercentage = strengthsRow.is_completed
      ? 100
      : strengthsRow.current_step
        ? Math.min(100, Math.round((strengthsRow.current_step / 4) * 100))
        : hasStrengths
          ? 50
          : 0;
    results.push({
      user_id: userId,
      module_id: 'strengths',
      status,
      completion_percentage: completionPercentage,
      current_stage: null,
      completed_at: strengthsRow.is_completed ? strengthsRow.updated_at : null,
    });
  }

  // Vision
  const { data: visionRow } = await supabase
    .from('vision_statements')
    .select('is_completed, final_statement, current_step, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (visionRow) {
    const hasStatement = !!visionRow.final_statement;
    const status = visionRow.is_completed
      ? 'completed'
      : hasStatement
        ? 'in_progress'
        : 'not_started';
    const completionPercentage = visionRow.is_completed
      ? 100
      : visionRow.current_step
        ? Math.min(100, Math.round((visionRow.current_step / 3) * 100))
        : hasStatement
          ? 50
          : 0;
    results.push({
      user_id: userId,
      module_id: 'vision',
      status,
      completion_percentage: completionPercentage,
      current_stage: null,
      completed_at: visionRow.is_completed ? visionRow.updated_at : null,
    });
  }

  // SWOT
  const { data: swotRow } = await supabase
    .from('swot_analyses')
    .select('updated_at')
    .eq('user_id', userId)
    .limit(1)
    .single();
  if (swotRow) {
    results.push({
      user_id: userId,
      module_id: 'swot',
      status: 'in_progress',
      completion_percentage: 50,
      current_stage: null,
      completed_at: null,
    });
  }

  // Dreams
  const { data: dreamsRows } = await supabase
    .from('dreams')
    .select('updated_at')
    .eq('user_id', userId)
    .limit(1);
  if (dreamsRows && dreamsRows.length > 0) {
    results.push({
      user_id: userId,
      module_id: 'dreams',
      status: 'in_progress',
      completion_percentage: 50,
      current_stage: null,
      completed_at: null,
    });
  }

  return results;
}

async function upsertProgress(records: ProgressRecord[]) {
  if (records.length === 0) return;

  const { error } = await supabase
    .from('module_progress')
    .upsert(records, { onConflict: 'user_id,module_id' });

  if (error) {
    console.error('[backfill] upsert failed:', error.message);
  }
}

async function main() {
  const userIds = await collectUserIds();
  console.log(`[backfill] Found ${userIds.size} users with module data`);

  for (const userId of userIds) {
    const progressRecords = await deriveProgress(userId);
    await upsertProgress(progressRecords);
    console.log(`[backfill] Upserted ${progressRecords.length} records for user ${userId}`);
  }

  console.log('[backfill] Completed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
