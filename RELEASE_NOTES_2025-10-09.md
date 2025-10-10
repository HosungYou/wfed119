# Release Notes - Version 2.1.0
**Release Date:** October 9, 2025
**Module:** Vision Statement Discovery
**Type:** Major Feature Update + Critical Bug Fixes

---

## 🎯 Overview

This release represents a significant enhancement to the Vision Statement module based on user feedback from the October 9th design review meeting. The update focuses on improving user control, professional self-emphasis, and fixing critical authentication and database issues.

---

## ✨ New Features

### 1. Time Horizon Selection Page
**Component:** `/src/app/discover/vision/time-horizon/page.tsx`

Added a pre-Step 1 page allowing users to explicitly choose their vision timeline:

- **Years from now:** Select 5, 10, 15, 20, 25, or 30 years
- **Specific age:** Enter target age (18-100 years old)
- Dynamic time horizon text propagates throughout the module
- Replaces hard-coded "10 years from now" default

**User Impact:** Users now have explicit control over their vision timeframe, making the exercise more personally meaningful.

**Technical Details:**
```typescript
// Database fields added
time_horizon: INTEGER
time_horizon_type: VARCHAR(50) // 'years_from_now' | 'specific_age'
```

### 2. "Choose Only ONE" Primary Aspiration Logic
**Component:** `/src/app/discover/vision/step3/page.tsx`

Complete redesign of Step 3 with two-phase approach:

**Phase 3A: Choose Only ONE**
- Radio button selection interface (single choice only)
- Displays previously selected 3-5 core aspirations from Step 2
- Visual emphasis with yellow/orange gradient and 4px border
- Forces user to identify THE most important aspiration

**Phase 3B: Magnitude of Impact Questions**
- Unlocks after primary aspiration selection
- AI-guided exploration with three key questions:
  - Scale of impact (community/national/global)
  - Number of people impacted
  - Symbolic moment representing achievement
- Stores magnitude_of_impact as structured text

**User Impact:** Provides clarity and focus by forcing prioritization, followed by depth exploration.

**Technical Details:**
```typescript
// Database fields added
primary_aspiration: VARCHAR(255)
magnitude_of_impact: TEXT
```

### 3. Professional Self Emphasis
**Modified:** Step 1, Step 2, Step 3 prompts and guidance

All instructional text now explicitly emphasizes **PROFESSIONAL LIFE** and **CAREER** focus:

- Step 1 initial message: "Now, let's imagine your PROFESSIONAL LIFE..."
- Added warning box: "⚠️ Important: This vision focuses on your PROFESSIONAL SELF as the anchor"
- Prompt questions focus on professional role, work impact, career helping
- Placeholder text updated to "my work life", "professional journey"

**User Impact:** Prevents scope drift into personal life visions, maintains module focus.

---

## 🐛 Bug Fixes

### Critical: Authentication System Overhaul

**Issue:** 401 Unauthorized errors after successful login when navigating vision module pages

**Root Cause:** API requests not including Authorization headers; client-server session mismatch

**Fix:**
- Created `/src/lib/supabase-client-auth.ts` with `makeAuthenticatedRequest()` helper
- Created `/src/app/discover/vision/utils/session-helpers.ts` with typed wrappers
- All vision module API calls now include `Authorization: Bearer ${token}` header
- Improved session error handling with automatic login redirect

**Affected Endpoints:**
- `GET /api/discover/vision/session`
- `PATCH /api/discover/vision/session`
- `GET /api/discover/vision/check-prerequisites`

**User Impact:** Seamless authenticated experience; no more unexpected logouts.

---

### Critical: Database Table Name Mismatches

**Issue:**
```
Could not find the table 'public.value_assessment_results' in the schema cache
Could not find the table 'public.user_assessments' in the schema cache
```

**Root Cause:** Code referenced outdated table names from previous schema version

**Fix:**
- `value_assessment_results` → `value_results`
- `user_assessments` → `strength_profiles`
- Changed `.single()` to `.maybeSingle()` for graceful handling of missing data

**Affected Files:**
- `/src/app/api/discover/vision/session/route.ts`
- `/src/app/api/discover/vision/check-prerequisites/route.ts`

**User Impact:** Prerequisites check now works correctly; module entry validation functional.

---

### Critical: Check Constraint Violation

**Issue:**
```
new row for relation "vision_statements" violates check constraint
"vision_statements_current_step_check"
```

**Root Cause:** Database constraint only allowed steps 1-4; time-horizon page requires step 0

**Fix:**
- Migration: `/database/migrations/fix-vision-step-constraint.sql`
- Updated constraint: `CHECK (current_step >= 0 AND current_step <= 4)`
- Session creation now initializes with `current_step: 0`

**User Impact:** Time horizon selection page loads without errors.

---

### High Priority: Insecure Session Handling

**Issue:** Supabase warning: "Using the user object as returned from supabase.auth.getSession() could be insecure!"

**Root Cause:** `getSession()` reads from local storage without server verification

**Fix:** All API routes migrated from `getSession()` to `getUser()`
```typescript
// Before
const { data: { session } } = await supabase.auth.getSession();

// After
const { data: { user } } = await supabase.auth.getUser();
const auth = checkDevAuth(user ? { user } : null);
```

**User Impact:** Enhanced security; server-side session verification on every API call.

---

### High Priority: Unwanted AI Auto-Response

**Issue:** AI automatically generated responses in Korean without user input; initial message text appeared as user-generated content

