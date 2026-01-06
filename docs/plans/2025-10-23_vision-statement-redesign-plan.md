# Vision Statement Module Redesign Plan

**Date**: 2025-10-09
**Based on**: Professor feedback from meeting recording (445 Waupelani Dr 2.m4a)
**Transcription**: Available at `/Projects/Research/WFED119/database/records/445_Waupelani_Dr_2_transcript.txt`

---

## 📋 Executive Summary

교수님의 피드백을 바탕으로 Vision Statement 모듈을 4-step에서 3-step으로 단순화하고, 6-word vision statement 기준을 적용합니다.

### Key Changes:
1. **Step 2 (Core Aspirations) 제거** - 학생들에게 너무 복잡
2. **Vision Statement 기준: 6 words or less** - 현재 100자 → 6단어 이하
3. **Step 재구성**: 4 steps → 3 steps
4. **AI 역할 강화**: Story validation + 6-word brainstorming

---

## 🎯 NEW Step Structure

| Old (4 Steps) | New (3 Steps) | Changes |
|---|---|---|
| **Step 1**: Imagine Future | **Step 1**: Imagine Future | AI story validation 추가 |
| **Step 2**: Core Aspirations | **[REMOVED]** | Too complex - delete |
| **Step 3**: Draft Vision | **Step 2**: Brainstorm Vision | 6-word brainstorming |
| **Step 4**: Finalize & Visualize | **Step 3**: Compose & Visualize | 6-word validation |

---

## 📝 Detailed Modifications

### Step 1: Imagine Future (Modified)

**Current Issues:**
- No clear endpoint for conversation
- Unclear when to move to next step
- No validation of story completeness

**Professor Feedback (Lines 1514-1563):**
> "AI should keep providing summaries and also ask questions until there's some substantive information... ask: 'Does it capture your desired future accurately in the story format?' If yes, 'please click on next step'"

**Modifications:**

1. **AI Prompt Update** (`/api/discover/vision/ai-chat/route.ts`):
```typescript
After 5-7 exchanges, assess story maturity:
- Visual details present? ✓
- Emotional aspects explored? ✓
- Impact magnitude mentioned? ✓
- Scope (global/local) clarified? ✓

When mature:
1. Provide summary of key themes
2. Ask: "Does this accurately capture your desired future in story format?"
3. If YES: "Great! Please click 'Next Step' to create your vision statement."
```

2. **Draft Suggestion** (Already implemented ✅):
- 300-500 character narrative draft
- User accepts → Auto-fill Free Writing Area
- Marker system: `📝 DRAFT_START` ... `DRAFT_END`

3. **Next Step Button**:
- Enable when: Free Writing Area ≥ 300 characters + AI story validation = YES

**Files to Modify:**
- [x] `/src/app/api/discover/vision/ai-chat/route.ts` (Prompt update)
- [x] `/src/app/discover/vision/step1/page.tsx` (UI update)

---

### Step 2: Core Aspirations → REMOVED

**Professor Feedback (Lines 1092-1136):**
> "This process might interfere creating one phrase or one sentence... This is too complicated for our students."

**Actions:**
1. ✅ Rename `step3/` → `step3-old/` (backup)
2. ✅ Rename `step4/` → `step3/`
3. ⬜ Delete `/src/app/discover/vision/step2/` (or disable routing)
4. ⬜ Keep `core_aspirations` column in database (preserve existing data)
5. ✅ Update StepProgress component: 4 steps → 3 steps

**Database:**
- Keep `vision_statements.core_aspirations` (JSONB) - for backward compatibility
- No migration needed for removal

---

### Step 2 (NEW): Brainstorm Vision Statements

**Professor Feedback (Lines 1447-1477, 1563-1599):**
> "The criteria for visions they must be six words or less... Step 2 is to clarify regarding magnitude of impact... Step 3 will give ideas that could be used as a vision statement."

**New Functionality:**

