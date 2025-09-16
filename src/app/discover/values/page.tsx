'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Target, Briefcase, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function ValuesLanding() {
  const { data: session, status } = useSession();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Value Discovery</h1>
          <div className="flex items-center gap-2">
            {status !== 'authenticated' ? (
              <button onClick={() => signIn('google')} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogIn className="w-4 h-4"/>Sign in with Google</button>
            ) : (
              <button onClick={() => signOut()} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogOut className="w-4 h-4"/>Sign out</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose a Values Set</h2>
          <p className="text-gray-600">Choose one of the three sets to start the sorting activity.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <Link href="/discover/values/terminal" className="group block bg-white border rounded-2xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-3"><Heart className="w-6 h-6"/></div>
            <div className="font-semibold">Terminal Values</div>
            <div className="text-sm text-gray-600">Values related to ultimate life goals</div>
          </Link>
          <Link href="/discover/values/instrumental" className="group block bg-white border rounded-2xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3"><Target className="w-6 h-6"/></div>
            <div className="font-semibold">Instrumental Values</div>
            <div className="text-sm text-gray-600">Values about behaviors/attitudes to achieve goals</div>
          </Link>
          <Link href="/discover/values/work" className="group block bg-white border rounded-2xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3"><Briefcase className="w-6 h-6"/></div>
            <div className="font-semibold">Work Values</div>
            <div className="text-sm text-gray-600">Values in your job and work environment</div>
          </Link>
        </div>
        <div className="mt-8 text-xs text-gray-600">When you save, your value placements are stored for later analysis across modules.</div>
      </main>
    </div>
  );
}
