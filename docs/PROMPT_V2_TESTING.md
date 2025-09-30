# Prompt V2 Testing Guide

## 🎯 What Changed

### System Prompt Optimization
- **Before:** 2000+ tokens per message (ENHANCED_SYSTEM_PROMPT + buildContextualPrompt)
- **After:** 600-1000 tokens per message (stage-specific prompts)
- **Reduction:** ~50% token savings

### Key Improvements
1. ✅ Modular, stage-specific prompts
2. ✅ Removed redundant validation logic from prompts
3. ✅ Added few-shot examples for strength extraction
4. ✅ Positive framing throughout
5. ✅ Clear output format templates
6. ✅ Consistent persona (Alex the coach)

---

## 📋 Test Scenarios

### Scenario 1: Ideal User (Happy Path)

**User Profile:** Articulate, engaged, shares detailed stories

**Expected Behavior:**
1. **Initial Stage:**
   - User shares a complete story (100+ chars) about work satisfaction
   - AI responds with warm acknowledgment + 1 follow-up question
   - Progresses to Exploration

2. **Exploration Stage:**
   - User answers question with specifics
   - AI digs deeper with unique questions
   - After 2 valid exchanges, progresses to Deepening

3. **Deepening Stage:**
   - User shares emotions, patterns, connections
   - AI explores different dimensions
   - After 4 total valid exchanges, progresses to Analysis

4. **Analysis Stage:**
   - User discusses skill applications, contexts
   - AI organizes themes mentally
   - After 5 total valid exchanges, progresses to Summary

5. **Summary Stage:**
   - AI delivers comprehensive strength profile
   - Skills (3-6) with evidence
   - Attitudes (3-6) with evidence
   - Values (3-6) with evidence
   - Career connections
   - Encouraging next steps

**Test Input Example:**
```
User: "Last semester I organized a food drive for our community. I reached out to local businesses,
coordinated 20 volunteers, and we collected over 500 pounds of food. The best part was seeing families
pick up groceries and thanking us. It felt like I made a real difference."
```

**Expected AI Response (Initial → Exploration):**
```
That's a wonderful example of taking initiative for your community! The way you coordinated multiple
moving pieces—businesses, volunteers, logistics—shows real organizational leadership. And I love
that the personal connection with families was what made it most meaningful to you.

What motivated you to take on that leadership role rather than just volunteering?
```

**Success Criteria:**
- [ ] Smooth progression through all 5 stages
- [ ] 6-8 valid exchanges total
- [ ] Summary extracts 5+ quality strengths
- [ ] All strengths have clear evidence from user's stories
- [ ] User feels heard and validated

---

### Scenario 2: Hesitant User (Short Responses)

**User Profile:** Brief answers, needs encouragement

**Test Input:**
```
User: "I worked on a project."
```

**Expected AI Behavior:**
- Detects response is too short (<30 chars)
- `validateUserResponse()` returns invalid
- AI sends redirect message:

```
"That's a great start! Could you tell me more about that project? I'm interested in hearing about
what you did, how you approached it, and what made it satisfying for you."
```

**Key Test Points:**
- [ ] Doesn't progress stage on invalid response
- [ ] Redirect is encouraging, not judgmental
- [ ] Provides specific guidance on what to share
- [ ] Gives concrete example of good response

---

### Scenario 3: Question-Asker (Deflecting User)

**User Profile:** Asks questions instead of sharing

**Test Input:**
```
User: "What should I major in?"
User: "How do I find my passion?"
User: "Can you tell me what career is best for me?"
```

**Expected AI Behavior:**
- Detects question pattern
- `validateUserResponse()` returns invalid with shouldRedirect
- Response:

```
"Great question! But first, let's discover YOUR unique strengths through your experiences. Think of a
time when your curiosity led you to discover or create something interesting. What was that like?"
```

**Key Test Points:**
- [ ] Gently redirects without answering the question directly
- [ ] Reframes to focus on their experiences
- [ ] Provides specific prompt to guide them
- [ ] Maintains warm, supportive tone

---

### Scenario 4: Off-Topic User

**User Profile:** Talks about unrelated topics

**Test Input:**
```
User: "I really like pizza. My favorite is pepperoni."
User: "Did you watch the game last night?"
```

