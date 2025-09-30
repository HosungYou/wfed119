#!/bin/bash

# Collaborator Development Environment Setup Script

echo "🚀 Setting up WFED119 Collaborator Development Environment"
echo "============================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please update .env with your API keys and database URL"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check Supabase connection
echo "🔌 Checking Supabase connection..."
# Source .env file to get Supabase URL
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "✅ Supabase URL configured"
    echo "📊 Database is ready - Supabase handles schema automatically"
else
    echo "⚠️  Supabase connection not configured"
    echo "📝 Please update your .env file with Supabase credentials"
    echo ""
    echo "Required environment variables:"
    echo "1. NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL"
    echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY - Public anon key"
    echo "3. SUPABASE_SERVICE_ROLE_KEY - Service role key (for admin operations)"
    echo ""
    echo "Get these from: Supabase Dashboard > Settings > API"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Supabase credentials and API keys"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "For database management:"
echo "- Access Supabase Dashboard > Table Editor"
echo "- Run SQL queries in SQL Editor"
echo "- Check docs/collaboration/ for detailed instructions"
echo ""
echo "Need help? Contact the project owner for:"
echo "- Supabase project access"
echo "- Google OAuth credentials"
echo "- Production environment access"