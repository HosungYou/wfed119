# Vision Statement Module - Improvement Plan

Based on feedback from October 9, 2025 meeting

---

## Current Implementation vs. Feedback Requirements

### ✅ What's Already Good

1. **4-Step Structure** - Already implemented (Step 1-4)
2. **AI Integration** - AIChatBox component for guidance
3. **Prerequisites Check** - Values & Strengths modules checked
4. **Context Loading** - Values and Strengths loaded for personalization
5. **Progress Tracking** - Step progress component
6. **Save/Resume** - Session management with auto-save

### ❌ Critical Missing Features

## 1. **Time Horizon Selection (NEW REQUIREMENT)**

**Current Issue**: Hard-coded "10 years from now" in Step 1
```typescript
// line 194-196 in step1/page.tsx
<p className="text-gray-600">
  Freely envision your ideal day 10 years from now.
</p>
```

**Required Change**:
- Add **time horizon selection** BEFORE Step 1
- Options:
  - Custom years (e.g., 10, 15, 20 years)
  - Or specific age (e.g., 65)
- Don't make 10 years the default
- Store in session as `time_horizon` and `time_horizon_type`

**Implementation**:
```typescript
// Add new fields to VisionSession interface
interface VisionSession {
  id: string;
  time_horizon?: number;  // e.g., 10 (years) or 65 (age)
  time_horizon_type?: 'years_from_now' | 'specific_age';
  // ... existing fields
}

// Add new pre-Step-1 page: /discover/vision/time-horizon
```

---

## 2. **Professional Self Focus (CRITICAL)**

**Current Issue**: No explicit emphasis on professional career

**Required Changes**:

### In Step 1 (Future Imagery):
- Update AI prompt to explicitly mention **professional self**
- Add validation check: Does the future imagery include professional/career elements?
- Display warning if professional element is missing

```typescript
// Example AI prompt modification (line 151-169)
const initialMessage = `
Now, let's imagine your PROFESSIONAL life 10 years from now.

**Close your eyes and envision a day in your professional life:**
- What work are you doing?
- What role or title do you have?
- What professional impact are you making?
- How does your work connect to your values?

Note: While personal life matters, this vision statement focuses on your PROFESSIONAL SELF as the anchor.
`
```

### In Step 2 (Core Aspirations):
- Filter aspirations to ensure they're career-related
- AI should ask: "Is this aspiration related to your professional career?"
- Reject or flag personal-only aspirations (e.g., "be a nice grandfather", "have a big house")

---

## 3. **"Choose Only ONE" Critical Question (MISSING)**

**Current Issue**: Step 2 asks for 3-5 aspirations, but feedback says AI should ultimately ask "Choose ONLY ONE"

**Required Change**:
- Step 2: Extract 3-5 aspirations (current behavior is OK)
- **NEW Step 2.5 or Step 3 modification**:
  - Display all aspirations
  - AI asks: **"If you were to choose only ONE of these, what would that be?"**
  - This ONE aspiration becomes the core of the vision statement

**Implementation**:
```typescript
// Modify Step 3 to start with selection
<div className="mb-6 p-6 bg-yellow-50 border border-yellow-300 rounded-xl">
  <h3 className="font-bold text-lg mb-3">🎯 Critical Question</h3>
  <p className="text-gray-800 mb-4">
    You've identified {aspirations.length} core aspirations.
    <strong>If you were to choose ONLY ONE that represents the essence of your future vision, which would it be?</strong>
  </p>
  <RadioGroup>
    {aspirations.map(asp => (
      <RadioOption key={asp.keyword} value={asp.keyword} />
    ))}
  </RadioGroup>
</div>
```

---

## 4. **Additional AI Questions (MISSING)**

**Current Issue**: No structured questions about magnitude and impact

**Required AI Questions to Add in Step 3**:

### Magnitude of Impact
```typescript
const magnitudeQuestions = [
  "Who do you want to reach with your work?",
  "- Community level?",
  "- Country level?",
  "- International level?",
  "How many people do you hope to impact?",
  "What scale of change do you envision?"
];
```

### Symbolic Essence
```typescript
const essenceQuestions = [
  "What's the most SYMBOLIC part of your future story?",
  "What moment would represent your ultimate achievement?",
  "How would you describe this in ONE SHORT PHRASE?",
  "Make it highly motivational and memorable."
];
```

---

## 5. **Input Requirements Clarification**

**Current Implementation**: Already loads values and strengths

**Additional Inputs Needed** (from feedback):
1. ✅ Life values (already loaded)
2. ✅ Mission statement (needs to be loaded)
3. ✅ Life themes (needs to be loaded)
4. ✅ Future stories (Step 1 - already implemented)
5. ✅ Dreams list (could be added as optional input)

