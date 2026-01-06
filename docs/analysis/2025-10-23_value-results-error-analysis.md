# Value Results API Error - Root Cause Analysis & Solution

## Date: September 27, 2025

## Problem Summary
The `/discover/values/work` page was experiencing HTTP 500 errors when trying to fetch saved results, causing the values categorization feature to fail in local development.

## Root Cause Analysis

### 1. **Client-Server Authentication Mismatch**
**Issue**: The client was sending `user_id` as a URL parameter, but the API route was using session-based authentication
```javascript
// Client (WRONG)
fetch(`/api/discover/values/results?user_id=${encodeURIComponent(userId)}&set=${routeSet}`)

// Server expects
// Uses session.user.id from authenticated session, ignores user_id parameter
```

### 2. **Missing Error Handling**
**Issue**: API routes lacked proper error logging and detailed error responses
- No logging of authentication failures
- Generic error messages without details
- Silent failures in catch blocks

### 3. **Database Query Issues**
**Issue**: Upsert operations were failing due to missing unique constraints
- PostgreSQL error 42P10: "no unique or exclusion constraint matching the ON CONFLICT specification"
- Supabase `.upsert()` requires explicit unique constraints

### 4. **Environment Variable Loading**
**Issue**: Inconsistent environment variable loading between local and production
- Hardcoded fallbacks were needed as workaround
- `.env.local` not consistently loaded in all contexts

## Solutions Implemented

### 1. Fixed Client-Server Authentication
```javascript
// Updated client code (src/app/discover/values/[set]/page.tsx)
useEffect(() => {
  // Only fetch if user is authenticated
  if (!user || !routeSet) return;

  // API uses session authentication, no need to pass user_id
  fetch(`/api/discover/values/results?set=${routeSet}`)
    .then(r => {
      if (!r.ok) {
        console.error('Failed to fetch saved results:', r.status, r.statusText);
        if (r.status === 401) {
          console.error('User not authenticated');
        }
        return { exists: false };
      }
      return r.json();
    })
    .then(data => {
      if (data && data.exists) {
        // Process saved data
      }
    })
    .catch(err => {
      console.error('Error fetching saved results:', err);
    });
}, [user, routeSet, VALUES]);
```

### 2. Enhanced Error Handling & Logging
```javascript
// Updated API route (src/app/api/discover/values/results/route.ts)
export async function GET(req: NextRequest) {
  try {
    console.log('[GET /api/discover/values/results] Request received');

    const supabase = createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('[GET /api/discover/values/results] Auth error:', authError);
      return NextResponse.json({
        error: 'Authentication error',
        details: authError.message
      }, { status: 500 });
    }

    if (!session) {
      console.log('[GET /api/discover/values/results] No session found');
      return NextResponse.json({
        error: 'Unauthorized - Please sign in'
      }, { status: 401 });
    }

    console.log('[GET /api/discover/values/results] User authenticated:', session.user.id);
    // ... rest of implementation
  } catch (err) {
    console.error('[GET /api/discover/values/results] Unexpected error:', err);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### 3. Replaced Upsert with Manual Insert/Update
```javascript
// Manual upsert logic
const { data: existingResult, error: findResultError } = await supabase
  .from('value_results')
  .select('id')
  .eq('user_id', session.user.id)
  .eq('value_set', valueSet)
  .maybeSingle();

if (findResultError) {
  console.error('Value result lookup error:', findResultError);
  return NextResponse.json({
    error: 'Failed to lookup value result.'
  }, { status: 500 });
}

if (existingResult) {
  // Update existing
  const { error } = await supabase
    .from('value_results')
    .update(resultData)
    .eq('user_id', session.user.id)
    .eq('value_set', valueSet);
} else {
  // Insert new
  const { error } = await supabase
    .from('value_results')
    .insert(resultData);
}
```

### 4. Created Diagnostic Test Script
```javascript
// scripts/test-supabase-connection.js
// Comprehensive test script to verify:
// - Environment variables
// - Database connection
// - Table existence
// - Auth service status
```

## Key Insights from Supabase Logs

From the logs screenshot, we observed:
- Multiple 200 (success) responses - indicating some requests work
- 400 errors - validation failures from missing/invalid parameters
- 500 errors - server-side failures from auth/database issues
- Pattern: Errors clustered around `/rest/v1/value_results` endpoint

## Verification Steps

1. **Run diagnostic script**:
```bash
node scripts/test-supabase-connection.js
```
Expected output:
- ✅ All environment variables set
- ✅ Database connection successful
- ✅ All tables exist

2. **Test in browser**:
- Sign in with Google OAuth
- Navigate to `/discover/values/work`
- Open browser console for detailed logs
- Verify no 500 errors in network tab

3. **Check server logs**:
```bash
npm run dev
# Look for console.log outputs with [GET/POST /api/discover/values/results] prefix
```

## Prevention Measures

### 1. Consistent Authentication Pattern
- Always use session-based auth in API routes
- Never pass user_id in URL parameters for authenticated requests
- Use `createServerSupabaseClient()` for server-side auth

### 2. Comprehensive Error Handling
- Log all API requests with consistent prefix
- Include error details in responses (code, message)
- Add try-catch blocks with meaningful error messages

### 3. Database Operations
- Avoid `.upsert()` unless unique constraints are properly configured
- Use manual insert/update logic with `.maybeSingle()`
- Always check for query errors before processing data

### 4. Development Tools
- Maintain diagnostic scripts for quick troubleshooting
- Add detailed logging in development mode
- Use browser dev tools to monitor network requests

## Monitoring Recommendations

1. **Client-side monitoring**:
```javascript
// Add to components
console.error('Component error:', {
  user: user?.id,
  route: routeSet,
  error: err
});
```

2. **Server-side monitoring**:
```javascript
// Add to API routes
console.log(`[${req.method} ${req.url}]`, {
  user: session?.user?.id,
  params: Object.fromEntries(searchParams),
  timestamp: new Date().toISOString()
});
```

3. **Supabase Dashboard**:
- Monitor API logs for error patterns
- Check authentication logs for failed sign-ins
- Review database logs for query performance

## Success Metrics

After implementing these fixes:
- ✅ No more 500 errors on `/discover/values/*` pages
- ✅ Successful data fetching for authenticated users
- ✅ Proper error messages for unauthenticated users
- ✅ Values can be saved and retrieved successfully
- ✅ Clear diagnostic logs for troubleshooting

## Next Steps

1. Remove hardcoded environment variable fallbacks once stable
2. Add proper unique constraints to database tables
3. Implement retry logic for transient failures
4. Add user-friendly error messages in UI
5. Set up error monitoring service (e.g., Sentry)