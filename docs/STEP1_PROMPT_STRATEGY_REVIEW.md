# Step 1 AI Prompt Strategy Review & Optimization

**Date**: 2025-10-09
**Purpose**: Review and optimize the Step 1 prompt engineering strategy to reduce unnecessary questions and improve user experience.

---

## Current Problems

### 1. Too Many Questions ❌
The current prompt instructs AI to ask 4 categories of questions:
- Visual Details
- Emotional Exploration
- Activity Specification
- Relationship Questions

**Problem**: This creates a long, exhausting conversation (5-7 exchanges minimum).

### 2. Redundant Information Gathering ❌
AI asks for information already available in context:
- Values are already known
- Strengths are already known
- User profile is available

**Problem**: Wastes user time re-answering what system already knows.

### 3. Unclear Draft Trigger ❌
Current trigger: "After 5-7 exchanges, assess if conversation has matured"

**Problem**: Too vague, AI might wait too long or generate draft too early.

---

## Optimized Strategy

### Core Principles
1. **"Ask ONLY what we don't already know"**
2. **"Quality over speed - ALL requirements must be met"**
3. **"2-3 exchanges maximum, but NEVER compromise on requirements"**

### New Approach: 2-3 Exchange Flow with Strict Requirements

#### Required Information Checklist

**Draft is ONLY generated when ALL 4 requirements are met:**

1. ✅ **Professional Role/Work Type**
   - Example: "Non-profit leader", "Tech entrepreneur", "Product designer"
   - If missing: "What would your primary professional role be?"

2. ✅ **Impact Magnitude with Numbers** (MUST include specific numbers)
   - Example: "50,000 students", "100 communities", "1 million users"
   - If missing: "How many people or communities would your work impact? Be specific with numbers."

3. ✅ **Scope** (MUST be explicit)
   - Example: "national", "global", "local community", "organizational"
   - If missing: "Is this impact local, national, or global?"

4. ✅ **Target Beneficiaries** (MUST be specific)
   - Example: "underserved high school students", "small business owners", "rural communities"
   - If missing: "Who specifically benefits from this work?"

**If ANY requirement is missing → AI asks targeted clarification questions before generating draft.**

---

#### Exchange 1: AI Opens with Context-Rich Question
AI asks ONE targeted question that incorporates user's values/strengths AND requests all 4 requirements:

**Example**:
```
Looking at your core values (Innovation, Impact, Collaboration) and your
top strength (Strategic Thinking), imagine yourself 10 years from now:

What's the ONE professional achievement or impact that would make you feel
most fulfilled? Be as specific as possible about the scale and scope.

(For example: "Empowering 100,000 underserved students through AI education"
or "Building a sustainable tech company that employs 500+ people")
```

**Why this works**:
- ✅ Single question (not overwhelming)
- ✅ Incorporates known context (values/strengths)
- ✅ Asks for CONCRETE details (scale, scope, impact)
- ✅ Provides examples to guide response quality

---

#### Exchange 2: Requirements Check + Clarification
AI checks user's response against the 4 requirements. Two possible paths:

**Path A: All requirements met → Generate draft immediately**

**Path B: Missing requirements → Show checklist + ask for missing info**

**Example (Path B - Missing Requirements)**:
```
Great start! To create your vision story, I need a bit more specificity:

✅ Role: Non-profit leader (clear!)
❌ Numbers: You mentioned "many students" - can you estimate? (e.g., 5,000? 50,000?)
✅ Scope: National (clear!)
❌ Beneficiaries: Who specifically? (e.g., "underserved high school students"?)

These details will make your vision much more powerful!
```

**Why this works**:
- ✅ Visual checklist shows progress
- ✅ Only asks for missing items (not redundant)
- ✅ Provides examples to guide quality
- ✅ Explains WHY details matter

---

#### Exchange 3: Draft Generation (Only When Complete)
After receiving missing details, AI generates draft ONLY if all 4 requirements are now met.

**Example**:
```
Perfect! I now have everything needed to create your vision story.

Summary of your vision:
- **Role**: Non-profit leader
- **Impact**: 50,000 underserved students nationally
- **Beneficiaries**: High school students in low-income communities
- **Values Alignment**: Innovation in Education driving systemic change

📝 DRAFT_START
Ten years from now, I lead a thriving non-profit organization that has
transformed tech education access for over 50,000 underserved high school
students across the United States. Through innovative AI and coding curriculum,
strategic partnerships with leading tech companies, and hands-on mentorship,
I empower communities that have been historically excluded from the tech industry.
DRAFT_END

Does this capture your vision? If yes, click "Next Step" to continue!
```