**Expected AI Behavior:**
- Detects off-topic pattern
- Validation returns invalid
- Redirect message:

```
"That's interesting! Let's refocus on your work and project experiences though. What accomplishment,
big or small, are you most proud of from the last year?"
```

**Key Test Points:**
- [ ] Doesn't engage with off-topic content
- [ ] Politely redirects to relevant topics
- [ ] Asks clear, focused question
- [ ] Doesn't progress stage

---

### Scenario 5: Stage Progression Boundaries

**Test:** Ensure AI doesn't progress too quickly

**Exploration → Deepening:**
- Should NOT progress with only 1 valid exchange
- Should progress after 2 valid exchanges

**Deepening → Analysis:**
- Should NOT progress with only 3 total valid exchanges
- Should progress after 4 total valid exchanges

**Analysis → Summary:**
- Should NOT progress with only 4 total valid exchanges
- Should progress after 5 total valid exchanges

**Key Test Points:**
- [ ] Stage progression follows rules exactly
- [ ] Invalid responses don't count toward progression
- [ ] Quality over quantity (though quality not yet implemented)

---

### Scenario 6: Strength Extraction Accuracy

**Test Conversation:**
```
User: "I created a mobile app for my dorm to track laundry machine availability. I taught myself
Swift over winter break, designed the UI in Figma, and got 200 students to download it."

Coach: "That's impressive! What motivated you to solve that problem?"

User: "I was frustrated waiting for machines, and I thought 'there has to be a better way.' So I
just decided to build it myself instead of complaining."

Coach: "Love that proactive attitude! How did it feel when you saw 200 downloads?"

User: "It felt amazing! Not just because people used it, but because I created something that
genuinely helped my community. That's what I care about most - making an impact."
```

**Expected Strength Extraction:**

```json
{
  "skills": [
    "Mobile App Development",
    "Self-Teaching",
    "UI/UX Design",
    "Problem Identification"
  ],
  "attitudes": [
    "Proactive Problem-Solving",
    "Self-Directed Learning",
    "Resourcefulness"
  ],
  "values": [
    "Community Impact",
    "Practical Solutions",
    "Continuous Learning"
  ],
  "invalid": false
}
```

**Success Criteria:**
- [ ] Identifies 4-6 skills
- [ ] Identifies 3-4 attitudes
- [ ] Identifies 2-3 values
- [ ] All strengths are specific (not generic)
- [ ] Evidence clearly links to user's story
- [ ] No hallucinated strengths (all grounded in conversation)

---

## 🔬 How to Test

### Manual Testing (Recommended First)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:3000/discover/strengths
   ```

3. **Test each scenario** listed above

4. **Check browser console** for:
   - Token counts (should see reduction)
   - Stage progression logs
   - Validation results

5. **Verify in Supabase:**
   - Check `conversation_messages` table
   - Verify all messages saved
   - Check `strength_profiles` for extraction results

---

### Automated Testing (Future)

**Test Framework Setup:**
```typescript
// tests/prompt-v2.test.ts

