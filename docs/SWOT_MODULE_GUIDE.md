# SWOT Analysis Module - Implementation Guide

## 📋 Overview

The SWOT Analysis module is a comprehensive career planning tool that guides students through:
1. **SWOT Discovery** - Identifying Strengths, Weaknesses, Opportunities, Threats
2. **Strategy Development** - Creating SO, WO, ST, WT strategies
3. **Goal Setting** - Setting 7 SMART goals across life roles
4. **ERRC Action Planning** - Defining daily habits to Eliminate, Reduce, Reinforce, Create
5. **Reflection** - Writing a 200-300 word essay on insights gained

---

## 🚀 Quick Start

### 1. Database Setup

Run the migration to create SWOT tables in Supabase:

```bash
# Navigate to the database migrations directory
cd database/migrations

# Execute the migration in Supabase SQL Editor
# Copy and paste the contents of:
2025-10-23-create-swot-analysis.sql
```

**Tables Created:**
- `swot_analyses` - Main SWOT data with strategies
- `swot_goals` - 7 SMART goals
- `swot_errc` - ERRC action plan

### 2. Access the Module

Navigate to: `/discover/swot`

**Prerequisites:**
- Complete `/discover/strengths` OR `/discover/vision` (at least one required)
- Strengths data will auto-populate the Strengths section
- Vision statement will auto-populate the goal/vision field

### 3. Module Flow

```
Landing Page → SWOT Analysis → Strategy Dev → Goal Setting → ERRC → Reflection
   (prereqs)      (4+ each)     (4+ each)     (3-7 goals)    (2+ each)  (200-300 words)
```

---

## 📂 File Structure

```
src/app/discover/swot/
├── page.tsx                          # Landing page with prerequisites check
├── analysis/page.tsx                 # SWOT Discovery (Strengths, Weaknesses, Opportunities, Threats)
├── strategy/page.tsx                 # Strategy Development (SO, WO, ST, WT)
├── goals/page.tsx                    # Goal Setting (7 SMART goals)
├── action/page.tsx                   # ERRC Action Planning
├── reflection/page.tsx               # Final Reflection & Summary
└── components/                       # Shared components (future)

src/app/api/swot/
├── session/route.ts                  # GET/POST/DELETE SWOT session
├── goals/route.ts                    # GET/POST goals
└── errc/route.ts                     # GET/POST ERRC data

database/migrations/
└── 2025-10-23-create-swot-analysis.sql
```

---

## 🎯 Key Features

### 1. SWOT Analysis Page (`/discover/swot/analysis`)

**Requirements:**
- Minimum 4 items in each category (S, W, O, T)
- Vision statement or goal (auto-populated from Vision module if available)

**Features:**
- Real-time validation
- Add/remove items
- Progress indicator
- Auto-save on navigation

**Data Structure:**
```typescript
interface SWOTItem {
  id: string;
  text: string;
}

// Stored in swot_analyses table as JSONB arrays
strengths: SWOTItem[]
weaknesses: SWOTItem[]
opportunities: SWOTItem[]
threats: SWOTItem[]
```

### 2. Strategy Development Page (`/discover/swot/strategy`)

**Requirements:**
- Minimum 4 strategies per category (SO, WO, ST, WT)

**Features:**
- View SWOT elements summary
- Add strategies for each combination
- Assign Impact & Difficulty levels (for future priority matrix)
- AI suggestion button (Phase 2 placeholder)

**Strategy Types:**
- **SO**: Use Strengths to leverage Opportunities
- **WO**: Overcome Weaknesses using Opportunities
- **ST**: Use Strengths to avoid Threats
- **WT**: Minimize Weaknesses to avoid Threats

**Data Structure:**
```typescript
interface Strategy {
  id: string;
  text: string;
  impact?: 'high' | 'medium' | 'low';
  difficulty?: 'high' | 'medium' | 'low';
}
```

### 3. Goal Setting Page (`/discover/swot/goals`)

**Requirements:**
- Minimum 3 goals (out of 7) must be completed
- Each goal must have:
  - Role/Responsibility
  - Action Plan
  - Success Criteria (Measurable)

**Optional Fields:**
- Deadline (Date)
- Percentage Allocation (Effort %)

**SMART Principles:**
- **S**pecific - Clear and well-defined
- **M**easurable - Success criteria defined
- **A**chievable - Realistic given resources
- **R**elevant - Aligned with vision
- **T**ime-bound - 6-12 month timeline

