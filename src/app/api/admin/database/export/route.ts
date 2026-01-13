import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase';

const tableMap: Record<string, string> = {
  users: 'users',
  sessions: 'user_sessions',
  values: 'value_results',
  strengths: 'strength_profiles',
  conversations: 'conversation_messages'
};

const requireSuperAdmin = async () => {
  const supabase = await createServerSupabaseClient();
  // Use getUser() for better security (authenticates via Auth server)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[Admin Export] Role lookup error:', error);
  }

  if (userData?.role !== 'SUPER_ADMIN') {
    return { ok: false, status: 403, error: 'Super admin access required' };
  }

  return { ok: true, status: 200, error: null };
};

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return '';

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    const escaped = text.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(headers.map((key) => escapeCell(row[key])).join(','));
  });

  return lines.join('\n');
};

export async function GET(req: NextRequest) {
  const access = await requireSuperAdmin();
  if (!access.ok) {
    return new Response(JSON.stringify({ error: access.error }), {
      status: access.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const tableKey = searchParams.get('table') || 'users';
  const table = tableMap[tableKey];

  if (!table) {
    return new Response(JSON.stringify({ error: 'Unsupported table' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (format !== 'json' && format !== 'csv') {
    return new Response(JSON.stringify({ error: 'Unsupported format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (error) {
    console.error('[Admin Export] Service role missing:', error);
    return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const pageSize = 1000;
  let offset = 0;
  const rows: Record<string, unknown>[] = [];

  while (true) {
    const { data, error } = await admin
      .from(table)
      .select('*')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('[Admin Export] Query error:', error);
      return new Response(JSON.stringify({ error: 'Failed to export data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data || data.length === 0) break;

    rows.push(...(data as Record<string, unknown>[]));

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  const timestamp = Date.now();
  const filename = `wfed119_${tableKey}_${timestamp}.${format}`;

  if (format === 'csv') {
    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  return new Response(JSON.stringify(rows, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
