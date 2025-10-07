# Render Deployment Fix Guide

## Problem Diagnosis

### Symptoms
- ✗ 404 errors on static resources
- ✗ JSON parsing errors (receiving HTML instead of JSON)
- ✗ "Something went wrong" on dashboard
- ✗ All API routes returning 401 Unauthorized

### Root Cause
**Missing Supabase environment variables in Render.com**

The application requires Supabase authentication, but the Render deployment was missing the required environment variables, causing all authenticated API routes to fail.

## Solution: Configure Environment Variables

### Step 1: Access Render Dashboard

1. Go to https://dashboard.render.com
2. Select your service: **lifecraft-bot** (or **wfed119-1**)
3. Navigate to **Environment** tab in left sidebar

### Step 2: Add Required Environment Variables

Add the following environment variables (click **Add Environment Variable** button):

#### **Required - Supabase Configuration**

```bash
# From your Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://mldxtonwtfjvmxudwfma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHh0b253dGZqdm14dWR3Zm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NDg0MjgsImV4cCI6MjA3NDUyNDQyOH0.HX86qkTWGVZOqzTzE82K4RuTmJBmn1513-oSEIVrp_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHh0b253dGZqdm14dWR3Zm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk0ODQyOCwiZXhwIjoyMDc0NTI0NDI4fQ.FrkYOHv5Hti8z6jQ7PU2a3PErDuGYFiF70QSbM2EmzU
```

#### **Optional - AI Services**

```bash
# Only needed if using AI chat features
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

#### **Automatic - Render Provides**

```bash
NODE_ENV=production  # Already set automatically
PORT=10000           # Render assigns this automatically
```

### Step 3: Trigger Manual Deploy

After adding environment variables:

1. Click **Manual Deploy** button (top right)
2. Select **Clear build cache & deploy**
3. Wait for deployment to complete (5-10 minutes)

### Step 4: Verify Deployment

Once deployed, check:

1. **Health Check**: https://wfed119-1.onrender.com/api/health
   - Should return: `{ "status": "ok", "timestamp": "..." }`

2. **Dashboard Access**: https://wfed119-1.onrender.com/dashboard
   - Should show sign-in page (not "Something went wrong")

3. **Browser Console**: No more 401 or JSON parsing errors

## Updated Configuration Files

### `config/render.yaml`
- Removed PostgreSQL database configuration
- Added Supabase environment variables
- Kept autoDeploy enabled for CI/CD

### Why This Fixes The Issue

| Before | After |
|--------|-------|
| ✗ No Supabase credentials | ✓ Supabase URL + Keys configured |
| ✗ API routes fail auth → 401 | ✓ Authentication works |
| ✗ 401 returns HTML error page | ✓ Returns proper JSON responses |
| ✗ Frontend gets HTML, expects JSON | ✓ Frontend receives valid JSON |
| ✗ Dashboard crashes | ✓ Dashboard loads correctly |

## Troubleshooting

### Still Getting Errors?

1. **Check Environment Variables**
   ```bash
   # In Render Dashboard → Environment tab
   # Verify all 3 Supabase keys are present
   ```

2. **Check Build Logs**
   ```bash
   # In Render Dashboard → Logs tab
   # Look for "Build succeeded" message
   ```

3. **Check Runtime Logs**
   ```bash
   # In Render Dashboard → Logs tab
   # Look for Next.js startup message
   # Should see: "▲ Next.js 15.5.0"
   ```

4. **Clear Browser Cache**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open in incognito/private window

### Common Issues

**Issue**: Build succeeds but site still broken
- **Solution**: Wait 2-3 minutes for CDN cache to clear

**Issue**: 401 errors persist
- **Solution**: Verify Supabase URL/keys are correct (no typos)

**Issue**: Some pages work, others don't
- **Solution**: Check Supabase RLS policies are configured correctly

## Next Steps

After successful deployment:

1. ✓ Test all major features
2. ✓ Configure custom domain (optional)
3. ✓ Set up monitoring/alerts
4. ✓ Enable auto-scaling (if needed)

## Reference

- **Supabase Dashboard**: https://supabase.com/dashboard/project/mldxtonwtfjvmxudwfma
- **Render Dashboard**: https://dashboard.render.com
- **Production URL**: https://wfed119-1.onrender.com
- **Repository**: https://github.com/HosungYou/wfed119

---

**Last Updated**: 2025-10-07
**Issue**: Next.js 15 + Supabase deployment on Render.com
**Status**: ✓ Resolved