---

## Revised Prompt Structure

### System Prompt Changes

**BEFORE** (Current):
```
Guide:
1. Visual Details: "Where do you wake up?", "What do you see around you?"
2. Emotional Exploration: "How do you feel in that moment?"
3. Activity Specification: "What is the most meaningful moment of your day?"
4. Relationship Questions: "Who do you spend time with?"

After 5-7 exchanges, assess if the conversation has matured...
```

**AFTER** (Optimized):
```
Conversation Strategy:
1. **Opening Question** (Exchange 1): Ask ONE context-rich question incorporating
   user's top value and strength. Request specific scale/scope/impact details.

   Template: "Looking at your core value of [VALUE] and strength in [STRENGTH],
   imagine 10 years from now: What's the ONE professional achievement that would
   make you most fulfilled? Include specific scale and scope."

2. **Clarification + Draft** (Exchange 2): If user provides sufficient detail
   (magnitude, scope, role), immediately generate draft. If details are vague,
   ask 1-2 targeted follow-ups, then generate draft.

3. **Draft Generation Trigger**: Generate draft when you have:
   - ✅ Professional role/work type
   - ✅ Impact magnitude (e.g., "100,000 students", "global communities")
   - ✅ Scope (global/national/local/organizational)
   - ✅ Values alignment mentioned

**Maximum exchanges before draft: 3** (not 5-7)
```

---

## Comparison: Old vs New

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| **Questions Asked** | 4-6 separate questions | 1 context-rich question + 1-2 follow-ups |
| **Exchanges Required** | 5-7 exchanges | 2-3 exchanges maximum |
| **Context Usage** | Mentioned but not integrated | Directly incorporated in questions |
| **Draft Trigger** | Vague "maturity assessment" | Clear criteria checklist |
| **User Time** | 8-12 minutes | 3-5 minutes |
| **User Fatigue** | High (too many questions) | Low (concise, targeted) |

---

## Example Conversation Flow

### User Profile:
- **Top Value**: Innovation in Education
- **Top Strength**: Strategic Thinking
- **Time Horizon**: 10 years from now

---

### 🤖 AI Opening (Exchange 1):
```
Hello! 👋

Looking at your core value of "Innovation in Education" and your strength
in Strategic Thinking, let's imagine your professional life 10 years from now.

⚠️ Focus on your PROFESSIONAL SELF as the anchor.

What's the ONE professional achievement or impact that would make you feel
most fulfilled? Please be specific about:
- The scale/magnitude (e.g., "10,000 students", "national policy change")
- Your primary role or work
- Who benefits from this vision

Share freely what comes to mind!
```

---

### 👤 User Response:
```
I want to transform how underserved communities access technology education.
I see myself leading a non-profit that has trained over 50,000 students in
coding and AI skills, helping them land jobs in tech.
```

---

### 🤖 AI Clarification + Draft (Exchange 2):
```
Beautiful vision! I can see how this aligns perfectly with your value of
Innovation in Education.

Two quick questions:
1. Is this vision focused on a specific region (local, national, global)?
2. What does a meaningful day look like in this role for you?
```

---

### 👤 User Response:
```
Initially focused on underserved communities in the U.S., but with plans to
expand globally. A meaningful day involves mentoring students, designing new
curriculum, and building partnerships with tech companies.
```

---

### 🤖 AI Draft Generation (Exchange 3):
```
Perfect! Based on our conversation, here are the key themes:
- **Impact**: Transform tech education access for 50,000+ underserved students
- **Scope**: U.S.-focused with global expansion plans
- **Role**: Non-profit leader, mentor, curriculum designer, partnership builder
- **Values**: Innovation in Education driving systemic change

Here's a draft that captures your vision:

📝 DRAFT_START
Ten years from now, I lead a thriving non-profit organization that has
transformed tech education access for over 50,000 underserved students across
the United States. Through innovative AI and coding curriculum, strategic
partnerships with leading tech companies, and hands-on mentorship, I empower
communities that have been historically excluded from the tech industry. Each
day brings meaningful moments: designing cutting-edge learning experiences,
watching students land their first tech jobs, and building the foundation for
global expansion that will reach millions more.
DRAFT_END

Does this accurately capture your desired future in story format?

If yes, please click "Next Step" below to create your 6-word vision statement!
```