**Action**:
- Check if `mission_statement` and `life_themes` exist in database schema
- If yes, load them in `/api/discover/vision/context` route
- If no, add these tables/columns

---

## 6. **Guided Imagery Refinement**

**Current Implementation**: Just a text prompt in AI

**Feedback Requirement**:
- Use **shorter version** for college students
- Different from mid-life version
- More structured narrative approach

**Recommended**:
- Create separate guided imagery scripts for:
  - College students (focus on career start, first achievements)
  - Mid-life adults (focus on legacy, established career)
- Store in `/api/discover/vision/templates` endpoint

---

## 7. **Vision Statement Output (Step 4)**

**Required Characteristics** (from feedback):
- ✅ ONE short, symbolic phrase
- ✅ Highly motivational
- ✅ Focus on professional self
- ✅ Specific time horizon mentioned
- ✅ Reflects the ONE core aspiration

**Example Format**:
```
"By age 65, I will be a renowned education researcher transforming how we understand human learning worldwide."

"In 10 years, I will lead a consulting firm that empowers Fortune 500 companies to build equitable workplaces."
```

---

## Database Schema Updates Needed

```sql
-- Add to vision_sessions table
ALTER TABLE vision_sessions ADD COLUMN time_horizon INTEGER;
ALTER TABLE vision_sessions ADD COLUMN time_horizon_type VARCHAR(50);
ALTER TABLE vision_sessions ADD COLUMN primary_aspiration VARCHAR(255);
ALTER TABLE vision_sessions ADD COLUMN magnitude_of_impact TEXT;
ALTER TABLE vision_sessions ADD COLUMN professional_focus_validated BOOLEAN DEFAULT FALSE;

-- Check if these exist, if not add:
-- mission_statement (might be in user_profile or separate table)
-- life_themes (might be in user_profile or separate table)
```

---

## API Route Changes

### `/api/discover/vision/context`
**Add**:
- `missionStatement` (if available)
- `lifeThemes` (if available)

### `/api/discover/vision/session` (PATCH)
**Add fields**:
- `time_horizon`
- `time_horizon_type`
- `primary_aspiration` (the ONE chosen)
- `magnitude_of_impact`
- `professional_focus_validated`

---

## File Changes Required

### New Files:
1. `src/app/discover/vision/time-horizon/page.tsx` - Time horizon selection
2. `src/app/api/discover/vision/templates/guided-imagery.ts` - College vs. mid-life scripts

### Modified Files:
1. ✏️ `src/app/discover/vision/page.tsx` - Update flow to include time horizon
2. ✏️ `src/app/discover/vision/step1/page.tsx` - Professional self emphasis
3. ✏️ `src/app/discover/vision/step2/page.tsx` - Professional validation
4. ✏️ `src/app/discover/vision/step3/page.tsx` - Add "choose ONE" + magnitude questions
5. ✏️ `src/app/discover/vision/step4/page.tsx` - Final vision statement with time horizon
6. ✏️ `src/app/api/discover/vision/context/route.ts` - Load mission statement & life themes
7. ✏️ `src/app/api/discover/vision/ai-chat/route.ts` - Update prompts for professional focus

---

## Priority Order

### 🔴 High Priority (Must-Fix)
1. **Time Horizon Selection** - New page before Step 1
2. **Professional Self Validation** - Add checks in Step 1 & 2
3. **"Choose Only ONE" Question** - Modify Step 3

### 🟡 Medium Priority (Important)
4. **Magnitude/Impact Questions** - Add to Step 3
5. **Mission Statement & Life Themes** - Load in context API

### 🟢 Low Priority (Nice-to-Have)
6. **Guided Imagery Templates** - College vs. mid-life versions
7. **Dreams List Input** - Optional additional context

---

## Testing Checklist

After implementing changes, test:
- [ ] Time horizon selection saves correctly
- [ ] Professional self validation works
- [ ] "Choose ONE" question appears
- [ ] Magnitude questions are asked
- [ ] Final vision statement includes time horizon
- [ ] Works without mission statement/life themes (graceful degradation)
- [ ] AI prompts emphasize professional career

---

## Next Steps

1. Review database schema for mission_statement and life_themes
2. Implement time horizon selection page
3. Update AI prompts for professional focus
4. Add "choose ONE" logic to Step 3
5. Test end-to-end flow
6. Update documentation

---

**Last Updated**: October 9, 2025
**Based on**: 445 Waupelani Dr.m4a feedback session