**Data Structure:**
```sql
CREATE TABLE swot_goals (
  goal_number INTEGER (1-7),
  role_responsibility TEXT,
  sub_goals JSONB,
  action_plan TEXT,
  criteria TEXT,
  deadline DATE,
  percentage_allocation INTEGER
);
```

### 4. ERRC Action Planning Page (`/discover/swot/action`)

**Requirements:**
- Minimum 2 items in each category

**ERRC Framework:**
- **Eliminate** - Habits/activities that don't serve goals
- **Reduce** - Activities to minimize or do less
- **Reinforce** - Positive habits to strengthen
- **Create** - New habits/activities to start

**Based on:**
- Blue Ocean Strategy (Kim & Mauborgne)
- Hope-Action Theory (self-reactiveness)

### 5. Reflection Page (`/discover/swot/reflection`)

**Requirements:**
- 200-300 words reflection essay

**Features:**
- Complete SWOT summary
- Word count validation
- Export to PDF (Phase 3 placeholder)
- Finalize and mark as completed

**Reflection Prompts:**
- How has this exercise helped clarify your path forward?
- Are there any strategies that surprised you?
- What next steps will you take to implement your highest-priority strategies?

---

## 🔌 API Routes

### Session Management

**GET** `/api/swot/session`
```typescript
// Returns user's SWOT analysis or empty object
Response: {
  id: UUID,
  vision_or_goal: string,
  strengths: SWOTItem[],
  weaknesses: SWOTItem[],
  // ... all SWOT fields
  current_stage: 'discovery' | 'strategy' | 'goals' | 'action' | 'reflection' | 'completed',
  is_completed: boolean
}
```

**POST** `/api/swot/session`
```typescript
// Create or update SWOT session (upsert)
Body: {
  vision_or_goal?: string,
  strengths?: SWOTItem[],
  // ... any SWOT fields to update
  current_stage?: string
}
```

**DELETE** `/api/swot/session`
```typescript
// Delete SWOT session and all related data (CASCADE)
Response: { success: true }
```

### Goals Management

**GET** `/api/swot/goals`
```typescript
// Returns array of goals for current user
Response: Goal[]
```

**POST** `/api/swot/goals`
```typescript
// Bulk upsert goals (replaces all existing)
Body: {
  goals: Goal[]  // Array of 1-7 goals
}
```

### ERRC Management

**GET** `/api/swot/errc`
```typescript
// Returns ERRC data or empty object
Response: {
  eliminate: string[],
  reduce: string[],
  reinforce: string[],
  create_new: string[]
}
```

**POST** `/api/swot/errc`
```typescript
// Create or update ERRC (upsert)
Body: {
  eliminate: string[],
  reduce: string[],
  reinforce: string[],
  create_new: string[]
}
```

---

## 🔗 Integration with Other Modules

### Strengths Module Integration

**Auto-populate Strengths:**
```typescript
// In analysis/page.tsx
const strengthsRes = await fetch('/api/discover/strengths/results');
const strengthsData = await strengthsRes.json();

// Map skills/attitudes to SWOT Strengths
const autoStrengths = strengthsData.skills.map(s => ({
  id: generateId(),
  text: s.name
}));
```

### Vision Module Integration

**Auto-populate Vision Statement:**
```typescript
// In analysis/page.tsx
const visionRes = await fetch('/api/discover/vision/session');
const visionData = await visionRes.json();

// Use final_statement as vision_or_goal
setVisionOrGoal(visionData.final_statement || '');
```

**Link SWOT to Vision:**
```sql
-- swot_analyses table has foreign key
vision_statement_id UUID REFERENCES vision_statements(id)
```

---

## 🎨 UI/UX Features

### Color Coding

- **SWOT Analysis**: Amber/Orange gradient
- **Strategy Development**: Blue/Purple gradient
- **Goal Setting**: Green/Emerald gradient
- **ERRC Action**: Purple/Pink gradient
- **Reflection**: Indigo/Blue gradient

### Progress Tracking

Each page shows:
- Current stage in breadcrumb
- Progress percentage
- Completion indicators (checkmarks)
- Validation feedback

### Responsive Design

- Mobile-first design
- Grid layouts collapse to single column
- Touch-friendly buttons and inputs
- Accessible keyboard navigation

---

## 🧪 Testing Checklist

### Database Tests
- [ ] Run migration successfully in Supabase
- [ ] Verify RLS policies work correctly
- [ ] Test CASCADE delete (deleting swot_analyses deletes goals & ERRC)
- [ ] Verify user isolation (users can only see their own data)

