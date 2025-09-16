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
              <button onClick={() => signIn('google')} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogIn className="w-4 h-4"/>Google 로그인</button>
            ) : (
              <button onClick={() => signOut()} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogOut className="w-4 h-4"/>로그아웃</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose a Values Set</h2>
          <p className="text-gray-600">세 가지 중 하나를 선택해 정렬 활동을 시작하세요.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <Link href="/discover/values/terminal" className="group block bg-white border rounded-2xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-3"><Heart className="w-6 h-6"/></div>
            <div className="font-semibold">Terminal Values</div>
            <div className="text-sm text-gray-600">삶의 궁극적 목적과 관련된 가치</div>
          </Link>
          <Link href="/discover/values/instrumental" className="group block bg-white border rounded-2xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3"><Target className="w-6 h-6"/></div>
            <div className="font-semibold">Instrumental Values</div>
            <div className="text-sm text-gray-600">목적 달성을 위한 행동/태도 가치</div>
          </Link>
          <Link href="/discover/values/work" className="group block bg-white border rounded-2xl p-6 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3"><Briefcase className="w-6 h-6"/></div>
            <div className="font-semibold">Work Values</div>
            <div className="text-sm text-gray-600">직업·업무 환경에서의 가치</div>
          </Link>
        </div>
        <div className="mt-8 text-xs text-gray-600">저장 시, 향후 모듈 분석에 활용하기 위해 값 배치가 데이터베이스에 저장됩니다.</div>
      </main>
    </div>
  );
}

