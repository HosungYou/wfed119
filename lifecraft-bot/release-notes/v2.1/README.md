# Release Notes v2.1

## Release Date: November 28, 2024

## Overview
Version 2.1 addresses critical conversation flow issues and enhances the strength discovery process to ensure more meaningful and comprehensive career guidance.

## Key Improvements

### 1. Conversation Flow Enhancements
- **Fixed premature analysis**: AI now collects 5-6 distinct experiences before providing analysis
- **Response length control**: AI responses limited to 2-4 sentences to maintain natural conversation flow
- **Better stage progression**: Requires more meaningful exchanges before advancing stages
  - Initial → Exploration: After 1 valid story
  - Exploration → Deepening: After 3 valid exchanges
  - Deepening → Analysis: After 5 valid exchanges
  - Analysis → Summary: After 7 valid exchanges and 10+ messages

### 2. Strength Extraction Improvements
- **Increased extraction requirements**: Now extracts 5-8 items per category (Skills, Attitudes, Values)
- **More comprehensive analysis**: AI instructed to look deeper for nuanced strengths
- **Better evidence linking**: Each strength must connect to specific conversation examples

### 3. Visualization Enhancements
- **Added zoom controls**: New zoom in/out/reset buttons for the Strength Mind Map
- **Keyboard shortcuts**: Support for +/- keys for zooming, 0 for reset
- **Drag-to-pan**: Mouse drag functionality for navigating large diagrams
- **Smooth transitions**: Added animation for zoom and pan operations

### 4. Prompt Engineering Updates
- **Repetition prevention**: AI tracks shared stories to avoid asking for the same experience twice
- **Clear redirection messages**: Better guidance when users provide invalid responses
- **Stage-specific instructions**: More precise behavioral guidelines for each conversation stage

## Technical Changes

### Modified Files
- `src/lib/prompts/enhancedSystemPrompt.ts`: Updated conversation stage definitions and response guidelines
- `src/lib/services/aiServiceClaude.ts`: Enhanced validation, stage progression, and strength extraction logic
- `src/components/visualization/StrengthMindMap.tsx`: Added zoom controls and pan functionality

### Bug Fixes
- Fixed AI providing analysis too early in the conversation
- Fixed extraction of only 3 items per category instead of requested 5-8
- Fixed missing zoom controls in visualization

## Migration Notes
No database migrations required. All changes are backward compatible.

## Known Issues
None at this time.

## Next Steps
- Monitor conversation quality improvements
- Gather user feedback on new zoom controls
- Consider adding export functionality for strength reports

## Contributors
- Engineering team
- AI optimization team