describe('Prompt V2 System', () => {
  describe('Token Efficiency', () => {
    it('should use <1000 tokens per message', async () => {
      const systemPrompt = buildSystemPrompt('initial', {...});
      const tokenCount = estimateTokens(systemPrompt);
      expect(tokenCount).toBeLessThan(1000);
    });
  });

  describe('Response Validation', () => {
    it('should reject question instead of story', () => {
      const validation = validateUserResponse("What should I do?", 'initial');
      expect(validation.isValid).toBe(false);
      expect(validation.shouldRedirect).toBe(true);
    });

    it('should accept detailed story', () => {
      const story = "I built an app..."; // 100+ chars
      const validation = validateUserResponse(story, 'initial');
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Stage Progression', () => {
    it('should progress after 2 valid exploration exchanges', async () => {
      const messages = createValidMessages(2, 'exploration');
      const result = await shouldProgressStage(messages, 'exploration');
      expect(result.shouldProgress).toBe(true);
      expect(result.nextStage).toBe('deepening');
    });
  });

  describe('Strength Extraction', () => {
    it('should extract skills with evidence', async () => {
      const conversation = sampleConversation;
      const result = await analyzeStrengths(conversation);
      expect(result.skills.length).toBeGreaterThan(0);
      expect(result.invalid).toBe(false);
    });
  });
});
```

---

## 📊 Success Metrics

### Quantitative

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Token usage/message | <1000 | Console logs |
| API cost/conversation | <$0.04 | Anthropic/OpenAI dashboard |
| Response time | <2.5s | Browser DevTools Network tab |
| Completion rate | >80% | Analytics (users reaching summary) |
| Strengths extracted | 5-8 | Database query |
| Redirect rate | <20% | Count invalid responses / total |

### Qualitative

- [ ] Conversation feels natural (not robotic)
- [ ] AI acknowledges user stories warmly
- [ ] Questions are unique (not repetitive)
- [ ] Summary feels personalized
- [ ] Strengths are specific (not generic)
- [ ] Evidence is clear in summary
- [ ] Career connections are insightful
- [ ] User feels validated and encouraged

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **No Quality-Based Progression**
   - Currently only counts valid messages
   - Doesn't assess depth or detail level
   - May progress too quickly with minimal answers
   - **Planned:** Week 2 implementation

2. **Regex-Based Validation**
   - Can miss subtle deflections
   - May have false positives
   - **Planned:** LLM-based validation (Week 3)

3. **No Conversation Recovery**
   - Doesn't detect stuck conversations
   - No energy/engagement monitoring
   - **Planned:** Week 4 implementation

4. **Limited Strength Evidence Linking**
   - Extraction doesn't include quotes
   - No confidence scores yet
   - **Planned:** Week 3 enhancement

---

## 🔄 Rollback Plan

If V2 has critical issues:

```bash
# 1. Restore backups
cp src/lib/services/aiServiceClaude.v1.backup.ts src/lib/services/aiServiceClaude.ts
cp src/lib/prompts/enhancedSystemPrompt.v1.backup.ts src/lib/prompts/enhancedSystemPrompt.ts

# 2. Update import in aiServiceClaude.ts
# Change: import { buildSystemPrompt } from '../prompts/systemPromptV2';
# To: import { ENHANCED_SYSTEM_PROMPT } from '../prompts/enhancedSystemPrompt';

# 3. Revert system prompt usage
# Change: const systemPrompt = buildSystemPrompt(...);
# To: const contextualPrompt = this.buildContextualPrompt(sessionContext);
#     system: ENHANCED_SYSTEM_PROMPT + contextualPrompt

# 4. Test and redeploy
npm run dev
```

---

## 📝 Changelog

### Version 2.0 (2025-09-30)

**Added:**
- Modular stage-specific prompts
- Few-shot examples for strength extraction
- Positive instruction framing
- Clear output format templates
- Persona consistency (Alex the coach)

**Changed:**
- System prompt generation (buildSystemPrompt function)
- Token usage (~50% reduction)
- Temperature for strength extraction (0.3 → 0.2)
- Max tokens for extraction (300 → 400)

**Removed:**
- buildContextualPrompt method (replaced by systemPromptV2)
- Redundant validation rules from prompt
- Negative instruction patterns

**Fixed:**
- Inconsistent output formatting
- Repetitive question patterns
- Generic strength extraction

---

## 🚀 Next Steps

### Week 2: Smart Progression
- [ ] Implement response quality assessment
- [ ] Add depth signal detection
- [ ] Update shouldProgressStage logic
- [ ] Test with various user types

### Week 3: Advanced Features
- [ ] LLM-based validation (optional)
- [ ] Confidence scores for strengths
- [ ] Evidence linking with quotes
- [ ] Enhanced extraction accuracy

### Week 4: Robustness
- [ ] Stuck conversation detection
- [ ] Recovery strategies
- [ ] Energy/engagement monitoring
- [ ] Comprehensive edge case handling

---

## 📞 Support

**Issues?** Check:
1. Browser console for errors
2. Supabase logs for API errors
3. Message validation logic in code
4. Stage progression conditions

**Questions?** Review:
- [PROMPT_ENGINEERING_ANALYSIS.md](./PROMPT_ENGINEERING_ANALYSIS.md)
- [systemPromptV2.ts](../src/lib/prompts/systemPromptV2.ts)
- [aiServiceClaude.ts](../src/lib/services/aiServiceClaude.ts)

---

**Version:** 1.0
**Last Updated:** 2025-09-30
**Status:** Ready for Testing