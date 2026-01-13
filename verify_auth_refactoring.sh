#!/bin/bash

echo "🔍 Supabase Authentication Refactoring Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check for session.user patterns
echo "1️⃣  Checking for session.user patterns..."
SESSION_USER_COUNT=$(grep -r "session\.user\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "// " | grep -v "/\*" | wc -l | tr -d ' ')

if [ "$SESSION_USER_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No session.user patterns found${NC}"
else
    echo -e "${RED}❌ FAIL: Found $SESSION_USER_COUNT session.user patterns${NC}"
    grep -rn "session\.user\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "// "
fi
echo ""

# Test 2: Check for session?.user patterns
echo "2️⃣  Checking for session?.user patterns..."
SESSION_OPTIONAL_COUNT=$(grep -r "session\?\.user\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v "// " | grep -v "onAuthStateChange" | wc -l | tr -d ' ')

if [ "$SESSION_OPTIONAL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No session?.user patterns found${NC}"
else
    echo -e "${RED}❌ FAIL: Found $SESSION_OPTIONAL_COUNT session?.user patterns${NC}"
fi
echo ""

# Test 3: Verify getVerifiedUser usage
echo "3️⃣  Checking getVerifiedUser() usage..."
GET_VERIFIED_COUNT=$(grep -r "getVerifiedUser()" src/app/api --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')

if [ "$GET_VERIFIED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS: Found $GET_VERIFIED_COUNT usages of getVerifiedUser()${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: No usages of getVerifiedUser() found${NC}"
fi
echo ""

# Test 4: Check for getSession() in API routes
echo "4️⃣  Checking for getSession() in API routes..."
GET_SESSION_COUNT=$(grep -r "\.getSession()" src/app/api --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')

if [ "$GET_SESSION_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No getSession() calls in API routes${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Found $GET_SESSION_COUNT getSession() calls${NC}"
fi
echo ""

# Test 5: Verify helper functions exist
echo "5️⃣  Verifying helper functions..."
if grep -q "export const getVerifiedUser" src/lib/supabase-server.ts; then
    echo -e "${GREEN}✅ PASS: getVerifiedUser() helper exists${NC}"
else
    echo -e "${RED}❌ FAIL: getVerifiedUser() helper missing${NC}"
fi

if grep -q "export const getCurrentUser" src/lib/supabase-server.ts; then
    echo -e "${GREEN}✅ PASS: getCurrentUser() helper exists${NC}"
else
    echo -e "${RED}❌ FAIL: getCurrentUser() helper missing${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 Summary"
echo "=================================================="
echo "Session.user patterns: $SESSION_USER_COUNT"
echo "Session?.user patterns: $SESSION_OPTIONAL_COUNT"
echo "getVerifiedUser() usages: $GET_VERIFIED_COUNT"
echo "getSession() in API routes: $GET_SESSION_COUNT"
echo ""

if [ "$SESSION_USER_COUNT" -eq 0 ] && [ "$SESSION_OPTIONAL_COUNT" -eq 0 ] && [ "$GET_VERIFIED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Authentication refactoring complete.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review the output above.${NC}"
    exit 1
fi
