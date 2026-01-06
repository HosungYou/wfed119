'use client';

import React from 'react';
import ModuleHeader from './ModuleHeader';
import type { ModuleId } from '@/lib/types/modules';

interface ModuleShellProps {
  moduleId: ModuleId;
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  sidebar?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-7xl',
};

export default function ModuleShell({
  moduleId,
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  showProgress = true,
  sidebar,
  maxWidth = 'xl',
}: ModuleShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <ModuleHeader
        moduleId={moduleId}
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={title}
        subtitle={subtitle}
        showProgress={showProgress}
      />

      {/* Main Content Area */}
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 py-6`}>
        {sidebar ? (
          /* Layout with sidebar */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Hidden on mobile, shown on desktop */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                {sidebar}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>

            {/* Mobile sidebar (collapsible) */}
            <div className="lg:hidden fixed bottom-4 right-4 z-50">
              <MobileSidebarToggle sidebar={sidebar} />
            </div>
          </div>
        ) : (
          /* Layout without sidebar */
          <main>
            {children}
          </main>
        )}
      </div>
    </div>
  );
}

// Mobile sidebar toggle component
function MobileSidebarToggle({ sidebar }: { sidebar: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors"
        aria-label="Toggle steps"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Sidebar Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              {sidebar}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Export a simple Card component for consistent styling
export function ModuleCard({
  children,
  className = '',
  padding = 'normal',
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}) {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8',
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

// Export a primary button for consistent styling
export function ModuleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'normal',
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'normal' | 'large';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    normal: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