### Flow Tests
- [ ] Complete entire flow from landing → reflection
- [ ] Test prerequisite checks (redirect if no strengths/vision)
- [ ] Test validation (minimum items required)
- [ ] Test data persistence (reload page, data intact)
- [ ] Test back navigation (data preserved)

### Integration Tests
- [ ] Verify Strengths data auto-populates
- [ ] Verify Vision statement auto-populates
- [ ] Test with no prerequisites (should block access)
- [ ] Test with only Strengths completed
- [ ] Test with only Vision completed

### Edge Cases
- [ ] User deletes SWOT mid-session
- [ ] User tries to skip stages via URL manipulation
- [ ] Extremely long text inputs (>1000 chars)
- [ ] Special characters in text inputs
- [ ] Concurrent edits (multiple tabs)

---

## 🚧 Phase 2 Features (Future)

### AI Integration
- [ ] AI validation of SWOT items (is this really a strength?)
- [ ] AI strategy generation (suggest SO/WO/ST/WT combinations)
- [ ] AI goal validation (SMART criteria check)
- [ ] AI ERRC suggestions (based on goals)

### Visualization
- [ ] Priority Matrix (Impact vs Difficulty scatter plot)
- [ ] Progress Dashboard (radar chart, bar charts)
- [ ] Goals Timeline (Gantt chart)
- [ ] ERRC Habit Tracker

### Export & Sharing
- [ ] PDF export (formatted worksheet)
- [ ] Word/DOCX export
- [ ] Print-friendly view
- [ ] Share link generation
- [ ] Email summary

### Advanced Features
- [ ] Templates for different career stages
- [ ] Industry-specific SWOT examples
- [ ] Peer review system
- [ ] Progress tracking over time
- [ ] Revision history

---

## 📚 Educational Context

### Course: WFED 119 - Career Planning and Life Design

### Learning Objectives
1. Identify strengths, weaknesses, opportunities, and threats considering mission and vision
2. Develop strategies based on combinations of SWOT elements
3. Set SMART goals based on different life roles and domains

### Assignment Guidelines
- SWOT and Goal Setting have separate due dates
- Students should aim for 6-12 month timeline for goals
- Reflection should focus on "why" insights, not just "what" was done
- ERRC connects to Human Agency Theory (self-reactiveness)

### Grading Criteria
- Completeness (all sections filled)
- SMART goal quality
- Strategy alignment with SWOT
- Reflection depth (insights, not just summary)

---

## 🐛 Troubleshooting

### Database Issues

**Error: "relation swot_analyses does not exist"**
- Solution: Run the migration SQL in Supabase SQL Editor

**Error: "violates foreign key constraint"**
- Solution: Ensure auth.users exists and user_id is valid

**Error: "RLS policy violation"**
- Solution: Check if user is authenticated, verify RLS policies

### API Issues

**Error: 401 Unauthorized**
- Solution: Check auth session, verify dev auth helper

**Error: 404 SWOT not found**
- Solution: User hasn't started SWOT yet, redirect to analysis page

**Error: 500 Internal Server Error**
- Solution: Check server logs, verify Supabase connection

### UI Issues

**Data not persisting**
- Solution: Check browser console for API errors, verify network requests

**Progress stuck at 0%**
- Solution: Ensure current_stage is being updated in POST requests

**Can't proceed to next stage**
- Solution: Check validation logic, ensure minimum items met

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the database migration logs
3. Check browser console for client-side errors
4. Check server logs for API errors
5. Create an issue in the project repository

---

## 📝 Change Log

### Version 1.0 (2025-10-23)
- Initial implementation
- Full SWOT → Strategy → Goals → ERRC → Reflection flow
- Database schema with RLS
- API routes for all operations
- Integration with Strengths and Vision modules
- Prerequisites checking
- Validation and progress tracking

---

## 🎓 Acknowledgments

Based on:
- **SWOT Analysis Framework** (Albert Humphrey, 1960s)
- **Blue Ocean Strategy ERRC Grid** (Kim & Mauborgne, 2005)
- **SMART Goals Framework** (George Doran, 1981)
- **LifeCraft Career Development Methodology** (WFED 119 course materials)

---

**Last Updated:** October 23, 2025
**Module Status:** MVP Complete, Phase 2 (AI) Pending
**Maintainer:** wfed119 Development Team
