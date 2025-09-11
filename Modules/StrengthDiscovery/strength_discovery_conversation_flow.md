# Strength Discovery Conversation Flow

## Based on LifeCraft Pages 46-50

### Stage 1: Initial Story Prompt

**Bot Opening:**
```
Welcome to your Strength Discovery Journey! 

I'm here to help you identify your unique strengths through your own stories of success and satisfaction.

Let's begin with this:

"Think about a time when you felt great satisfaction from your work or an activity. 
This should be a result of your own efforts - something you actively participated in creating or achieving.

Please share this experience from beginning to end:
- What did you do?
- How did you approach it?
- What emotions did you feel throughout the process?"

Take your time and share as much detail as you're comfortable with.
```

### Stage 2: Socratic Follow-up Questions

**Context-Aware Question Bank:**

For Achievement-Related Stories:
- "What specifically about achieving this made you feel satisfied?"
- "What obstacles did you overcome, and how?"
- "What drove you to persist when things got difficult?"
- "How did you know this was important to you?"

For Relationship-Related Stories:
- "What role did you play in this situation?"
- "How did you approach helping or connecting with others?"
- "What made this interaction meaningful to you?"
- "What did you learn about yourself through this experience?"

For Creative/Innovation Stories:
- "What inspired your approach?"
- "How did you develop your solution?"
- "What made you think differently about this problem?"
- "How did it feel when your idea came to life?"

For Leadership/Influence Stories:
- "How did you mobilize others?"
- "What was your vision for the outcome?"
- "How did you handle resistance or challenges?"
- "What leadership style emerged naturally for you?"

### Stage 3: Pattern Recognition

**Deepening Questions:**
- "I notice you mentioned [specific action/feeling]. Can you tell me more about that?"
- "You seem to have a pattern of [observed behavior]. How does this show up in other areas of your life?"
- "What would you say is the common thread in how you approach challenges?"
- "If you had to describe your 'signature move' in this story, what would it be?"

### Stage 4: Strength Categorization

**Values Exploration:**
- "What core belief or principle guided your actions?"
- "What matters most to you in this story?"
- "What would have been compromised if you hadn't acted?"

**Attitudes Investigation:**
- "What was your mindset throughout this experience?"
- "How would you describe your approach?"
- "What attitude helped you succeed?"

**Competencies Identification:**
- "What specific skills did you use?"
- "What abilities made this possible?"
- "What would others say you're good at based on this story?"

### Stage 5: Synthesis and Visualization

**Summary Framework:**
```
Based on your story, here are the strengths I've identified:

VALUES (What drives you):
• [Value 1]: [Brief explanation from story]
• [Value 2]: [Brief explanation from story]
• [Value 3]: [Brief explanation from story]

ATTITUDES (How you approach challenges):
• [Attitude 1]: [Example from story]
• [Attitude 2]: [Example from story]
• [Attitude 3]: [Example from story]

COMPETENCIES (What you're skilled at):
• [Competency 1]: [How it showed up]
• [Competency 2]: [How it showed up]
• [Competency 3]: [How it showed up]

EMERGING THEMES:
• [Theme 1]: [Pattern across categories]
• [Theme 2]: [Pattern across categories]
```

### Stage 6: Reflection and Integration

**Closing Questions:**
- "How do these strengths connect to your career aspirations?"
- "Where else in your life do you see these strengths appearing?"
- "How might you intentionally use these strengths moving forward?"
- "What surprised you about what we discovered?"

## Human-in-the-Loop Decision Points

### When to Probe Deeper:
- Student gives surface-level response
- Emotional significance is mentioned but not explored
- Pattern emerges that needs clarification
- Contradiction or complexity appears

### When to Move Forward:
- Student has shared sufficient detail
- Clear strengths have emerged
- Student shows signs of fatigue
- Natural transition point reached

### When to Offer Support:
- Student shares difficult experience
- Emotional response is strong
- Student expresses doubt or confusion
- Encouragement would enhance engagement

## Adaptive Response Templates

### For Encouraging Elaboration:
- "That's fascinating! Can you paint me a fuller picture of..."
- "I'm curious about the moment when..."
- "Help me understand what was happening when..."
- "What was going through your mind at that point?"

### For Validation:
- "That shows real [strength] on your part."
- "I can see how important [value] is to you."
- "Your [competency] really shined through there."
- "That must have been [emotion] for you."

### For Pattern Recognition:
- "I'm noticing a theme of [pattern]..."
- "This connects to what you said earlier about..."
- "There seems to be a thread of [quality] running through your story."
- "You consistently demonstrate [strength] in your approach."

## Technical Implementation Notes

### Prompt Structure for OpenAI:
```javascript
const systemPrompt = `
You are a skilled career counselor using the LifeCraft methodology.
Your role is to guide students through strength discovery via storytelling.

Guidelines:
1. Be warm, encouraging, and genuinely curious
2. Ask one question at a time
3. Build on their responses naturally
4. Look for patterns and themes
5. Categorize strengths into Values, Attitudes, and Competencies
6. Provide specific examples from their story
7. Maintain appropriate boundaries
8. Be culturally sensitive

Current stage: ${currentStage}
Previous responses: ${conversationHistory}
Identified patterns: ${identifiedPatterns}
`;
```

### State Management:
```javascript
interface ConversationState {
  stage: 'initial' | 'exploration' | 'deepening' | 'categorization' | 'synthesis';
  storyElements: {
    situation: string;
    actions: string[];
    emotions: string[];
    outcomes: string;
  };
  identifiedStrengths: {
    values: StrengthItem[];
    attitudes: StrengthItem[];
    competencies: StrengthItem[];
  };
  themes: string[];
  questionCount: number;
  userEngagement: 'high' | 'medium' | 'low';
}
```

## Alignment with Course Objectives

### Week 1 Learning Objectives:
- CLO 1: Explore personal dimensions of wellness through self-discovery
- CLO 2: Describe impact on emotional, social, and occupational well-being
- CLO 3: Develop holistic understanding by integrating personal values

### Connection to Theory:
- **Human Agency (Bandura)**: Identifying self-efficacy through past successes
- **Hope Theory (Snyder)**: Recognizing pathways and agency through stories
- **Career Construction (Savickas)**: Building vocational self-concept through narrative

## Quality Assurance Checklist

- [ ] Initial prompt creates safe, inviting space
- [ ] Questions flow naturally from responses
- [ ] Adequate depth achieved before categorization
- [ ] All three strength categories addressed
- [ ] Patterns and themes identified
- [ ] Results clearly presented and explained
- [ ] Connection to broader course context made
- [ ] Student feels heard and validated
- [ ] Actionable insights provided
- [ ] Data handled appropriately