#!/bin/bash

# WFED119 Fresh PostgreSQL Setup Script
# 완전히 새로운 PostgreSQL 데이터베이스 설정

set -e  # Exit on any error

echo "🚀 WFED119 Fresh PostgreSQL Setup Starting..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is required"
    echo "Please set it like: export DATABASE_URL='postgresql://...'"
    exit 1
fi

print_info "Using DATABASE_URL: ${DATABASE_URL:0:20}..."

# Step 1: Backup current setup
print_info "Step 1: Backing up current setup..."

# Create backup directory
mkdir -p backup/fresh-setup-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup/fresh-setup-$(date +%Y%m%d_%H%M%S)"

# Backup current schema
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma "$BACKUP_DIR/schema.sqlite.backup"
    print_status "Current schema backed up"
fi

# Backup current database (if exists)
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db "$BACKUP_DIR/dev.sqlite.backup"
    print_status "Current SQLite database backed up"
fi

# Backup current .env
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/env.backup"
    print_status "Current .env backed up"
fi

# Step 2: Update .env file
print_info "Step 2: Updating environment variables..."

# Create or update .env file
cat > .env << EOF
# PostgreSQL Database URL
DATABASE_URL="$DATABASE_URL"

# NextAuth Configuration
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://wfed119-1.onrender.com"

# Google OAuth (keep existing values if they exist)
EOF

# Preserve existing Google OAuth credentials if they exist
if [ -f "$BACKUP_DIR/env.backup" ]; then
    if grep -q "GOOGLE_CLIENT_ID" "$BACKUP_DIR/env.backup"; then
        grep "GOOGLE_CLIENT_ID" "$BACKUP_DIR/env.backup" >> .env
    fi
    if grep -q "GOOGLE_CLIENT_SECRET" "$BACKUP_DIR/env.backup"; then
        grep "GOOGLE_CLIENT_SECRET" "$BACKUP_DIR/env.backup" >> .env
    fi
fi

print_status "Environment variables updated"

# Step 3: Update Prisma schema
print_info "Step 3: Setting up PostgreSQL schema..."

# Use the enhanced PostgreSQL schema
cp prisma/schema.enhanced.prisma prisma/schema.prisma
print_status "PostgreSQL schema activated"

# Step 4: Install dependencies and generate Prisma client
print_info "Step 4: Installing dependencies..."
npm install
print_status "Dependencies installed"

# Step 5: Generate Prisma client
print_info "Step 5: Generating Prisma client..."
npx prisma generate
print_status "Prisma client generated"

# Step 6: Create initial migration
print_info "Step 6: Creating database schema..."
npx prisma migrate dev --name init --skip-seed
print_status "Database schema created"

# Step 7: Test connection
print_info "Step 7: Testing database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.\$connect();
    console.log('✅ PostgreSQL connection successful');
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();
"

print_status "Database connection verified"

# Step 8: Create admin user (if email provided)
if [ ! -z "$ADMIN_EMAIL" ]; then
    print_info "Step 8: Setting up admin user..."

    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function setupAdmin() {
      try {
        console.log('Note: Admin user will be created when they first log in with Google');
        console.log('Admin email: $ADMIN_EMAIL');
        console.log('They will need to be manually promoted to SUPER_ADMIN role after first login');
        await prisma.\$disconnect();
      } catch (error) {
        console.error('Setup note failed:', error);
      }
    }

    setupAdmin();
    "

    print_status "Admin setup instructions noted"
else
    print_warning "No ADMIN_EMAIL provided - skip admin setup"
fi

# Step 9: Create setup completion marker
echo "$(date): Fresh PostgreSQL setup completed" > .postgresql-setup-complete

# Final status
echo ""
echo "🎉 Fresh PostgreSQL Setup Completed Successfully!"
echo "==============================================="
echo ""
print_status "✅ PostgreSQL database connected"
print_status "✅ Schema migrated"
print_status "✅ Prisma client generated"
print_status "✅ Connection tested"
echo ""
print_info "Next steps:"
echo "1. Start development server: npm run dev"
echo "2. Access user dashboard: https://wfed119-1.onrender.com/dashboard"
echo "3. Access admin panel: https://wfed119-1.onrender.com/admin/database"
echo "4. First Google login will create user account"
if [ ! -z "$ADMIN_EMAIL" ]; then
    echo "5. Promote $ADMIN_EMAIL to SUPER_ADMIN role using:"
    echo "   UPDATE \"User\" SET role = 'SUPER_ADMIN' WHERE email = '$ADMIN_EMAIL';"
fi
echo ""
print_info "Backup location: $BACKUP_DIR"
echo "================================================="