1. **AI Brainstorms 3-5 Options** (6 words each):
```
Input: Step 1 future imagery story
Output: 3-5 vision statement options

Example:
1. "Transform 10 million dreams into reality"
2. "Empower youth through innovative education solutions"
3. "Create sustainable futures for communities"
```

2. **Challenging Questions** (AI asks):
- "What's the magnitude of your impact?" (e.g., 10,000 people, 1 million lives)
- "Is this global, national, or local?"
- "What's the core action?" (create, transform, empower, inspire)
- "Who benefits from this vision?"

3. **User Interaction**:
- View 3-5 AI-suggested options
- Select one OR write custom (with AI guidance)
- Real-time word count: **6 words or less** validation
- Modify selected option

4. **UI Components**:
```tsx
- <AIChatBox /> - Challenging questions
- <VisionOptions /> - Display 3-5 cards
- <WordCounter /> - Real-time 6-word validation
- <CustomInput /> - User custom input option
```

**AI Prompt (NEW):**
```
Goal: Brainstorm 3-5 vision statements (6 words or less)

Guide:
1. Review user's future imagery from Step 1
2. Ask challenging questions:
   - Magnitude of impact?
   - Global/national/local?
   - Core action verb?
3. Generate 3-5 options, each **6 words or less**
4. Present with explanations
5. Help user select or create custom
6. Refine until clear, concise, impactful

Format:
"Transform 10 million dreams into reality"
"Empower communities through sustainable innovation"
```

**Files to Create:**
- [ ] `/src/app/discover/vision/step2/page.tsx` (NEW)
- [ ] Update `/src/app/api/discover/vision/ai-chat/route.ts` (Step 2 prompt)

**Database Schema Addition:**
```sql
ALTER TABLE vision_statements
ADD COLUMN IF NOT EXISTS brainstormed_options JSONB,  -- AI-generated 3-5 options
ADD COLUMN IF NOT EXISTS selected_option_index INT;    -- User selection (0-4)
```

---

### Step 3 (formerly Step 4): Compose & Visualize

**Professor Feedback (Lines 1715-1743):**
> "It's not to validate, it's to compose... If they don't click on compose, then there needs to be room for change."

**Modifications:**

1. **Rename "Validate" → "Compose"**:
```tsx
// OLD
<button>AI Validate</button>

// NEW
<button>AI Review</button>
```

2. **6-Word Validation** (Replace 100-character validation):
```typescript
// OLD
const isSimple = finalStatement.length <= 100;

// NEW
const wordCount = finalStatement.trim().split(/\s+/).length;
const isSimple = wordCount <= 6;
```

3. **AI Validation Prompt Update**:
```
Validation Criteria:
1. **6 words or less**: STRICT requirement
2. **Clear**: Easily understood by anyone
3. **Inspiring**: Energizes action
4. **Impact**: Magnitude stated or implied

If > 6 words: "Your vision is X words. Please reduce to 6 or fewer."
If unclear: Suggest clearer wording
If weak impact: Suggest stronger verbs or scope
```

4. **Composition Flow**:
```
1. Display selected draft from Step 2
2. AI Review (6-word validation + suggestions)
3. User can modify
4. "Compose Final Vision" → Finalize
5. Vision Card generation
```

**Files to Modify:**
- [x] `/src/app/discover/vision/step3/page.tsx` (Rename validation logic)
- [ ] `/src/app/api/discover/vision/validate/route.ts` (6-word validation)
- [ ] Update all UI text: "Step 4" → "Step 3", "Validate" → "Compose"

**Word Count UI:**
```tsx
<div className="flex items-center justify-between">
  <span className="text-sm text-gray-600">
    {wordCount} / 6 words
  </span>
  {wordCount > 6 && (
    <span className="text-red-600 text-sm font-medium">
      ⚠ Please reduce to 6 words or less
    </span>
  )}
</div>
```

---

