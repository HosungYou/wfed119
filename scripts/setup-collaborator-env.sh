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

# Check database connection
echo "🔌 Checking database connection..."
if npx prisma db ping &>/dev/null; then
    echo "✅ Database connection successful"

    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate

    # Push schema to database
    echo "📊 Pushing database schema..."
    npx prisma db push --accept-data-loss

    echo "✅ Database setup completed"
else
    echo "⚠️  Database connection failed"
    echo "📝 Please check your DATABASE_URL in .env file"
    echo ""
    echo "Available options:"
    echo "1. Request Prisma Accelerate API key from project owner"
    echo "2. Set up local PostgreSQL database"
    echo "3. Use SQLite for local development (DATABASE_URL=\"file:./dev.db\")"
fi

# Create local development database (SQLite fallback)
echo ""
echo "🗄️  Creating local SQLite database as fallback..."
echo 'DATABASE_URL="file:./dev.db"' > .env.local
npx prisma db push --schema-only &>/dev/null || true

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "For database management:"
echo "- Run 'npx prisma studio' to open database GUI"
echo "- Check COLLABORATOR_SETUP.md for detailed instructions"
echo ""
echo "Need help? Contact the project owner for:"
echo "- Prisma Accelerate API key"
echo "- Google OAuth credentials"
echo "- Production environment access"