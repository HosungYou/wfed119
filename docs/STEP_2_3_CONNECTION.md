# Step 2 → Step 3 Connection Design

**Date**: 2025-10-09
**Purpose**: Natural transition from brainstorming to composition

---

## 🔗 Complete Connection Flow

### **Step 2: Brainstorm Vision**

**User Actions:**
1. Reviews Step 1 paragraph (displayed in highlighted box)
2. Chats with AI (clarifying magnitude, scope, action)
3. AI generates 3-5 six-word vision options
4. User selects one option OR creates custom
5. Clicks "Next Step"

**Data Saved:**
```javascript
{
  current_step: 3,
  brainstormed_options: [
    {
      statement: "Transform education for underserved communities",
      wordCount: 6,
      explanation: "Highlights transformation..."
    },
    // ... more options
  ],
  selected_option_index: 1,  // or null if custom
  final_statement: "Transform education for underserved communities"
}
```

---

### **Transition Moment**

**When "Next Step" is clicked:**

```javascript
// Step 2 page (goToNextStep function)
1. Validate selection exists
2. Validate word count (if custom)
3. Save to database:
   - brainstormed_options (all AI options)
   - selected_option_index (which one chosen)
   - final_statement (the selected text)
4. Redirect to /discover/vision/step3
```

**User sees:**
- Brief loading state
- Smooth transition to Step 3

---

### **Step 3: Compose & Visualize**

**Initial State:**
```javascript
// Step 3 page (loadData function)
1. Fetch session data
2. Load final_statement from database ✓
3. Auto-fill textarea with selected vision ✓
4. Show "From Step 2" info box ✓
```

**UI Display:**
```
┌──────────────────────────────────────────────┐
│ Step 3: Compose & Visualize                  │
├──────────────────────────────────────────────┤
│                                              │
│  [Green Box - From Step 2]                  │
│  From Step 2  |  You can refine it below ↓  │
│  Your selected vision:                       │
│  "Transform education for underserved        │
│   communities"                               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Transform education for underserved    │ │
│  │ communities                            │ │ (EDITABLE)
│  └────────────────────────────────────────┘ │
│  6 / 6 words ✓                              │
│                                              │
│  [AI Review] [Confirm & Accept]             │
└──────────────────────────────────────────────┘
```

**User Experience:**
1. ✅ **See Step 2 selection** (green info box)
2. ✅ **Vision auto-loaded** (in textarea)
3. ✅ **Can edit freely** (composition, not validation)
4. ✅ **Word counter active** (6 words or less)
5. ✅ **AI Review** (refinement suggestions)
6. ✅ **Finalize** → Vision Card

---

## 🎯 Design Principles

### **1. Continuity**
- Step 2 choice is **visible** in Step 3
- No confusion: "Where did this come from?"
- Clear label: "From Step 2"

### **2. Flexibility (교수님 요구사항)**
> "It's not to validate, it's to compose... there needs to be room for change"

- Textarea is **editable**, not read-only
- User can refine, not just accept
- AI provides **suggestions**, not rejections

### **3. Visual Connection**
```
Step 1 Paragraph (300-500 chars)
    ↓ [Distillation]
Step 2 Options (6 words each) → User selects
    ↓ [Composition]
Step 3 Refinement → Final Vision
```

Each step shows context from previous:
- Step 2 shows Step 1 paragraph
- Step 3 shows Step 2 selection

---

## 📊 Data Flow

### **Database Schema:**
```sql
vision_statements {
  -- Step 1
  future_imagery TEXT,

  -- Step 2
  brainstormed_options JSONB,      -- AI-generated options
  selected_option_index INT,        -- User's choice (0-4 or NULL)

  -- Step 3
  final_statement TEXT,             -- Final composed vision
  selected_template_id UUID,        -- Vision card template
  is_completed BOOLEAN
}
```

### **Step 2 → Step 3 Data Transfer:**
```javascript
// Step 2 saves:
PATCH /api/discover/vision/session
{
  current_step: 3,
  brainstormed_options: [...],
  selected_option_index: 1,
  final_statement: "Transform education..."
}

// Step 3 loads:
GET /api/discover/vision/session
{
  final_statement: "Transform education..."  // Auto-loaded ✓
}
```

---

## 🎨 UI Components

### **Step 3: "From Step 2" Info Box**

```tsx
{finalStatement && (
  <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
        From Step 2
      </span>
      <span className="text-xs text-gray-500">
        You can refine it below ↓
      </span>
    </div>
    <p className="text-sm text-green-900">
      <strong>Your selected vision:</strong> "{finalStatement}"
    </p>
  </div>
)}
```