**User Feedback:** "일단 영어를 입력했는데 AI한테서 한글이 나오지 않게 해줘. 그리고 자동적으로 왜 예상 답변이 나타나는거지?"

**Root Cause:** AIChatBox component auto-sent initialMessage to AI endpoint, generating unwanted streaming response

**Fix:**
- Removed 81 lines of auto-send logic from `/src/app/discover/vision/components/AIChatBox.tsx`
- `initialMessage` now displays as AI greeting only (role: 'assistant')
- User must manually send message to trigger AI response
- No automatic API calls on component mount

**User Impact:** User has explicit control over AI interaction; no surprise responses.

---

### Medium Priority: Korean Locale in Timestamps

**Issue:** Timestamps displayed as "오전 09:48" instead of English format

**Fix:** Changed `toLocaleTimeString('ko-KR')` to `toLocaleTimeString('en-US', { hour12: true })`

**User Impact:** Consistent English-only interface throughout module.

---

## 🗄️ Database Schema Changes

### Migration: `add-time-horizon-to-vision.sql`

```sql
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS time_horizon INTEGER,
ADD COLUMN IF NOT EXISTS time_horizon_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_aspiration VARCHAR(255),
ADD COLUMN IF NOT EXISTS magnitude_of_impact TEXT,
ADD COLUMN IF NOT EXISTS professional_focus_validated BOOLEAN DEFAULT FALSE;
```

### Migration: `fix-vision-step-constraint.sql`

```sql
ALTER TABLE public.vision_statements
DROP CONSTRAINT IF EXISTS vision_statements_current_step_check;

ALTER TABLE public.vision_statements
ADD CONSTRAINT vision_statements_current_step_check
CHECK (current_step >= 0 AND current_step <= 4);
```

**⚠️ Action Required:** Database administrators must run these migrations in Supabase Dashboard before deploying.

---

## 🔄 Breaking Changes

### 1. Vision Module Entry Point Changed
- **Before:** `/discover/vision` → Start button redirected to `/discover/vision/step1`
- **After:** `/discover/vision` → Start button redirects to `/discover/vision/time-horizon`

**Migration Path:** Users with in-progress sessions (currentStep >= 1) can resume normally. New users must complete time-horizon selection first.

### 2. Step 3 Response Format Changed
- **Before:** Step 3 allowed viewing all core aspirations without selection
- **After:** Step 3 REQUIRES radio button selection before proceeding

**Migration Path:** Existing sessions without `primary_aspiration` will be prompted to select one.

### 3. Database Constraint Modified
- **Before:** `current_step` allowed values 1-4
- **After:** `current_step` allows values 0-4

**Migration Path:** Run migration before deployment; no data loss risk.

---

## 📋 Upgrade Instructions

### For Developers:

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Run database migrations:**
   - Navigate to Supabase Dashboard → SQL Editor
   - Execute `/database/migrations/add-time-horizon-to-vision.sql`
   - Execute `/database/migrations/fix-vision-step-constraint.sql`

3. **Verify environment variables:**
   - Ensure `DEV_MODE_SKIP_AUTH` is set correctly (true for local dev, false for production)

4. **Test authentication flow:**
   ```bash
   npm run dev
   # Test: Login → Vision Module → Time Horizon → Step 1-4
   ```

### For End Users:

- **New users:** No action required; new flow will guide you through time horizon selection
- **Existing users with incomplete sessions:** You may be prompted to select time horizon if not previously set
- **Completed vision statements:** No changes; existing data preserved

---

## 🧪 Testing Checklist

- [x] Time horizon selection saves correctly to database
- [x] Dynamic time horizon text displays in Step 1
- [x] Authentication headers included in all API calls
- [x] Prerequisites check works with correct table names
- [x] Step 3 radio button selection enforces single choice
- [x] Magnitude questions display after primary aspiration selection
- [x] AI chat does not auto-respond on mount
- [x] Timestamps display in English format
- [x] Dev mode bypass works correctly
- [x] getUser() authentication functions in all API routes

---

## 📚 Technical Reference

### New Helper Functions

**`/src/lib/supabase-client-auth.ts`**
```typescript
export async function makeAuthenticatedRequest(url: string, options?: RequestInit)
export async function checkAuthStatus()
export async function getAuthenticatedSession()
```

**`/src/app/discover/vision/utils/session-helpers.ts`**
```typescript
export async function getVisionSession(): Promise<VisionSession>
export async function updateVisionSession(updates: Partial<VisionSession>)
```

### Updated Type Definitions

```typescript
interface VisionSession {
  id: string;
  user_id: string;
  current_step: number; // 0-4 (was 1-4)
  time_horizon?: number;
  time_horizon_type?: 'years_from_now' | 'specific_age';
  primary_aspiration?: string;
  magnitude_of_impact?: string;
  professional_focus_validated?: boolean;
  // ... existing fields
}
```

---

## 🙏 Acknowledgments

This release was driven by user feedback from the October 9, 2025 design review meeting. Special thanks for the detailed feedback recording that enabled systematic improvements.

---

## 📞 Support

For issues or questions:
- Check authentication setup in `/src/lib/supabase-client-auth.ts`
- Verify database migrations executed successfully
- Review console logs for session-related errors
- Ensure Supabase environment variables are set correctly

---

## 🔮 Future Roadmap

- [ ] Add vision statement export/print functionality
- [ ] Implement progress autosave (every 30 seconds)
- [ ] Add "Resume Later" explicit save button
- [ ] Create vision statement sharing capabilities
- [ ] Add retrospective comparison (current vs. future vision check-ins)