## 🗄️ Database Schema Changes

### vision_statements table:

```sql
-- Existing columns (keep)
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
future_imagery TEXT                 -- Step 1
core_aspirations JSONB               -- (Unused, keep for backward compatibility)
final_statement TEXT                 -- Step 3 (6 words or less)
statement_style TEXT                 -- (Deprecated)
selected_template_id UUID            -- Step 3
is_completed BOOLEAN
current_step INT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

-- NEW columns
brainstormed_options JSONB           -- Step 2: AI-generated 3-5 options
selected_option_index INT            -- Step 2: User's selection (0-4)
```

**Migration SQL:**
```sql
-- /database/migrations/add_brainstormed_options.sql
ALTER TABLE vision_statements
ADD COLUMN IF NOT EXISTS brainstormed_options JSONB,
ADD COLUMN IF NOT EXISTS selected_option_index INT;

COMMENT ON COLUMN vision_statements.brainstormed_options IS
'AI-generated 3-5 vision statement options (6 words each)';

COMMENT ON COLUMN vision_statements.selected_option_index IS
'Index of user-selected option from brainstormed_options (0-4), or NULL if custom';
```

---

## 🚀 Implementation Phases

### Phase 0: Preparation (COMPLETED ✅)
- [x] Transcribe professor feedback (WhisperX)
- [x] Analyze feedback and create plan
- [x] Update StepProgress component (4→3 steps)
- [x] Reorganize step folders (step4 → step3)

### Phase 1: Critical P0 Tasks (30 minutes)
**Must complete before student testing**

- [ ] **P0-1**: Update Step 3 page title and description
- [ ] **P0-2**: Implement 6-word validation in Step 3
  - [ ] Change validation logic: 100 chars → 6 words
  - [ ] Update AI validation prompt
  - [ ] Add word counter UI
- [ ] **P0-3**: Hide/disable Step 2 navigation
  - [ ] Remove from StepProgress links (or disable)
  - [ ] Update Step 1 → redirect to new Step 2 (future)

### Phase 2: Step 1 Enhancement (20 minutes)
- [ ] Update AI prompt for story validation
- [ ] Test draft suggestion flow (already implemented)
- [ ] Verify Next Step button logic

### Phase 3: NEW Step 2 Creation (60 minutes)
- [ ] Create `/src/app/discover/vision/step2/page.tsx`
- [ ] Implement AI brainstorming prompt
- [ ] Build VisionOptions component (3-5 cards)
- [ ] Add WordCounter validation
- [ ] Database save logic (brainstormed_options)

### Phase 4: Database Migration (15 minutes)
- [ ] Run migration: `add_brainstormed_options.sql`
- [ ] Test in development
- [ ] Deploy to production (Supabase)

### Phase 5: Testing & Polish (30 minutes)
- [ ] End-to-end test: Step 1 → 2 → 3
- [ ] Verify 6-word validation
- [ ] Test draft acceptance flow
- [ ] Check Vision Card generation

**Total Estimated Time**: ~2.5 hours

---

## 🧪 Testing Scenarios

### Test 1: Complete Flow
```
1. Step 1: Chat with AI → Draft accepted → Free Writing Area filled
2. AI asks: "Does this capture your future?" → User: "Yes"
3. Click "Next Step" → Go to Step 2
4. Step 2: AI suggests 3-5 options (6 words each)
5. User selects option #2 or writes custom
6. Click "Next Step" → Go to Step 3
7. Step 3: AI Review (6-word validation)
8. User modifies if needed
9. "Compose Final Vision" → Vision Card created
```

### Test 2: 6-Word Validation
```
Input: "Transform 10 million dreams into reality through innovation" (8 words)
Expected: ⚠ "Your vision is 8 words. Please reduce to 6 or fewer."
User edits to: "Transform 10 million dreams into reality" (6 words) ✅
```

