'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Target, ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react';

export const HomePage: React.FC = () => {
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
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Discover Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Authentic Self</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
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
            <p className="text-gray-600">Users Discovered</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">95%</h3>
            <p className="text-gray-600">Accuracy Rate</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">85%</h3>
            <p className="text-gray-600">Growth Reported</p>
          </div>
        </div>

        {/* Modules Section */}
        <section id="modules" className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Discovery Path</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each assessment offers unique insights into different aspects of your personality and capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Strength Discovery Module */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-blue-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Interactive</span>
              </div>
              
              <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                Strength Discovery
              </h4>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Uncover your core strengths through AI-powered conversations and interactive visualizations. 
                Discover what energizes you and where you excel naturally.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Conversational AI</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Story-Based</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Visualizations</span>
              </div>
              
              <Link 
                href="/discover/strengths"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Discover Your Strengths</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">⏱️ 15-20 minutes</span>
              </div>
            </div>

            {/* Enneagram Module */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-purple-200 hover:shadow-2xl transition-all duration-300 animate-slide-up">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Structured</span>
              </div>
              
              <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                Enneagram Assessment
              </h4>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Deep personality analysis using the proven Enneagram system. Understand your core motivations, 
                fears, and patterns of behavior across different life situations.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">9 Personality Types</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Scientific</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Growth-Focused</span>
              </div>
              
              <Link 
                href="/discover/enneagram"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Take Enneagram Test</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">⏱️ 25-30 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Choose LifeCraft?</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our assessments combine scientific rigor with cutting-edge AI to provide personalized insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Insights</h4>
              <p className="text-gray-600 leading-relaxed">
                Advanced algorithms analyze your responses to provide nuanced, personalized feedback.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Actionable Results</h4>
              <p className="text-gray-600 leading-relaxed">
                Get specific recommendations for personal and professional growth.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Science-Based</h4>
              <p className="text-gray-600 leading-relaxed">
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
          <p className="text-gray-600 mb-4">
            Empowering personal growth through intelligent assessments
          </p>
          <p className="text-sm text-gray-500">
            © 2025 LifeCraft. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};