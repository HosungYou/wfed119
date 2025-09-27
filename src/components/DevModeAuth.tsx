'use client';

import { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

// Development-only auth bypass component
export default function DevModeAuth() {
  const [devUser, setDevUser] = useState(null);
  const supabase = createSupabaseClient();

  const createDevUser = async () => {
    // Create a fake user for development testing
    const fakeUser = {
      id: 'dev-user-' + Date.now(),
      email: 'dev@localhost.com',
      name: 'Dev User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in localStorage for development
    localStorage.setItem('dev-user', JSON.stringify(fakeUser));
    setDevUser(fakeUser);

    console.log('Dev user created:', fakeUser);
    window.location.reload();
  };

  const clearDevUser = () => {
    localStorage.removeItem('dev-user');
    setDevUser(null);
    window.location.reload();
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 p-4 rounded shadow-lg z-50 border">
      <h3 className="font-bold text-sm mb-2">🛠️ Dev Mode Auth</h3>
      <div className="space-y-2">
        <button
          onClick={createDevUser}
          className="block w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Create Dev User
        </button>
        <button
          onClick={clearDevUser}
          className="block w-full px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Clear Dev User
        </button>
      </div>
    </div>
  );
}