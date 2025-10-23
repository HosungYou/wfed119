#!/bin/bash

# WFED119 Modern Development Environment Setup
# For Supabase + Next.js 15 stack

set -e  # Exit on any error

echo "🚀 WFED119 LifeCraft AI Platform - Modern Setup"
echo "================================================"
echo "Setting up Supabase + Next.js 15 development environment"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Setup environment
if [ ! -f ".env.local" ]; then
    echo "⚙️  Setting up environment file..."
    cp .env.example .env.local
    echo ""
    echo "📝 IMPORTANT: Edit .env.local with your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Contact project owner for production credentials."
else
    echo "✅ Environment file already exists"
fi

# Verify build
echo "🔨 Testing build process..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo "📚 Next steps:"
echo "   1. Edit .env.local with Supabase credentials"
echo "   2. Run: npm run dev"
echo "   3. Visit: http://localhost:3000"
echo ""
echo "📖 Documentation:"
echo "   - Setup Guide: docs/collaboration/COLLABORATOR_SETUP.md"
echo "   - Project Guide: CLAUDE.md"
echo "   - Agent Guide: CLAUDE-AGENT.md"