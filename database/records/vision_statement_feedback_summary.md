# Vision Statement Module - Feedback Summary

**Recording Date**: October 9, 2025
**Source**: 445 Waupelani Dr.m4a
**Duration**: ~34 minutes

---

## Key Feedback Points

### 1. **Time Horizon Flexibility**
- Don't make 10 years the default option
- Ask users first: "What's your ideal future time horizon?" (10, 15, or 20 years, or specific age like 65)
- Allow users to choose their own timeline before starting

### 2. **Vision Statement Structure - Four Steps**

#### Step 1: Guided Imagery (Warm-up)
- Help users envision a vivid future scenario
- This is a **warm-up activity** - doesn't need to directly translate to vision statement
- Use shorter version for college students (different from mid-life people)

#### Step 2: Dream List & Future Stories
- Users brainstorm dreams according to:
  - Different life stages
  - Life space/roles
- Ask: "What are you doing? How did you feel? What impact were you making?"
- Focus on **professional self** as the anchor

#### Step 3: Extract Core Aspirations
- AI should retrieve **3-5 core aspirations** from their future stories
- Then ask: **"If you were to choose only ONE of these, which would it be?"**
- This becomes the foundation for the vision statement

#### Step 4: Create Vision Statement
- Turn the core aspiration into **one short, symbolic phrase**
- Make it **highly motivational and symbolic**
- AI asks: "What's the essence of this story? How would you turn it into one short phrase?"

---

## Critical Requirements

### Focus on Professional Self
- **Must emphasize professional career** as the anchor
- Students tend to envision personal life (family, house by the lake, etc.)
- Without clear instructions, they miss the professional element
- Professional self should be explicitly requested and checked by AI

### Input Requirements
Users should supply:
1. **Life themes** (from previous modules)
2. **Life values** (from previous modules)
3. **Mission statement** (from previous modules)
4. **Future stories** (from guided imagery and dream list)
5. **List of dreams**
6. **Guided imagery results** (scenes they want to remember for future career)

### AI Questions to Ask
- **Magnitude of impact**: Who do you want to reach?
  - Community level?
  - Country level?
  - International level?
  - How many people?
- **Timeframe**: When do you want to achieve this?
- **Essence**: What's the most symbolic part of your future story?

---

## Important Design Decisions

### What NOT to Do
❌ Don't interfere with future component by providing past stories
❌ Don't include different life roles in vision statement (only professional self)
❌ Don't make vision statement too broad (like "be a millionaire" or "nice grandfather")

### What TO Do
✅ Ask users to **copy and paste their future stories**
✅ AI should **double-check** if there's sufficient information about professional self
✅ Connect to mission statement as the "anchor"
✅ Make vision statement **specific, symbolic, and motivational**
✅ Focus on **one core dimension** (professional career)

---

## Workflow Summary

```
1. Ask user for time horizon
   ↓
2. Guided imagery (warm-up) → User writes down key scenes
   ↓
3. Dream list activity (considering life stages/roles)
   ↓
4. Write future stories
   ↓
5. User pastes: Mission + Themes + Values + Future Stories + Dreams
   ↓
6. AI extracts 3-5 core aspirations
   ↓
7. AI asks: "Choose only ONE"
   ↓
8. AI asks about magnitude, impact, essence
   ↓
9. AI helps craft one short, symbolic phrase
   ↓
10. Vision Statement created!
```

---

## Module Revision Needed

Dr. Yann will revise the structure after this feedback session.

Key quote from recording:
> "I'm going to revise the structures after having this question here. Let's start revising the structure after reviewing the documentation."

---

## Additional Notes

- The app was **not ready for use** in that day's class
- They decided to work on it further based on this feedback
- Privacy concerns were raised about using age-progression photo features
- Students often have "vague ideas" about their future - this module helps crystallize them

---

## Next Steps

1. Update Vision Statement module structure
2. Implement 4-step process with AI guidance
3. Add professional self validation checks
4. Connect to existing Life Themes, Values, and Mission Statement modules
5. Create clear prompts that emphasize professional career focus