### Test 3: Draft Rejection & Retry
```
Step 1: AI suggests draft → User rejects → Continue chatting
AI adapts questions → Suggests new draft
User accepts → Proceed to Step 2
```

---

## 📊 Success Metrics

### Immediate (After Implementation):
- [ ] All 3 steps functional
- [ ] 6-word validation works correctly
- [ ] No broken links or navigation issues
- [ ] Vision Card generation successful

### Student Testing (Week 1):
- [ ] 80%+ students complete without confusion
- [ ] Average time < 20 minutes (down from ~30 min with 4 steps)
- [ ] 90%+ vision statements meet 6-word criterion
- [ ] Positive feedback on simplified flow

---

## 🔧 Technical Notes

### Word Count Calculation
```typescript
// Utility function
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Validation
const wordCount = countWords(finalStatement);
const isValid = wordCount > 0 && wordCount <= 6;
```

### AI Prompt Structure (Step 2)
```typescript
const step2Prompt = `
You are a vision statement coach helping students create powerful 6-word visions.

Context:
- Student's future story: ${futureImagery}
- Values: ${formatValues(values)}
- Strengths: ${formatStrengths(strengths)}

Task:
1. Ask challenging questions about impact magnitude and scope
2. Generate 3-5 vision statement options (STRICT: 6 words or less each)
3. Explain why each option is powerful
4. Help student select or create custom vision

Format each option as JSON:
{
  "options": [
    {
      "statement": "Transform 10 million dreams into reality",
      "wordCount": 6,
      "explanation": "Emphasizes large-scale impact with action verb"
    },
    ...
  ]
}
`;
```

---

## 📁 File Changes Summary

### Modified Files:
- [x] `/src/app/discover/vision/components/StepProgress.tsx` - 4→3 steps
- [ ] `/src/app/discover/vision/step1/page.tsx` - AI story validation
- [ ] `/src/app/discover/vision/step3/page.tsx` - 6-word validation, UI text
- [ ] `/src/app/api/discover/vision/ai-chat/route.ts` - Prompts for Steps 1, 2, 3
- [ ] `/src/app/api/discover/vision/validate/route.ts` - 6-word validation logic

### New Files:
- [ ] `/src/app/discover/vision/step2/page.tsx` - NEW brainstorming step
- [ ] `/database/migrations/add_brainstormed_options.sql` - DB schema

### Deleted/Archived:
- [x] `/src/app/discover/vision/step3-old/` - Old Step 3 (Core Aspirations backup)
- [ ] `/src/app/discover/vision/step2/` - Old Step 2 (to be archived)

---

## 🎓 Professor's Key Quotes

### On Complexity:
> "This process might interfere creating one phrase or one sentence. This is too complicated for our students." (1111s)

### On 6-Word Criterion:
> "The criteria for visions they must be six words or less... Six or less, let's do this six or less." (1691-1693s)

### On AI Role:
> "AI should keep providing summaries and also ask questions until there's some substantive information." (1522s)

### On Step 2 Removal:
> "I think the second step is not core aspirations, but to clarify regarding with the magnitude impact and so on." (1591s)

### On Timeline:
> "Can that be done in the next two hours? Because we need to share it with students." (1746s)
> "Yeah, I'll share it in one hour. OK. And you can test it." (1757s)

---

## ✅ Next Steps

1. **Immediate** (Today):
   - [ ] Complete P0 tasks (6-word validation)
   - [ ] Deploy to dev environment
   - [ ] Test with 2-3 sample users

2. **This Week**:
   - [ ] Implement NEW Step 2
   - [ ] Run database migration
   - [ ] Full end-to-end testing

3. **Before Student Launch**:
   - [ ] Professor review and approval
   - [ ] Deploy to production
   - [ ] Prepare student instructions

---

**Status**: 📝 Plan Complete, Implementation In Progress
**Last Updated**: 2025-10-09 16:35 EST
**Next Review**: After P0 completion
