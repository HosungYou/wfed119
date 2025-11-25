'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain, Target, ArrowRight, Sparkles, Users, TrendingUp, Heart,
  Lightbulb, ShieldAlert, Eye, BarChart3, Zap, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Compass, LogIn, LogOut, LayoutDashboard, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TiltCard } from './landing/TiltCard';
import { useAuth } from '@/contexts/AuthContext';

export const HomePage: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string | null>('discovery');
  const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useAuth();

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="w-full py-6 px-4 sticky top-0 z-50 backdrop-blur-sm bg-white/30 border-b border-white/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent font-outfit">
              LifeCraft
            </h1>
          </div>
          <nav className="flex items-center space-x-4 md:space-x-8">
            <a href="#modules" className="hidden md:block text-gray-700 hover:text-primary-600 transition-colors font-medium">Modules</a>
            <a href="#about" className="hidden md:block text-gray-700 hover:text-primary-600 transition-colors font-medium">About</a>

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                {user?.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-primary-200"
                  />
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-20 animate-fade-in relative z-10">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/50 text-primary-700 text-sm font-medium animate-slide-up relative z-20">
            ✨ AI-Powered Career Discovery
          </div>

          {/* Aurora Background Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-30 pointer-events-none">
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-300/30 via-secondary-300/30 to-accent-300/30 blur-3xl rounded-full"
            />
          </div>

          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight font-outfit tracking-tight relative z-20">
            Discover Your
            <span className="block bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              Authentic Self
            </span>
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Unlock your potential through personalized assessments that reveal your unique strengths,
            personality patterns, and growth opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="group bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <a
                href="#modules"
                className="group bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
            <Link
              href="/results"
              className="glass-panel text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:bg-white/80 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>View Sample Results</span>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="glass-card p-8 rounded-3xl text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2 font-outfit">10K+</h3>
            <p className="text-gray-600">Users Discovered</p>
          </div>
          <div className="glass-card p-8 rounded-3xl text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-secondary-600">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2 font-outfit">95%</h3>
            <p className="text-gray-600">Accuracy Rate</p>
          </div>
          <div className="glass-card p-8 rounded-3xl text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2 font-outfit">85%</h3>
            <p className="text-gray-600">Growth Reported</p>
          </div>
        </div>

        {/* Modules Section - Categorized */}
        <section id="modules" className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4 font-outfit">Choose Your Discovery Path</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow our structured journey from self-discovery to strategic action planning.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Category 1: Self-Discovery Assessments */}
            <CategorySection
              title="Self-Discovery Assessments"
              description="Understand your personality, strengths, and core values"
              icon={<Sparkles className="w-6 h-6" />}
              color="primary"
              isOpen={openCategory === 'discovery'}
              onToggle={() => toggleCategory('discovery')}
              moduleCount={4}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <ModuleCard
                  title="Enneagram Assessment"
                  description="Deep personality analysis using the proven Enneagram system"
                  icon={<Brain className="w-6 h-6" />}
                  color="secondary"
                  duration="25-30 minutes"
                  tags={['9 Types', 'Scientific', 'Growth-Focused']}
                  href="/discover/enneagram"
                  status="active"
                />
                <ModuleCard
                  title="Strengths Discovery"
                  description="Uncover your core strengths through AI-powered conversations"
                  icon={<Target className="w-6 h-6" />}
                  color="primary"
                  duration="15-20 minutes"
                  tags={['AI-Powered', 'Story-Based', 'Visualizations']}
                  href="/discover/strengths"
                  status="active"
                />
                <ModuleCard
                  title="Values Discovery"
                  description="Identify your core values through interactive sorting"
                  icon={<Heart className="w-6 h-6" />}
                  color="accent"
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
              color="secondary"
              isOpen={openCategory === 'strategy'}
              onToggle={() => toggleCategory('strategy')}
              moduleCount={3}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <ModuleCard
                  title="Vision Statement"
                  description="Craft a compelling vision for your future with AI guidance"
                  icon={<Eye className="w-6 h-6" />}
                  color="secondary"
                  duration="20-30 minutes"
                  tags={['AI Chatbot', 'Guided', 'Future-Focused']}
                  href="/discover/vision"
                  status="active"
                />
                <ModuleCard
                  title="SWOT Analysis & Strategy"
                  description="Complete 4-stage workflow: SWOT → AI Strategies → Prioritization → Reflection"
                  icon={<ShieldAlert className="w-6 h-6" />}
                  color="accent"
                  duration="45-60 minutes"
                  tags={['AI-Powered', '4-Stage Flow', 'Strategic']}
                  href="/discover/swot"
                  status="active"
                />
                <ModuleCard
                  title="Dream List"
                  description="Create your life dreams across 4 categories and life stages"
                  icon={<Compass className="w-6 h-6" />}
                  color="primary"
                  duration="30-45 minutes"
                  tags={['4 Categories', 'Timeline View', 'Values Integration']}
                  href="/discover/dreams"
                  status="active"
                />
              </div>
            </CategorySection>

            {/* Category 3: Action Planning */}
            <CategorySection
              title="Action Planning"
              description="Transform insights into actionable goals and plans"
              icon={<Zap className="w-6 h-6" />}
              color="accent"
              isOpen={openCategory === 'action'}
              onToggle={() => toggleCategory('action')}
              moduleCount={2}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <ModuleCard
                  title="Goal Setting"
                  description="Set SMART goals with AI-powered chatbot guidance"
                  icon={<Target className="w-6 h-6" />}
                  color="primary"
                  duration="30-40 minutes"
                  tags={['AI Chatbot', 'SMART Goals', 'Interactive']}
                  href="#"
                  status="coming-soon"
                />
                <ModuleCard
                  title="ERRC Action Plan"
                  description="Eliminate, Reduce, Raise, Create strategic actions with AI"
                  icon={<Zap className="w-6 h-6" />}
                  color="secondary"
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
        <section id="about" className="mb-24">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4 font-outfit">Why Choose LifeCraft?</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our assessments combine scientific rigor with cutting-edge AI to provide personalized insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TiltCard className="h-full">
              <div className="glass-card p-8 rounded-3xl text-center h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 font-outfit">AI-Powered Insights</h4>
                <p className="text-gray-600 leading-relaxed">
                  Advanced algorithms analyze your responses to provide nuanced, personalized feedback.
                </p>
              </div>
            </TiltCard>

            <TiltCard className="h-full">
              <div className="glass-card p-8 rounded-3xl text-center h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-secondary-500/30">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 font-outfit">Actionable Results</h4>
                <p className="text-gray-600 leading-relaxed">
                  Get specific recommendations for personal and professional growth.
                </p>
              </div>
            </TiltCard>

            <TiltCard className="h-full">
              <div className="glass-card p-8 rounded-3xl text-center h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-500/30">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 font-outfit">Science-Based</h4>
                <p className="text-gray-600 leading-relaxed">
                  Built on validated psychological frameworks and continuous research.
                </p>
              </div>
            </TiltCard>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/30 backdrop-blur-md py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 font-outfit">LifeCraft</span>
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
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-500 to-accent-600',
    yellow: 'from-yellow-500 to-orange-500'
  };

  const bgClasses = {
    primary: 'bg-primary-50/50',
    secondary: 'bg-secondary-50/50',
    accent: 'bg-accent-50/50',
    yellow: 'bg-yellow-50/50'
  };

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? bgClasses[color as keyof typeof bgClasses] : 'hover:bg-white/60'}`}>
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center space-x-5">
          <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200/50`}>
            {icon}
          </div>
          <div className="text-left">
            <h4 className="text-2xl font-bold text-gray-900 mb-1 font-outfit">{title}</h4>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500 bg-white/50 px-3 py-1 rounded-full">{moduleCount} modules</span>
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
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-500 to-accent-600',
    yellow: 'from-yellow-500 to-orange-500',
    purple: 'from-secondary-500 to-secondary-600', // Mapping old colors
    blue: 'from-primary-500 to-primary-600',
    pink: 'from-accent-500 to-accent-600',
    indigo: 'from-secondary-600 to-secondary-700',
    red: 'from-accent-600 to-accent-700',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-emerald-500 to-emerald-600',
    emerald: 'from-emerald-500 to-emerald-600'
  };

  const badgeClasses = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    accent: 'bg-accent-100 text-accent-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-secondary-100 text-secondary-800',
    blue: 'bg-primary-100 text-primary-800',
    pink: 'bg-accent-100 text-accent-800',
    indigo: 'bg-secondary-100 text-secondary-800',
    red: 'bg-accent-100 text-accent-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-emerald-100 text-emerald-800',
    emerald: 'bg-emerald-100 text-emerald-800'
  };

  const CardContent = (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {status === 'coming-soon' ? (
          <span className="bg-gray-100/80 backdrop-blur-sm text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center border border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Coming Soon
          </span>
        ) : (
          <span className={`${badgeClasses[color as keyof typeof badgeClasses] || badgeClasses.primary} px-3 py-1 rounded-full text-xs font-medium flex items-center`}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </span>
        )}
      </div>

      <h5 className="text-lg font-bold text-gray-900 mb-2 font-outfit">{title}</h5>
      <p className="text-gray-600 text-sm mb-4 flex-1 leading-relaxed">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span key={index} className="bg-white/60 border border-white/40 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 border-t border-gray-100 pt-3 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        {duration}
      </div>
    </div>
  );

  if (status === 'coming-soon') {
    return <div className="opacity-60 cursor-not-allowed h-full">{CardContent}</div>;
  }

  return (
    <Link href={href} className="block h-full">
      {CardContent}
    </Link>
  );
}
