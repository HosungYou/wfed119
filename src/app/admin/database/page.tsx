'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Database, Users, FileText, Activity, Shield, Download,
  RefreshCw, Trash2, Search, Filter, AlertCircle, CheckCircle,
  TrendingUp, Clock, HardDrive, Loader2
} from 'lucide-react';

interface DatabaseStats {
  users: { total: number; admins: number; active: number };
  sessions: { total: number; completed: number; active: number };
  values: { total: number; byType: Record<string, number> };
  strengths: { total: number; unique: number };
  storage: { used: string; limit: string; percentage: number };
}

export default function DatabaseAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [selectedTable, setSelectedTable] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/');
        return;
      }

      setUser(session.user);

      const res = await fetch('/api/admin/check-access');
      const data = await res.json();

      if (!data.isAdmin || data.role !== 'SUPER_ADMIN') {
        alert('Access denied. SUPER_ADMIN role required.');
        router.push('/dashboard');
        return;
      }

      fetchDatabaseStats();
    } catch (error) {
      console.error('Access check failed:', error);
      router.push('/');
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const res = await fetch('/api/admin/database/stats');
      const data = await res.json();
      setStats(data);
      setLastBackup(data.lastBackup ? new Date(data.lastBackup) : null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!confirm('Create a new database backup?')) return;

    try {
      const res = await fetch('/api/admin/database/backup', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        alert(`Backup created successfully: ${data.filename}`);
        setLastBackup(new Date());
      }
    } catch (error) {
      alert('Backup failed. Check console for details.');
      console.error(error);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Clean up orphaned data and old sessions? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/admin/database/cleanup', { method: 'POST' });
      const data = await res.json();

      alert(`Cleanup completed:\n- ${data.sessionsDeleted} old sessions removed\n- ${data.orphanedRecords} orphaned records removed`);
      fetchDatabaseStats();
    } catch (error) {
      alert('Cleanup failed. Check console for details.');
      console.error(error);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const res = await fetch(`/api/admin/database/export?format=${format}&table=${selectedTable}`);
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wfed119_${selectedTable}_${Date.now()}.${format}`;
      a.click();
    } catch (error) {
      alert('Export failed. Check console for details.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold">Database Administration</h1>
                <p className="text-sm text-gray-400">WFED119 Database Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-400 font-medium">SUPER_ADMIN ACCESS</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-gray-500">USERS</span>
            </div>
            <p className="text-2xl font-bold">{stats?.users.total || 0}</p>
            <p className="text-xs text-gray-400">{stats?.users.admins || 0} admins</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500">SESSIONS</span>
            </div>
            <p className="text-2xl font-bold">{stats?.sessions.total || 0}</p>
            <p className="text-xs text-gray-400">{stats?.sessions.completed || 0} completed</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-500">VALUES</span>
            </div>
            <p className="text-2xl font-bold">{stats?.values.total || 0}</p>
            <p className="text-xs text-gray-400">3 categories</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              <span className="text-xs text-gray-500">STRENGTHS</span>
            </div>
            <p className="text-2xl font-bold">{stats?.strengths.total || 0}</p>
            <p className="text-xs text-gray-400">{stats?.strengths.unique || 0} unique</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-5 h-5 text-red-500" />
              <span className="text-xs text-gray-500">STORAGE</span>
            </div>
            <p className="text-2xl font-bold">{stats?.storage.percentage || 0}%</p>
            <p className="text-xs text-gray-400">{stats?.storage.used} / {stats?.storage.limit}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchDatabaseStats()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Stats
              </button>
              <button
                onClick={handleBackup}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Backup Database
              </button>
              <button
                onClick={handleCleanup}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Cleanup Data
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">
                Last backup: {lastBackup ? lastBackup.toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Table Selection and Export */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Data Management</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                <option value="users">Users</option>
                <option value="sessions">Sessions</option>
                <option value="values">Value Results</option>
                <option value="strengths">Strengths</option>
                <option value="conversations">Conversations</option>
              </select>
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedTable}...`}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Table Preview */}
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 text-center">
              Table data preview will be loaded here
            </p>
          </div>
        </div>

        {/* System Health */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Database Connection
              </span>
              <span className="text-sm text-green-400">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                API Response Time
              </span>
              <span className="text-sm text-green-400">&lt; 200ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Storage Usage
              </span>
              <span className="text-sm text-yellow-400">{stats?.storage.percentage}% used</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}