**Features:**
- Green gradient (positive, continuation)
- "From Step 2" badge (clear origin)
- "You can refine" (permission to edit)
- Shows exact selected text

---

## 🔄 User Journeys

### **Journey 1: Accept AI Option (Most Common)**
```
Step 2:
1. AI suggests: "Transform education for underserved communities"
2. User selects Option 2
3. Clicks "Next Step"

Step 3:
1. Sees green box: "From Step 2: Transform education..."
2. Vision auto-loaded in textarea
3. Likes it → Clicks "AI Review"
4. AI confirms: "6 words ✓ Clear, impactful"
5. Clicks "Confirm & Accept"
6. Selects vision card template
7. Downloads PNG
8. Complete!
```

**Time**: ~30 seconds in Step 3

---

### **Journey 2: Refine AI Option**
```
Step 2:
1. AI suggests: "Transform education for underserved communities"
2. User selects Option 2
3. Clicks "Next Step"

Step 3:
1. Sees selected vision
2. Thinks: "I want to emphasize 'global'"
3. Edits to: "Transform education for global communities" (6 words)
4. Word counter: 6 / 6 words ✓
5. Clicks "AI Review"
6. AI: "Great refinement! Clear scope."
7. Confirms → Vision card → Done
```

**Time**: ~1 minute in Step 3

---

### **Journey 3: Complete Rewrite (Rare)**
```
Step 2:
1. AI suggests 5 options
2. User creates custom: "Empower millions through innovative technology" (5 words)
3. Clicks "Next Step"

Step 3:
1. Sees custom vision from Step 2
2. Realizes wants different verb
3. Changes to: "Inspire millions through educational innovation" (6 words)
4. Word counter validates
5. AI Review → Confirms → Done
```

**Time**: ~2 minutes in Step 3

---

## ✅ Success Criteria

### **Connection Quality:**
- [x] Step 2 selection visible in Step 3
- [x] Auto-load eliminates manual retyping
- [x] User understands origin of text
- [x] Editing is intuitive and encouraged

### **User Experience:**
- [x] No confusion about where vision came from
- [x] Clear permission to modify
- [x] Smooth transition (no jarring changes)
- [x] Feels like natural progression

### **Technical:**
- [x] Data saved correctly in Step 2
- [x] Data loaded correctly in Step 3
- [x] No data loss during transition
- [x] Word count preserved and validated

---

## 🧪 Testing Scenarios

### **Test 1: Standard Flow**
```
1. Complete Step 1 → Step 2
2. Select AI Option 3
3. Click "Next Step"
4. Step 3 should show:
   ✓ Green "From Step 2" box
   ✓ Option 3 text in textarea
   ✓ 6 / 6 words counter
   ✓ Box and textarea match exactly
```

### **Test 2: Custom Vision**
```
1. Step 2: Create custom "Empower youth globally" (3 words)
2. Click "Next Step"
3. Step 3 should show:
   ✓ "From Step 2" box with "Empower youth globally"
   ✓ Textarea pre-filled with same
   ✓ 3 / 6 words counter
```

### **Test 3: Edit in Step 3**
```
1. Step 3 loaded with "Transform education communities" (3 words)
2. User adds "for underserved global" → 6 words
3. Word counter updates: 6 / 6 words ✓
4. Green info box still shows original
5. AI Review validates new version
```

---

## 📝 Key Differences from Original Design

### **Original Problem:**
- Step 3 had validation → felt restrictive
- No connection to Step 2 visible
- Users confused where vision came from

### **New Design:**
- Step 3 is composition → feels collaborative
- Clear "From Step 2" indicator
- Users understand progression

### **교수님 Feedback Integration:**
> "It's not to validate, it's to compose"

**Implemented:**
- ✅ Editable textarea (not read-only validation)
- ✅ "AI Review" (not "Validate")
- ✅ "Compose & Visualize" (not "Finalize")
- ✅ Room for change (green box encourages refinement)

---

## 🚀 Future Enhancements (Optional)

### **1. Show All Step 2 Options in Step 3**
```
Expandable section:
"View other options from Step 2 ▼"
  → Shows all 5 AI-generated options
  → User can switch if they change mind
```

### **2. Compare Mode**
```
Side-by-side:
[Original from Step 2] | [Your Refined Version]
```

### **3. Revision History**
```
Track changes:
- Step 2: "Transform education communities"
- Step 3 v1: "Transform global education communities"
- Step 3 v2: "Transform education for communities"
```

---

**Status**: Implemented and ready for testing
**Last Updated**: 2025-10-09 18:00 EST
