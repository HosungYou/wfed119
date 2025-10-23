# SWOT Module - Quick Setup Guide

## 🚀 Step 1: Database Migration

### Option A: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `mldxtonwtfjvmxudwfma`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open file: `database/migrations/2025-10-23-create-swot-analysis.sql`
   - Copy ALL contents (entire file)

4. **Execute Migration**
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for "Success" message

5. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see 3 new tables:
     - `swot_analyses`
     - `swot_goals`
     - `swot_errc`

### Option B: Command Line (Alternative)

```bash
cd "/Volumes/External SSD/Projects/wfed119-1"

# Using psql (if you have Supabase CLI)
psql postgresql://postgres:[YOUR-PASSWORD]@db.mldxtonwtfjvmxudwfma.supabase.co:5432/postgres \
  -f database/migrations/2025-10-23-create-swot-analysis.sql
```

---

## 🧪 Step 2: Test the Module Locally

### Start Development Server

```bash
cd "/Volumes/External SSD/Projects/wfed119-1"

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

### Access the Module

Open browser: http://localhost:3000/discover/swot

### Expected Behavior

1. **Landing Page Shows**
   - Prerequisites section (Strengths, Vision)
   - Module overview
   - "Start SWOT Analysis" button (may be disabled if no prerequisites)

2. **If Prerequisites Missing**
   - Message: "Complete at least one prerequisite module"
   - Links to /discover/strengths and /discover/vision

3. **If Prerequisites Met**
   - Button enabled
   - Click to go to /discover/swot/analysis

---

## ✅ Step 3: Test Complete Flow

### Test Scenario 1: Fresh User (No Prerequisites)

1. Navigate to `/discover/swot`
2. **Expected**: Prerequisites check shows incomplete
3. **Expected**: Cannot start SWOT
4. Complete either:
   - `/discover/strengths` OR
   - `/discover/vision`
5. Return to `/discover/swot`
6. **Expected**: Can now start

### Test Scenario 2: Complete SWOT Flow

1. **Landing Page** (`/discover/swot`)
   - Click "Start SWOT Analysis"

2. **SWOT Analysis** (`/discover/swot/analysis`)
   - Enter vision/goal
   - Add 4+ Strengths
   - Add 4+ Weaknesses
   - Add 4+ Opportunities
   - Add 4+ Threats
   - Click "Continue to Strategy"

3. **Strategy Development** (`/discover/swot/strategy`)
   - Add 4+ SO strategies
   - Add 4+ WO strategies
   - Add 4+ ST strategies
   - Add 4+ WT strategies
   - Assign Impact/Difficulty levels
   - Click "Continue to Goals"

4. **Goal Setting** (`/discover/swot/goals`)
   - Fill out at least 3 goals (of 7)
   - Each goal needs:
     - Role/Responsibility
     - Action Plan
     - Success Criteria
   - Click "Continue to Action Plan"

5. **ERRC Action Plan** (`/discover/swot/action`)
   - Add 2+ Eliminate items
   - Add 2+ Reduce items
   - Add 2+ Reinforce items
   - Add 2+ Create items
   - Click "Continue to Reflection"

6. **Reflection** (`/discover/swot/reflection`)
   - Write 200-300 word reflection
   - Click "Complete SWOT Analysis"
   - **Expected**: Redirect to dashboard
   - **Expected**: SWOT marked as completed

---

## 🔍 Step 4: Verify Data in Supabase

### Check Tables

1. **Go to Supabase Dashboard → Table Editor**

2. **swot_analyses Table**
   - Should have 1 row for your test
   - Check `current_stage` = 'completed'
   - Check `is_completed` = true
   - Verify JSON fields (strengths, weaknesses, etc.)

3. **swot_goals Table**
   - Should have 3-7 rows
   - Each row has `goal_number` 1-7
   - Verify `action_plan`, `criteria` filled

4. **swot_errc Table**
   - Should have 1 row
   - Check JSON arrays (eliminate, reduce, reinforce, create_new)

### Check Row Level Security

1. **Test User Isolation**
   - Create second test user
   - Navigate to `/discover/swot`
   - Should NOT see first user's SWOT data

2. **Test CRUD Operations**
   - User can view their own SWOT ✅
   - User can update their own SWOT ✅
   - User cannot view other users' SWOT ✅
   - User cannot update other users' SWOT ✅

---

## 🔗 Step 5: Test Integration Features

### Integration with Strengths Module

1. Complete `/discover/strengths` first
2. Start SWOT Analysis
3. **Expected**: Strengths section auto-populated
4. **Verify**: Can still add/remove items

### Integration with Vision Module

1. Complete `/discover/vision` first
2. Start SWOT Analysis
3. **Expected**: Vision statement auto-populated in goal field
4. **Verify**: Can still edit the field

### Vision Statement Link

1. In Supabase → swot_analyses table
2. Check `vision_statement_id` field
3. **Expected**: Foreign key to vision_statements table

---

## 🐛 Common Issues & Solutions

### Issue 1: "relation swot_analyses does not exist"
**Solution**: Migration not run. Execute Step 1 again.

### Issue 2: Cannot start SWOT (button disabled)
**Solution**: Complete prerequisites (/discover/strengths OR /discover/vision)

### Issue 3: API returns 401 Unauthorized
**Solution**:
- Check if logged in
- Verify `.env.local` has correct Supabase keys
- Check browser console for auth errors

### Issue 4: Data not saving
**Solution**:
- Check browser console for API errors
- Verify Supabase connection
- Check RLS policies are enabled

### Issue 5: "Cannot read property 'text' of undefined"
**Solution**:
- Clear browser cache
- Check data structure in API responses
- Verify JSONB fields are arrays, not objects

---

## 📊 Success Criteria Checklist

- [ ] Migration executed successfully
- [ ] 3 tables created (swot_analyses, swot_goals, swot_errc)
- [ ] RLS policies working
- [ ] Landing page loads
- [ ] Prerequisites check works
- [ ] Can complete full SWOT flow
- [ ] Data persists in Supabase
- [ ] Strengths integration works
- [ ] Vision integration works
- [ ] User isolation verified
- [ ] No console errors

---

## 🎯 Next Steps After Setup

### Immediate
1. Test with real student data
2. Gather user feedback
3. Monitor for bugs

### Short-term (Phase 2)
1. Implement AI suggestions
2. Add Priority Matrix visualization
3. Implement PDF export

### Long-term (Phase 3)
1. Advanced analytics
2. Progress tracking over time
3. Templates and examples

---

## 📞 Need Help?

1. Check `docs/SWOT_MODULE_GUIDE.md` for detailed documentation
2. Review browser console for errors
3. Check Supabase logs for API errors
4. Verify all files are in correct locations

---

**Setup Time Estimate**: 15-20 minutes
**Testing Time Estimate**: 30-45 minutes
**Total Time**: ~1 hour for complete setup and validation

Good luck! 🚀