---

## Implementation Changes Needed

### File: `src/app/api/discover/vision/ai-chat/route.ts`

**Lines to Update**: 147-203 (Step 1 prompt section)

**New Prompt**:
```typescript
1: `
${baseContext}

**Current Stage: Step 1 - Imagine Your Future**

Goal: Quickly synthesize user's future vision in 2-3 exchanges maximum.

**Conversation Strategy**:

1. **Opening Question** (Exchange 1):
   Ask ONE context-rich question incorporating user's top value and strength.
   Request specific scale/scope/impact details.

   Template:
   "Looking at your core value of [VALUE] and strength in [STRENGTH],
   imagine your professional life 10 years from now:

   What's the ONE professional achievement or impact that would make you
   most fulfilled? Please be specific about:
   - Scale/magnitude (e.g., '10,000 people', 'national impact')
   - Your primary role or work
   - Who benefits from this vision"

2. **Clarification + Draft** (Exchange 2):
   - If user provides sufficient detail → immediately generate draft
   - If details are vague → ask 1-2 targeted follow-ups

   Required info for draft:
   - ✅ Professional role/work type
   - ✅ Impact magnitude
   - ✅ Scope (global/national/local)
   - ✅ Beneficiaries

3. **Draft Generation** (Exchange 2 or 3 max):
   When you have sufficient info, generate draft immediately.

   Format:
   ---
   Based on our conversation, here are the key themes:
   - [Impact: magnitude and scope]
   - [Role and activities]
   - [Values alignment]

   📝 DRAFT_START
   [300-500 character paragraph: vivid, specific, inspiring future vision]
   DRAFT_END

   Does this capture your vision? If yes, click "Next Step"!
   ---

**Important Guidelines**:
- Keep conversation focused and concise (2-3 exchanges MAX)
- Avoid generic questions like "Where do you wake up?" or "How do you feel?"
- Prioritize PROFESSIONAL impact over personal life details
- Use user's existing values/strengths data in questions
- Generate draft as soon as you have: role + magnitude + scope + beneficiaries

**Examples of Great Opening Questions**:
- "With your value of 'Innovation in Healthcare' and strength in 'Problem-Solving',
  what professional achievement 10 years from now would fulfill you most?
  Be specific about scale and who benefits."

- "Given your passion for 'Social Justice' and talent for 'Communication',
  imagine your ideal work 10 years from now: What impact are you making,
  and how many people does it reach?"
`,
```

---

## Benefits of Optimization

### User Experience
- ✅ **Faster completion**: 3-5 minutes instead of 8-12 minutes
- ✅ **Less fatigue**: 2-3 exchanges instead of 5-7
- ✅ **More clarity**: Single focused question vs. multiple scattered questions
- ✅ **Better context usage**: Leverages known values/strengths immediately

### AI Performance
- ✅ **Clearer instructions**: Specific exchange flow instead of vague "maturity assessment"
- ✅ **Faster draft generation**: Clear trigger criteria
- ✅ **Higher quality responses**: Context-rich questions yield better user responses

### System Efficiency
- ✅ **Fewer API calls**: 2-3 exchanges vs. 5-7 exchanges
- ✅ **Lower token usage**: Shorter conversations
- ✅ **Better conversion rate**: Less user drop-off due to fatigue

---

## Metrics to Track

### Before Optimization
- Average exchanges per session: 5-7
- Average time to draft: 8-12 minutes
- User drop-off rate: [TO BE MEASURED]
- Draft quality score: [TO BE MEASURED]

### After Optimization (Expected)
- Average exchanges per session: 2-3
- Average time to draft: 3-5 minutes
- User drop-off rate: [IMPROVE BY 30%]
- Draft quality score: [MAINTAIN OR IMPROVE]

---

## Next Steps

1. ✅ Update AI prompt in `ai-chat/route.ts`
2. ⏳ Test with sample users
3. ⏳ Measure conversation length and quality
4. ⏳ Iterate based on feedback
5. ⏳ Document in release notes

---

## Conclusion

**Current approach**: Too many questions, redundant information gathering, vague triggers
**Optimized approach**: Context-rich single question, 2-3 exchanges max, clear draft criteria

**Expected Impact**:
- 50% reduction in conversation length
- 30% improvement in user completion rate
- Maintained or improved draft quality
