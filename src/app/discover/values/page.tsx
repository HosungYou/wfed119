'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Target, Briefcase, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function ValuesLanding() {
  const { status } = useSession();
  return (
    <div className="min-h-screen">
      <header className="glass-panel sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Value Discovery</h1>
          <div className="flex items-center gap-2">
            {status !== 'authenticated' ? (
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            ) : (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent font-outfit">
            Choose a Values Set
          </h2>
          <p className="text-lg text-gray-600">Select one of the three value sets to start your sorting activity.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          <Link href="/discover/values/terminal" className="group relative block glass-card p-8 rounded-3xl hover:shadow-xl hover:shadow-secondary-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/5 to-accent-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-secondary-500/30">
                <Heart className="w-8 h-8" />
              </div>
              <div className="font-bold text-xl mb-3 text-gray-900 font-outfit">Terminal Values</div>
              <div className="text-sm text-gray-600 leading-relaxed">Values tied to your ultimate life purpose</div>
            </div>
          </Link>
          <Link href="/discover/values/instrumental" className="group relative block glass-card p-8 rounded-3xl hover:shadow-xl hover:shadow-primary-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary-500/30">
                <Target className="w-8 h-8" />
              </div>
              <div className="font-bold text-xl mb-3 text-gray-900 font-outfit">Instrumental Values</div>
              <div className="text-sm text-gray-600 leading-relaxed">Behaviors and attitudes that help you reach your goals</div>
            </div>
          </Link>
          <Link href="/discover/values/work" className="group relative block glass-card p-8 rounded-3xl hover:shadow-xl hover:shadow-accent-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-primary-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-accent-500/30">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="font-bold text-xl mb-3 text-gray-900 font-outfit">Work Values</div>
              <div className="text-sm text-gray-600 leading-relaxed">What you need from your workplace and teammates</div>
            </div>
          </Link>
        </div>
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-primary-700 bg-primary-50/80 backdrop-blur-sm border border-primary-200 rounded-xl px-4 py-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            When you save your selections, we store the layout to personalize future modules.
          </div>
        </div>
      </main>
    </div>
  );
}
