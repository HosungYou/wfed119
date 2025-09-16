#!/bin/bash

# LifeCraft Bot Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-development}

echo -e "${GREEN}🚀 LifeCraft Bot Deployment Script${NC}"
echo -e "${YELLOW}Environment: $ENV${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Check environment variables
echo "Checking environment configuration..."

if [ "$ENV" = "production" ] || [ "$ENV" = "staging" ]; then
    if [ ! -f ".env.$ENV" ]; then
        echo -e "${RED}❌ .env.$ENV file not found${NC}"
        echo "Please create .env.$ENV with required variables"
        exit 1
    fi
    
    # Load environment file and check critical variables
    set -a
    source ".env.$ENV"
    set +a
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL not set in .env.$ENV${NC}"
        exit 1
    fi
    
    if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${RED}❌ No AI API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Environment variables configured${NC}"
fi

echo ""

# Install dependencies
echo "Installing dependencies..."
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Generate Prisma client
echo "Generating Prisma client..."
if [ "$ENV" = "production" ] || [ "$ENV" = "staging" ]; then
    npm run generate:pg
else
    npx prisma generate
fi
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Run database migrations
if [ "$ENV" = "production" ] || [ "$ENV" = "staging" ]; then
    echo "Running database migrations..."
    npm run migrate:deploy:pg
    echo -e "${GREEN}✓ Database migrations applied${NC}"
    echo ""
fi

# Build the application
echo "Building application..."
if [ "$ENV" = "production" ]; then
    npm run build:prod
elif [ "$ENV" = "staging" ]; then
    npm run build:render
else
    npm run build
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Please check the build errors above"
    exit 1
fi
echo ""

# Run tests (if available)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "Running tests..."
    npm test || true
    echo ""
fi

# Deployment instructions
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo "Next steps for deployment:"
echo ""

if [ "$ENV" = "production" ]; then
    echo "For Render deployment:"
    echo "  1. Commit all changes: git add . && git commit -m 'Deploy to production'"
    echo "  2. Push to main branch: git push origin main"
    echo "  3. Render will auto-deploy from the main branch"
    echo ""
    echo "For Vercel deployment:"
    echo "  1. Run: vercel --prod"
    echo ""
    echo "For Docker deployment:"
    echo "  1. Build image: docker build -t lifecraft-bot ."
    echo "  2. Run container: docker run -p 3000:3000 --env-file .env.production lifecraft-bot"
elif [ "$ENV" = "staging" ]; then
    echo "For staging deployment:"
    echo "  1. Push to staging branch: git push origin staging"
    echo "  2. Or deploy manually: vercel"
else
    echo "For local development:"
    echo "  1. Start development server: npm run dev"
    echo "  2. Open http://localhost:3000"
fi

echo ""
echo -e "${YELLOW}⚠️  Important reminders:${NC}"
echo "  - Ensure all API keys are set in the deployment platform"
echo "  - Verify database connection before going live"
echo "  - Test the /api/health endpoint after deployment"
echo "  - Monitor logs for any runtime errors"