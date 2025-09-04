#!/bin/bash

# WFED119 Development Environment Setup Script
# For student interns - automates the setup process

set -e  # Exit on any error

echo "================================================"
echo "WFED119 LifeCraft AI Platform - Dev Setup"
echo "================================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if running in the correct directory
if [[ ! -f "package.json" ]]; then
    log_error "Please run this script from the wfed119 project root directory"
    exit 1
fi

log_info "Starting WFED119 development environment setup..."
echo

# 1. Check prerequisites
log_info "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js installed: $NODE_VERSION"
else
    log_error "Node.js not found. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm installed: $NPM_VERSION"
else
    log_error "npm not found. Please install npm"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker installed: $DOCKER_VERSION"
else
    log_warning "Docker not found. You'll need Docker Desktop for database services"
    log_info "Download from: https://www.docker.com/products/docker-desktop/"
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    log_success "Git installed: $GIT_VERSION"
else
    log_error "Git not found. Please install Git"
    exit 1
fi

echo

# 2. Install Node.js dependencies
log_info "Installing Node.js dependencies..."
npm install
log_success "Node.js dependencies installed"

# 3. Set up environment variables
if [[ ! -f ".env.local" ]]; then
    log_info "Creating .env.local from template..."
    cp .env.example .env.local
    log_success "Created .env.local"
    log_warning "⚠️  IMPORTANT: Edit .env.local and add your API keys!"
    echo "   Required: ANTHROPIC_API_KEY or OPENAI_API_KEY"
    echo "   Request keys from your project lead"
else
    log_info ".env.local already exists"
fi

echo

# 4. Start Docker services (if Docker is available)
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    log_info "Starting Docker services (PostgreSQL, Qdrant, Redis)..."
    
    # Check if services are already running
    if docker-compose ps | grep -q "Up"; then
        log_info "Some services are already running"
    fi
    
    docker-compose up -d postgres qdrant redis
    
    # Wait for services to be healthy
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check service health
    if docker-compose ps postgres | grep -q "Up"; then
        log_success "PostgreSQL is running"
    else
        log_warning "PostgreSQL may not be ready yet"
    fi
    
    if docker-compose ps qdrant | grep -q "Up"; then
        log_success "Qdrant is running"
    else
        log_warning "Qdrant may not be ready yet"
    fi
    
    if docker-compose ps redis | grep -q "Up"; then
        log_success "Redis is running"
    else
        log_warning "Redis may not be ready yet"
    fi
    
else
    log_warning "Docker not available. Database services won't start automatically."
fi

echo

# 5. Set up database (Prisma)
log_info "Setting up database..."

# Generate Prisma client
npx prisma generate
log_success "Prisma client generated"

# Try to push database schema
if docker-compose ps postgres | grep -q "Up"; then
    log_info "Applying database schema..."
    # Wait a bit more for PostgreSQL to be fully ready
    sleep 5
    if DATABASE_URL="postgresql://admin:wfed119_dev_password@localhost:5432/wfed119" npx prisma db push; then
        log_success "Database schema applied"
    else
        log_warning "Database schema push failed. You may need to set up the database manually."
    fi
else
    log_warning "PostgreSQL not running. Skipping database setup."
    log_info "You can run 'docker-compose up -d postgres' and then 'npx prisma db push' later"
fi

echo

# 6. Test the setup
log_info "Testing the setup..."

# Try to build the project
if npm run build; then
    log_success "Build test passed"
else
    log_warning "Build test failed. Check your API keys in .env.local"
fi

echo

# 7. Show service status
log_info "Service Status:"
if command -v docker-compose &> /dev/null; then
    echo "Docker Services:"
    docker-compose ps 2>/dev/null || log_warning "Docker services not available"
else
    log_warning "Docker Compose not available"
fi

echo
echo "================================================"
log_success "Setup Complete!"
echo "================================================"
echo

echo "Next steps:"
echo "  1. Edit .env.local with your API keys"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open http://localhost:3000 in your browser"
echo
echo "Useful commands:"
echo "  npm run dev         - Start development server"
echo "  npm run build       - Build for production"
echo "  npm run lint        - Run code linting"
echo "  docker-compose ps   - Check service status"
echo "  npx prisma studio   - Open database browser"
echo
echo "Available services:"
echo "  • LifeCraft Bot: http://localhost:3000"
echo "  • Qdrant UI: http://localhost:6334"
echo "  • pgAdmin: http://localhost:8080 (run: docker-compose --profile admin up)"
echo
echo "Need help? Check INTERN_SETUP.md or ask in Slack!"
echo
log_success "Happy coding! 🚀"