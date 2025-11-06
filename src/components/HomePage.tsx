'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain, Target, ArrowRight, Sparkles, Users, TrendingUp, Heart,
  Lightbulb, ShieldAlert, Eye, BarChart3, Zap, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Compass
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string | null>('discovery');

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

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
            <a href="#modules" className="text-gray-700 hover:text-gray-900 transition-colors">Modules</a>
            <a href="#about" className="text-gray-700 hover:text-gray-900 transition-colors">About</a>
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

        {/* Modules Section - Categorized */}
        <section id="modules" className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Discovery Path</h3>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Follow our structured journey from self-discovery to strategic action planning.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Category 1: Self-Discovery Assessments */}
            <CategorySection
              title="Self-Discovery Assessments"
              description="Understand your personality, strengths, and core values"
              icon={<Sparkles className="w-6 h-6" />}
              color="blue"
              isOpen={openCategory === 'discovery'}
              onToggle={() => toggleCategory('discovery')}
              moduleCount={4}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <ModuleCard
                  title="Enneagram Assessment"
                  description="Deep personality analysis using the proven Enneagram system"
                  icon={<Brain className="w-6 h-6" />}
                  color="purple"
                  duration="25-30 minutes"
                  tags={['9 Types', 'Scientific', 'Growth-Focused']}
                  href="/discover/enneagram"
                  status="active"
                />
                <ModuleCard
                  title="Strengths Discovery"
                  description="Uncover your core strengths through AI-powered conversations"
                  icon={<Target className="w-6 h-6" />}
                  color="blue"
                  duration="15-20 minutes"
                  tags={['AI-Powered', 'Story-Based', 'Visualizations']}
                  href="/discover/strengths"
                  status="active"
                />
                <ModuleCard
                  title="Values Discovery"
                  description="Identify your core values through interactive sorting"
                  icon={<Heart className="w-6 h-6" />}
                  color="pink"
                  duration="10-15 minutes"
                  tags={['Drag & Drop', 'Self-Reflection', 'Values-Based']}
                  href="/discover/values"
                  status="active"
                />
                <ModuleCard
                  title="Life Themes"
                  description="Discover recurring patterns that shape your life journey"
                  icon={<Lightbulb className="w-6 h-6" />}
                  color="yellow"
                  duration="20-25 minutes"
                  tags={['Life Patterns', 'Purpose-Driven', 'Narrative']}
                  href="#"
                  status="coming-soon"
                />
              </div>
            </CategorySection>

            {/* Category 2: Visioning and Strategizing */}
            <CategorySection
              title="Visioning and Strategizing"
              description="Define your vision and analyze opportunities for growth"
              icon={<Eye className="w-6 h-6" />}
              color="purple"
              isOpen={openCategory === 'strategy'}
              onToggle={() => toggleCategory('strategy')}
              moduleCount={3}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <ModuleCard
                  title="Vision Statement"
                  description="Craft a compelling vision for your future with AI guidance"
                  icon={<Eye className="w-6 h-6" />}
                  color="indigo"
                  duration="20-30 minutes"
                  tags={['AI Chatbot', 'Guided', 'Future-Focused']}
                  href="/discover/vision"
                  status="active"
                />
                <ModuleCard
                  title="SWOT Analysis & Strategy"
                  description="Complete 4-stage workflow: SWOT → AI Strategies → Prioritization → Reflection"
                  icon={<ShieldAlert className="w-6 h-6" />}
                  color="red"
                  duration="45-60 minutes"
                  tags={['AI-Powered', '4-Stage Flow', 'Strategic']}
                  href="/discover/swot"
                  status="active"
                />
                <ModuleCard
                  title="Dream List"
                  description="Create your life dreams across 4 categories and life stages"
                  icon={<Compass className="w-6 h-6" />}
                  color="purple"
                  duration="30-45 minutes"
                  tags={['4 Categories', 'Timeline View', 'Values Integration']}
                  href="/discover/dreams"
                  status="active"
                />
              </div>
            </CategorySection>

            {/* Category 3: Action Planning */}
            <CategorySection
              title="Action Planning (Coming Soon with AI Chatbot)"
              description="Transform insights into actionable goals and plans"
              icon={<Zap className="w-6 h-6" />}
              color="green"
              isOpen={openCategory === 'action'}
              onToggle={() => toggleCategory('action')}
              moduleCount={2}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <ModuleCard
                  title="Goal Setting"
                  description="Set SMART goals with AI-powered chatbot guidance"
                  icon={<Target className="w-6 h-6" />}
                  color="green"
                  duration="30-40 minutes"
                  tags={['AI Chatbot', 'SMART Goals', 'Interactive']}
                  href="#"
                  status="coming-soon"
                />
                <ModuleCard
                  title="ERRC Action Plan"
                  description="Eliminate, Reduce, Raise, Create strategic actions with AI"
                  icon={<Zap className="w-6 h-6" />}
                  color="emerald"
                  duration="30-40 minutes"
                  tags={['AI Chatbot', 'Blue Ocean', 'Action-Focused']}
                  href="#"
                  status="coming-soon"
                />
              </div>
            </CategorySection>
          </div>
        </section>

        {/* Features Section */}
        <section id="about" className="mb-20">
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

// Category Section Component
interface CategorySectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  moduleCount: number;
  children: React.ReactNode;
}

function CategorySection({
  title,
  description,
  icon,
  color,
  isOpen,
  onToggle,
  moduleCount,
  children
}: CategorySectionProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 border-blue-200',
    purple: 'from-purple-500 to-purple-600 border-purple-200',
    green: 'from-green-500 to-green-600 border-green-200'
  };

  const bgColorClasses = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50'
  };

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? bgColorClasses[color as keyof typeof bgColorClasses] : 'bg-white'}`}>
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <div className="text-left">
            <h4 className="text-2xl font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">{moduleCount} modules</span>
          {isOpen ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-0 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// Module Card Component
interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  duration: string;
  tags: string[];
  href: string;
  status: 'active' | 'coming-soon';
}

function ModuleCard({
  title,
  description,
  icon,
  color,
  duration,
  tags,
  href,
  status
}: ModuleCardProps) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-purple-500 to-pink-600',
    yellow: 'from-yellow-500 to-orange-500',
    indigo: 'from-indigo-500 to-indigo-600',
    red: 'from-red-500 to-orange-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    emerald: 'from-emerald-500 to-emerald-600'
  };

  const badgeClasses = {
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    pink: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    emerald: 'bg-emerald-100 text-emerald-800'
  };

  const CardContent = (
    <div className="bg-white rounded-xl p-5 shadow-md border-2 border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        {status === 'coming-soon' ? (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Coming Soon
          </span>
        ) : (
          <span className={`${badgeClasses[color as keyof typeof badgeClasses]} px-3 py-1 rounded-full text-xs font-medium flex items-center`}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </span>
        )}
      </div>

      <h5 className="text-lg font-bold text-gray-900 mb-2">{title}</h5>
      <p className="text-gray-600 text-sm mb-3 flex-1">{description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {tags.map((tag, index) => (
          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {tag}
          </span>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 border-t pt-3">
        ⏱️ {duration}
      </div>
    </div>
  );

  if (status === 'coming-soon') {
    return <div className="opacity-60 cursor-not-allowed">{CardContent}</div>;
  }

  return (
    <Link href={href} className="block">
      {CardContent}
    </Link>
  );
}
