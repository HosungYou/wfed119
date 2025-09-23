# Release Notes Guidelines for Claude Code

This file provides specific guidance for generating release notes in the WFED119 project.

## Core Principles

### 1. **Error-First Documentation**
Always prioritize documenting **what was broken** and **how it was fixed** over feature narratives.

```markdown
## 🐛 Critical Deployment Error Fixes

### 1. **Specific Error Name**
**Error**: Exact error message from logs/build output
**Root Cause**: Technical explanation of why the error occurred
**Fix Mechanism**: Code-level changes with before/after examples
**Impact**: What this fix enables/prevents
```

### 2. **Technical Precision Over Marketing**
- Use **technical terminology** and **specific implementation details**
- Include **actual code snippets** showing changes
- Provide **file paths and line numbers** where relevant
- Show **before/after comparisons** for code changes

### 3. **Deployment-Focused Structure**

#### Required Sections (in order):
1. **🐛 Critical Deployment Error Fixes** - Always first if any deployment issues were resolved
2. **🚀 Major Features** - Technical implementation details, not marketing copy
3. **🛠️ Technical Implementation Details** - Architecture and performance changes
4. **📊 Data Structure Changes** - Database schema, API changes, data migration impact
5. **🔧 Deployment Verification** - Build success indicators and validation steps
6. **📋 Technical Summary** - Concise file-level changes and commit info

## Specific Requirements

### Error Documentation Format
```markdown
### N. **Error Category**
**Error**: `Exact error message from build logs`
**Root Cause**: Technical explanation of underlying issue
**Fix Mechanism**:
```language
// Before (problematic code)
old_code_here

// After (fixed code)
new_code_here
```
**Impact**: Direct result of fix (e.g., "Resolved webpack compilation failure")
```

### Feature Documentation Format
```markdown
### Feature Name
**Implementation**: High-level technical approach
**Algorithm**: Key formulas or logic with code syntax
**Data Structure**: Schema changes or new interfaces

#### Core Technical Changes:
```typescript
// Show actual implementation code
// Focus on algorithms, data structures, key functions
```

#### UI Implementation:
- **Specific Change**: Technical description of UI modification
- **CSS/Styling**: Actual class names or styling approach used
- **Component Changes**: React component modifications with specifics
```

### Banned Phrases/Approaches
❌ **Avoid these marketing-style phrases:**
- "Revolutionary system"
- "Quantum leap"
- "Sophisticated instrument"
- "Community impact"
- Excessive emojis in technical sections
- Long narrative descriptions
- User experience marketing copy

✅ **Use these technical approaches:**
- "Algorithm: `function_name(params)`"
- "Fixed: [specific error]"
- "Added: [specific functionality]"
- "Modified: [file_path] line [number]"
- "Database impact: [specific changes]"
- Code examples with language syntax highlighting

### Version Information Requirements
Always include in header:
- **Commit**: Short commit hash (e.g., `572d7f4`)
- **Type**: `Major Feature Release + Critical Bug Fixes` (if both)
- **Files Modified**: Count and list of changed files
- **Tier**: Release tier classification

### Technical Summary Requirements
End every release note with:
```markdown
**Files Modified**: X files
- `path/to/file1` - Brief description of changes
- `path/to/file2` - Brief description of changes

**Algorithmic Achievement**: One-line summary of key technical accomplishment
**Next Release**: Next version number and focus area
```

## Code Examples Standards

### Database/Schema Changes
```typescript
// Always show interface definitions
interface OldInterface {
  // old structure
}

interface NewInterface {
  // new structure with comments explaining changes
}
```

### Algorithm Changes
```typescript
// Old System: Brief description
old_implementation_here

// New System: Brief description
new_implementation_here
```

### Error Fix Examples
```typescript
// Before (error-causing code)
problematic_code_with_comment_explaining_issue

// After (fixed code)
corrected_code_with_comment_explaining_fix
```

## Validation Checklist

Before publishing release notes, verify:

- [ ] All deployment errors documented with exact error messages
- [ ] Code examples use proper syntax highlighting
- [ ] File paths are accurate and complete
- [ ] Technical terminology is precise and correct
- [ ] No marketing fluff or excessive narratives
- [ ] Commit hash and file modification count included
- [ ] Database migration impact clearly explained
- [ ] Build/deployment verification steps listed

## File Naming Convention

Release notes should follow: `vX.Y.Z.md` format

## Integration with Development Workflow

1. **During error resolution**: Document each fix immediately with exact error messages
2. **During feature development**: Note technical implementation details as they're coded
3. **During deployment**: Record build success indicators and any issues encountered
4. **Post-deployment**: Add validation steps and verification results

This approach ensures release notes serve as **technical documentation** rather than **marketing materials**, providing genuine value for debugging, understanding system changes, and maintaining code quality.