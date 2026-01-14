# AI Interpretation & Cross-Module Data Usage Guide

This document explains how AI interpretation works in the LifeCraft system and how data from previous modules is used to provide personalized insights.

---

## 📊 System Architecture

### Module Data Flow

```
┌──────────────┐
│  Module 1:   │──┐
│   Values     │  │
└──────────────┘  │
                  ├──▶ Cross-Module Context ──▶ AI Prompt
┌──────────────┐  │                                  │
│  Module 2:   │──┤                                  │
│  Strengths   │  │                                  ▼
└──────────────┘  │                          ┌──────────────┐
                  │                          │   Claude AI  │
┌──────────────┐  │                          │  (Haiku 3)   │
│  Module 3:   │──┤                          └──────────────┘
│  Enneagram   │  │                                  │
└──────────────┘  │                                  ▼
                  │                          ┌──────────────┐
┌──────────────┐  │                          │     AI       │
│  Module 4:   │──┘                          │ Interpretation│
│ Life Themes  │                             └──────────────┘
└──────────────┘
```

---

## 🤖 AI Interpretation Example: Enneagram Module

### 1. Data Collection

**Location**: `src/app/api/enneagram/interpret/route.ts`

When user completes Enneagram assessment:

```typescript
interface InterpretRequest {
  enneagram: {
    type: number;         // Primary Enneagram type (1-9)
    wing: number;         // Wing type
    instinct: 'sp' | 'so' | 'sx';  // Dominant instinct
    confidence: string;
  };
  strengths?: {          // ⭐ DATA FROM PREVIOUS MODULE!
    skills: string[];    // From Strengths module
    attitudes: string[];
    values: string[];
  };
  locale?: 'en' | 'ko';
}
```

**Key Point**: The `strengths` field contains data from the **Strengths module** (Module 2), completed earlier!

### 2. AI Prompt Construction

**Code** (Line 157-201):

```typescript
const strengthsContext = strengths
  ? `
## User's Discovered Strengths:
- Skills: ${strengths.skills.join(', ')}
- Attitudes: ${strengths.attitudes.join(', ')}
- Values: ${strengths.values.join(', ')}
`
  : '';

const prompt = `You are an expert Enneagram coach and career advisor.

## User's Enneagram Profile:
- Primary Type: Type ${type} - ${typeProfile.name[locale]}
- Wing: ${wing} (${type}w${wing})
- Dominant Instinct: ${instinctNames[instinct]}

${strengthsContext}  // ⭐ Strengths data included in prompt!

Generate a personalized interpretation with:
{
  "typeOverview": "...",
  "wingInfluence": "...",
  "instinctFocus": "...",
  "strengthsSynergy": "...",  // ⭐ Analyzes strengths + enneagram synergy!
  "growthPath": "...",
  "careerInsights": "..."
}`;
```

### 3. Claude API Call

**Model**: `claude-3-haiku-20240307` (Fast, cost-effective)
**Temperature**: 0.7 (Balanced creativity)
**Max Tokens**: 1024

```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 1024,
  temperature: 0.7,
  messages: [{ role: 'user', content: prompt }],
});
```

### 4. Response Example

```json
{
  "interpretation": {
    "typeOverview": "As a Type 9 Peacemaker, your core motivation is to maintain inner harmony...",
    "wingInfluence": "With a Type 8 wing, you have a stronger assertive side...",
    "instinctFocus": "Your self-preservation instinct causes you to focus on creating a stable, comfortable life...",
    "strengthsSynergy": "Your discovered strengths (Active Learning, Adaptability, Collaboration) naturally complement your Type 9...",  // ⭐ Uses Strengths data!
    "growthPath": "To grow, focus on developing your Type 3 qualities...",
    "careerInsights": "Your Type 9 thrives in roles where you can leverage mediation, active listening..."
  }
}
```

---

## 🔗 Cross-Module Context System

### How It Works

**Location**: `src/lib/services/moduleProgressService.ts` (Line 1267-1340)

```typescript
async generatePromptContext(currentModule: ModuleId): Promise<string> {
  const context = await this.getCrossModuleContext(currentModule);
  const parts: string[] = [];

  // Values Module
  if (context.availableData.values) {
    parts.push(`User's Core Values:
- Terminal Values (Life Goals): ${v.terminalTop3.join(', ')}
- Instrumental Values (How to Live): ${v.instrumentalTop3.join(', ')}
- Work Values: ${v.workTop3.join(', ')}`);
  }

  // Strengths Module
  if (context.availableData.strengths) {
    parts.push(`User's Key Strengths:
${s.topStrengths.map(str => `- ${str.name}: ${str.description}`).join('\n')}`);
  }

  // Enneagram Module
  if (context.availableData.enneagram) {
    parts.push(`User's Enneagram Type: Type ${e.type}w${e.wing} (${e.instinct} instinct)
${e.description || ''}`);
  }

  // Life Themes Module
  if (context.availableData['life-themes']) {
    parts.push(`User's Key Life Themes:
${lt.themes.map((t, i) => `${i+1}. ${t.theme}: ${t.description}`).join('\n')}`);
  }

  // Vision Module
  if (context.availableData.vision) {
    parts.push(`User's Vision Statement: "${v.visionStatement}" (${v.timeHorizon})`);
  }

  // Mission Module
  if (context.availableData.mission) {
    parts.push(`User's Mission Statement: "${m.finalStatement}"`);
  }

  // Career Options Module
  if (context.availableData['career-options']) {
    parts.push(`User's Holland Code: ${c.hollandCode}
Top Career Choices: ${c.topCareerChoices.map(ch => ch.career).join(', ')}`);
  }

  // ... SWOT, Goals, ERRC modules

  return parts.join('\n\n');
}
```

### Usage in Modules

Every module's AI assistant receives this context:

```typescript
// Example: Vision module AI assistant
const context = await service.generatePromptContext('vision');

const aiPrompt = `
${context}  // ⭐ All previous module data!

Current Module: Vision
Help the user craft a compelling vision statement...
`;
```

**Result**: AI assistant in Vision module knows:
- User's core values (from Values module)
- User's key strengths (from Strengths module)
- User's personality type (from Enneagram module)
- User's life themes (from Life Themes module)

This enables **highly personalized** and **contextually aware** assistance!

---

## 📦 Integrated Profile System

### Data Aggregation Process

**Location**: `src/lib/services/moduleProgressService.ts` (Line 1073-1211)

When a module is completed:

```typescript
async syncIntegratedProfile(completedModuleId: ModuleId): Promise<void> {
  // 1. Get all completed modules
  const completedModules = allProgress
    .filter(p => p.status === 'completed')
    .map(p => p.moduleId);

  // 2. Build profile data
  const profileData: Record<string, unknown> = {
    user_id: this.userId,
    modules_completed: completedModules,
    profile_completeness: Math.round((completedModules.length / MODULE_ORDER.length) * 100),
  };

  // 3. Add data from each completed module
  if (completedModules.includes('values')) {
    profileData.top_values = [...];  // Top 9 values
  }

  if (completedModules.includes('strengths')) {
    profileData.top_strengths = [...];  // Top 5 strengths
  }

  if (completedModules.includes('enneagram')) {
    profileData.enneagram_type = enneagramData.type;
    profileData.enneagram_wing = enneagramData.wing;
    profileData.enneagram_instinct = enneagramData.instinct;
  }

  if (completedModules.includes('life-themes')) {
    profileData.life_themes = [...];  // Top 5 themes
  }

  if (completedModules.includes('vision')) {
    profileData.vision_statement = visionData.visionStatement;
    profileData.time_horizon = visionData.timeHorizon;
    profileData.dreams = visionData.dreams;
    profileData.core_aspirations = visionData.coreAspirations;
  }

  // ... mission, career-options, swot, goals, errc

  // 4. Upsert to database
  await supabase
    .from('user_integrated_profiles')
    .upsert(profileData, { onConflict: 'user_id' });
}
```

### Database Schema

**Table**: `user_integrated_profiles`

```sql
CREATE TABLE user_integrated_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,

  -- Module Data
  top_values JSONB,                    -- From Values module
  top_strengths JSONB,                 -- From Strengths module
  enneagram_type INTEGER,              -- From Enneagram module
  enneagram_wing INTEGER,
  enneagram_instinct TEXT,
  life_themes JSONB,                   -- From Life Themes module
  vision_statement TEXT,               -- From Vision module
  time_horizon TEXT,
  dreams JSONB,
  mission_statement TEXT,              -- From Mission module
  career_options JSONB,                -- From Career Options module
  swot_summary JSONB,                  -- From SWOT module
  life_roles JSONB,                    -- From Goals module
  key_objectives JSONB,
  errc_actions JSONB,                  -- From ERRC module

  -- AI Analysis
  ai_career_insights TEXT,
  ai_strength_patterns TEXT,
  ai_value_alignment TEXT,
  ai_recommended_actions JSONB,
  ai_personality_summary TEXT,
  ai_growth_areas JSONB,

  -- Metadata
  modules_completed TEXT[],
  profile_completeness INTEGER,
  last_ai_analysis_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 How Previous Module Data is Used

