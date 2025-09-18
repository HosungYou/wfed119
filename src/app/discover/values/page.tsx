'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Target, Briefcase, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function ValuesLanding() {
  const { status } = useSession();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50">
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
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Choose a Values Set
          </h2>
          <p className="text-lg text-gray-600">Select one of the three value sets to start your sorting activity.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          <Link href="/discover/values/terminal" className="group relative block bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7"/>
              </div>
              <div className="font-bold text-lg mb-2 text-purple-900">Terminal Values</div>
              <div className="text-sm text-gray-700 leading-relaxed">Values tied to your ultimate life purpose</div>
            </div>
          </Link>
          <Link href="/discover/values/instrumental" className="group relative block bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7"/>
              </div>
              <div className="font-bold text-lg mb-2 text-blue-900">Instrumental Values</div>
              <div className="text-sm text-gray-700 leading-relaxed">Behaviors and attitudes that help you reach your goals</div>
            </div>
          </Link>
          <Link href="/discover/values/work" className="group relative block bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-7 h-7"/>
              </div>
              <div className="font-bold text-lg mb-2 text-green-900">Work Values</div>
              <div className="text-sm text-gray-700 leading-relaxed">What you need from your workplace and teammates</div>
            </div>
          </Link>
        </div>
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            When you save your selections, we store the layout to personalize future modules.
          </div>
        </div>
      </main>
    </div>
  );
}
