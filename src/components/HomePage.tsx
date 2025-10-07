'use client';

import React from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Brain, Target, ArrowRight, Sparkles, Users, TrendingUp, Heart, Lightbulb, LogIn, LogOut } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.log('No authenticated user:', error.message);
        setUser(null);
      } else {
        setUser(user);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('인증 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setSignInLoading(true);
      setError(null);

      // 환경 변수 확인
      console.log('Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        origin: window.location.origin
      });

      const supabase = createSupabaseClient();
      console.log('Supabase client created, attempting Google OAuth...');

      // Supabase는 자체 콜백 URL을 사용 (redirectTo 제거)
      console.log('Starting Google OAuth via Supabase...');
      console.log('Current origin:', window.location.origin);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
        // redirectTo 옵션 제거 - Supabase가 자동으로 Site URL로 리다이렉트
      });

      console.log('OAuth response:', { data, error });

      if (error) {
        console.error('Sign in error:', error);
        setError(`로그인 중 오류가 발생했습니다: ${error.message}`);
      } else {
        console.log('Sign in initiated successfully:', data);
        // OAuth 요청이 성공했다면 리다이렉트가 발생해야 함
        if (!data?.url) {
          setError('OAuth URL이 반환되지 않았습니다. Supabase 설정을 확인해주세요.');
        }
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      setError(`로그인 중 예외가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LifeCraft
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Dashboard</Link>
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 transition-colors">About</a>
            </nav>
            <button
              onClick={() => (isAuthenticated ? handleSignOut() : handleSignIn())}
              disabled={signInLoading}
              className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white/80 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signInLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Discover Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Authentic Self</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Unlock your potential through personalized assessments that reveal your unique strengths, 
            personality patterns, and growth opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#modules" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link 
              href="/results" 
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>View Sample Results</span>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">10K+</h3>
            <p className="text-gray-700">Users Discovered</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">95%</h3>
            <p className="text-gray-700">Accuracy Rate</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">85%</h3>
            <p className="text-gray-700">Growth Reported</p>
          </div>
        </div>

        {/* Modules Section */}
        <section id="modules" className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Discovery Path</h3>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Each assessment offers unique insights into different aspects of your personality and capabilities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {/* Enneagram Module */}
            <div className="group bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-purple-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Structured</span>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                Enneagram Assessment
              </h4>

              <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                Deep personality analysis using the proven Enneagram system. Understand your core motivations,
                fears, and patterns of behavior across different life situations.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">9 Personality Types</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Scientific</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Growth-Focused</span>
              </div>

              <Link
                href="/discover/enneagram"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Take Enneagram Test</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-3 text-center">
                <span className="text-sm text-gray-700">⏱️ 25-30 minutes</span>
              </div>
            </div>

            {/* Life Themes Module */}
            <div className="group bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-yellow-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Coming Soon</span>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors">
                Life Themes
              </h4>

              <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                Discover the recurring patterns and themes that shape your life journey. Understand your unique narrative and purpose.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Life Patterns</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Purpose-Driven</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Narrative-Based</span>
              </div>

              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-2xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Coming Soon</span>
              </button>

              <div className="mt-3 text-center">
                <span className="text-sm text-gray-700">⏱️ 20-25 minutes</span>
              </div>
            </div>

            {/* Strengths Discovery Module */}
            <div className="group bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-blue-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Interactive</span>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Strengths Discovery
              </h4>

              <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                Uncover your core strengths through AI-powered conversations and interactive visualizations.
                Discover what energizes you and where you excel naturally.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Conversational AI</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Story-Based</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Visualizations</span>
              </div>

              <Link
                href="/discover/strengths"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Discover Your Strengths</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-3 text-center">
                <span className="text-sm text-gray-700">⏱️ 15-20 minutes</span>
              </div>
            </div>

            {/* Values Discovery Module */}
            <div className="group bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-pink-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Interactive</span>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                Values Discovery
              </h4>

              <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                Identify your core values through an interactive sorting activity. Understand what truly matters
                to you in life, relationships, and career decisions.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Drag & Drop</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Self-Reflection</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Values-Based</span>
              </div>

              <Link
                href="/discover/values"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Discover Your Values</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-3 text-center">
                <span className="text-sm text-gray-700">⏱️ 10-15 minutes</span>
              </div>
            </div>

            {/* Vision Statement Module */}
            <div className="group bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">AI-Powered</span>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                Vision Statement
              </h4>

              <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                Create your personal vision statement through AI-guided reflection. Define your 10-year future and core aspirations.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">AI Coach</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">4-Step Process</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Vision Card</span>
              </div>

              <Link
                href="/discover/vision"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Craft Your Vision</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-3 text-center">
                <span className="text-sm text-gray-700">⏱️ 15-20 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Choose LifeCraft?</h3>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Our assessments combine scientific rigor with cutting-edge AI to provide personalized insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Insights</h4>
              <p className="text-gray-700 leading-relaxed">
                Advanced algorithms analyze your responses to provide nuanced, personalized feedback.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Actionable Results</h4>
              <p className="text-gray-700 leading-relaxed">
                Get specific recommendations for personal and professional growth.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Science-Based</h4>
              <p className="text-gray-700 leading-relaxed">
                Built on validated psychological frameworks and continuous research.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LifeCraft</span>
          </div>
          <p className="text-gray-700 mb-4">
            Empowering personal growth through intelligent assessments
          </p>
          <p className="text-sm text-gray-700">
            © 2025 LifeCraft. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