### Example Flow

1. **User completes Values module**
   - Values data saved to `module_data.values`
   - Integrated profile updated with `top_values`

2. **User moves to Strengths module**
   - AI assistant receives Values context
   - Example prompt: *"Given your top values (Learning, Autonomy, Achievement), which strengths...?"*

3. **User completes Strengths module**
   - Strengths data saved
   - Profile updated with `top_strengths`

4. **User moves to Enneagram module**
   - AI assistant receives Values + Strengths context
   - After assessment, generates interpretation with `strengthsSynergy`
   - Example: *"Your strengths (Active Learning, Adaptability) align well with Type 9's desire for harmony..."*

5. **User moves to Life Themes module**
   - AI receives Values + Strengths + Enneagram context
   - Helps identify life themes that align with personality and strengths

6. **...and so on through all 10 modules**

### Benefits

✅ **Consistency**: AI recommendations build on previous insights
✅ **Personalization**: Each module's AI knows the full user context
✅ **Depth**: Later modules provide richer, more integrated guidance
✅ **Coherence**: Final life plan aligns all aspects of self-discovery

---

## 🔍 Debugging Integrated Profile

### Check Profile Data

**Supabase SQL**:
```sql
SELECT
  user_id,
  enneagram_type,
  enneagram_wing,
  enneagram_instinct,
  modules_completed,
  profile_completeness,
  updated_at
FROM user_integrated_profiles
WHERE user_id = 'YOUR_USER_ID';
```

### Check Module Completion Status

```sql
SELECT
  module_id,
  status,
  completed_at
FROM module_progress
WHERE user_id = 'YOUR_USER_ID'
ORDER BY completed_at;
```

### Trigger Manual Sync

**API Call**:
```bash
POST /api/modules/integrated-profile/refresh
```

This will:
1. Fetch all completed modules
2. Re-aggregate data from each module
3. Update `user_integrated_profiles` table
4. Return updated profile

---

## 📚 Related Files

- **AI Interpretation**: `src/app/api/enneagram/interpret/route.ts`
- **Cross-Module Context**: `src/lib/services/moduleProgressService.ts`
- **Integrated Profile API**: `src/app/api/modules/integrated-profile/route.ts`
- **Profile Display**: `src/components/dashboard/IntegratedProfileCard.tsx`
- **Module Types**: `src/lib/types/modules.ts`

---

## 🎓 Summary

**Key Insights**:
1. ✅ Every module's AI receives data from **all previously completed modules**
2. ✅ Cross-module context enables **personalized, coherent guidance**
3. ✅ Integrated profile **aggregates data** from all modules into one unified view
4. ✅ AI interpretations (like Enneagram) **explicitly analyze synergies** between modules

**Example of Cross-Module Intelligence**:
- Enneagram interpretation mentions how your **Strengths** complement your personality type
- Vision crafting considers your **Values**, **Strengths**, **Enneagram**, and **Life Themes**
- Career Options uses **Values**, **Strengths**, **Enneagram**, **Vision**, and **Mission** to suggest careers
- SWOT analysis incorporates **all 7 previous modules** to identify opportunities and threats

This is what makes LifeCraft's AI coaching **truly personalized** - it remembers and builds upon everything you've discovered about yourself! 🚀
