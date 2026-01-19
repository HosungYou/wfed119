'use client';

import React from 'react';
import { Menu, X } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import type { ModuleId } from '@/lib/types/modules';

/* =============================================================================
 * Terra Editorial Design - Module Shell
 * Consistent layout wrapper for all module pages
 * ============================================================================= */

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
  full: 'max-w-editorial-wide',
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
    <div className="min-h-screen bg-surface-cream">
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
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-6 lg:px-8 py-8`}>
        {sidebar ? (
          /* Layout with sidebar */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Hidden on mobile, shown on desktop */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-28">
                <div className="card p-5">
                  {sidebar}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>

            {/* Mobile sidebar (collapsible) */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
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

/* =============================================================================
 * Mobile Sidebar Toggle
 * Floating button with slide-up panel for mobile
 * ============================================================================= */
function MobileSidebarToggle({ sidebar }: { sidebar: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-elevated flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all duration-200"
        aria-label="Toggle steps"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-surface-paper rounded-t-3xl shadow-dramatic z-50 max-h-[75vh] overflow-hidden animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto" />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(75vh-60px)]">
              {sidebar}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* =============================================================================
 * Module Card Component
 * Consistent card styling for module content
 * ============================================================================= */
export function ModuleCard({
  children,
  className = '',
  padding = 'normal',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
  variant?: 'default' | 'elevated' | 'interactive';
}) {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8',
  };

  const variantClasses = {
    default: 'card',
    elevated: 'card-elevated',
    interactive: 'card-interactive',
  };

  return (
    <div className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

/* =============================================================================
 * Module Section Component
 * Section wrapper with optional title
 * ============================================================================= */
export function ModuleSection({
  children,
  title,
  description,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-display text-xl font-semibold text-neutral-900 mb-1">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-body-sm text-neutral-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/* =============================================================================
 * Module Button Component
 * Consistent button styling with Terra Editorial design
 * ============================================================================= */
export function ModuleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'normal',
  disabled = false,
  className = '',
  type = 'button',
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'small' | 'normal' | 'large';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  icon?: React.ReactNode;
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft hover:shadow-medium',
    secondary: 'bg-surface-warm border border-neutral-200 text-neutral-700 hover:bg-surface-muted hover:border-neutral-300',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
    accent: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 shadow-soft hover:shadow-medium',
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-body-sm',
    normal: 'px-5 py-2.5 text-body-sm',
    large: 'px-7 py-3.5 text-body-md',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

/* =============================================================================
 * Module Input Component
 * Consistent input styling
 * ============================================================================= */
export function ModuleInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
}: {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`input ${className}`}
    />
  );
}

/* =============================================================================
 * Module Textarea Component
 * Consistent textarea styling
 * ============================================================================= */
export function ModuleTextarea({
  placeholder,
  value,
  onChange,
  rows = 4,
  className = '',
  disabled = false,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      className={`textarea ${className}`}
    />
  );
}

/* =============================================================================
 * Module Badge Component
 * Status badges with consistent styling
 * ============================================================================= */
export function ModuleBadge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'completed' | 'in-progress' | 'locked' | 'info';
  className?: string;
}) {
  const variantClasses = {
    default: 'badge bg-neutral-100 text-neutral-600 border border-neutral-200',
    completed: 'badge-completed',
    'in-progress': 'badge-in-progress',
    locked: 'badge-locked',
    info: 'badge-info',
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
