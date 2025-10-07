# CLAUDE.md - Release Notes Generation Guide

This file provides instructions for Claude Code to automatically generate comprehensive release notes for WFED119 project deployments.

## Purpose

When creating release notes for this project, Claude Code should follow the structured format defined in [README.md](README.md) to ensure consistency, completeness, and maximum value for developers.

## Target Audience

Release notes are written FOR DEVELOPERS, not end users. They should include:
- Technical implementation details
- Actual code snippets (before/after)
- Database schema changes
- API modifications
- Deployment instructions
- Migration paths

## Automated Generation Process

### Step 1: Gather Context

**Required Information**:
```bash
# Get git commits since last release
git log --oneline --since="YYYY-MM-DD" --until="YYYY-MM-DD"

# Get detailed commits with file changes
git log --stat --since="YYYY-MM-DD"

# Get diff for specific commits
git show COMMIT_HASH

# Get current version
cat package.json | grep version
```

**Extract**:
- Commit hashes
- Commit messages
- Files changed (with line counts)
- Code diffs for major changes

### Step 2: Categorize Changes

**Group commits by type**:
- ✨ **Features**: New functionality, modules, or capabilities
- 🐛 **Bug Fixes**: Corrections to broken functionality
- 🔧 **Technical**: Architecture, refactoring, dependencies
- 📚 **Documentation**: README, guides, comments
- 🚀 **Deployment**: CI/CD, configuration, infrastructure
- 🌍 **Localization**: Translations, i18n
- 🎨 **UI/UX**: Visual design, user experience

### Step 3: Identify Critical Information

**Must Extract**:
1. **Breaking Changes**: Any API/schema/config changes requiring migration
2. **Database Migrations**: New tables, columns, or constraints
3. **Environment Variables**: New or changed configuration
4. **Dependencies**: Updated packages or new requirements
5. **Security**: Authentication, authorization, or data protection changes

### Step 4: Generate Release Notes

**Use this template structure**:

```markdown
# Release Notes vX.Y.Z - [Clear Descriptive Title]

**Release Date**: YYYY-MM-DD
**Priority**: [Low | Medium | High | Critical]
**Type**: [Feature | Enhancement | Bug Fix | Security | Localization]

---

## 🎯 Overview

[2-3 paragraph summary of the release]
- What changed
- Why it changed
- Impact on users/developers

---

## ✨ Major Features

### 1) [Feature Name]
**What Changed**: [Description]
**Why**: [Justification]
**Commits**: `hash1`, `hash2`

**Files Changed**:
\`\`\`typescript
src/path/to/file1.ts
src/path/to/file2.tsx
\`\`\`

**Implementation** ([file.ts:line](file.ts#Lline)):
\`\`\`typescript
// Before
[old code]

// After
[new code]
\`\`\`

**Usage Example**:
\`\`\`typescript
[how to use]
\`\`\`

---

## 🐛 Bug Fixes

### 1) [Bug Name]
**Problem**: [What was broken]
**Root Cause**: [Why it was broken]
**Resolution**: [How fixed]
**Commits**: `hash`

**Fix** ([file.ts:line](file.ts#Lline)):
\`\`\`typescript
// Before (broken)
[old code]

// After (fixed)
[new code]
\`\`\`

---

## 🔧 Technical Changes

[Bulleted list of technical modifications]
- Architecture changes
- API updates
- Database schema changes
- Performance improvements

---

## 🚀 Deployment Checklist

### Supabase Setup (If database changes)
1. **Run Migration**: Execute \`database/migrations/FILE.sql\`
2. **Verify**: Check tables/indexes created
3. **Test**: Run sample queries

### Render Configuration (If deployment changes)
1. **Environment Variables**:
   - \`VAR_NAME\`: Description
2. **Build Command**: \`command here\`
3. **Start Command**: \`command here\`

### Local Development
1. **Environment Setup**:
   \`\`\`bash
   # .env.local
   VAR_NAME=value
   \`\`\`

2. **Install Dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Run Migrations** (if applicable):
   \`\`\`bash
   npm run migrate
   \`\`\`

---

## 🧪 Verification Steps

### [Feature/Module Name]
1. ✅ Step 1 description
2. ✅ Step 2 description
3. ✅ Step 3 description

### Database Persistence (If applicable)
1. **Check Data**:
   \`\`\`sql
   SELECT * FROM table_name WHERE condition;
   \`\`\`

2. **Verify RLS**:
   \`\`\`sql
   SELECT * FROM pg_policies WHERE tablename = 'table_name';
   \`\`\`

---

## ⚠️ Breaking Changes

### 1) [Breaking Change Name]
- **What Changed**: [Description]
- **Action Required**: [What developers must do]
- **Impact**: [Who is affected]
- **Migration**: [Step-by-step migration guide]

---

## 🔮 Known Issues & Limitations

1. **[Issue Name]**:
   - Description
   - Workaround (if any)
   - Future fix planned

---

## 📊 Code Statistics

**Files Changed**: N files
- **Modified**: N files
- **Added**: N files
- **Lines Added**: N
- **Lines Removed**: N

**Commits in This Release**:
1. \`hash1\` - Commit message 1
2. \`hash2\` - Commit message 2

---

## 📚 Developer Notes

### Working with [New Feature]

[Instructions for developers]

**Module Structure**:
\`\`\`
directory/
├── file1.ts
├── file2.tsx
└── file3.ts
\`\`\`

**API Routes**:
\`\`\`
api/
├── route1/route.ts
└── route2/route.ts
\`\`\`

### Adding New [Feature Component]

[Step-by-step guide with code examples]

### Testing [Feature]

[Testing instructions and strategies]

### Debugging [Common Issues]

[Troubleshooting guide]

---

## 🙏 Acknowledgments

- [List of major contributions]
- [Special thanks]

---

## 📞 Support

For issues or questions:
- **GitHub Issues**: [repository URL]/issues
- **Documentation**: See \`release-notes/README.md\`

---

**🚀 Happy Deploying!**
```

### Step 5: Code Examples Best Practices

**ALWAYS Include**:

1. **File Paths as Links**:
   ```markdown
   **Implementation** ([src/app/api/route.ts:42](src/app/api/route.ts#L42)):
   ```

2. **Before/After Comparisons**:
   ```typescript
   // Before: Next.js 14 sync cookies
   export function GET() {
     const cookieStore = cookies()
     return NextResponse.json({ data })
   }

   // After: Next.js 15 async cookies
   export async function GET() {
     const cookieStore = await cookies()
     return NextResponse.json({ data })
   }
   ```

3. **Actual Production Code** (not pseudocode):
   - Copy real code from files
   - Include imports if relevant
   - Show complete functions when needed

4. **Context Comments**:
   ```typescript
   // Fixed: Authentication now checks dev mode
   const auth = checkDevAuth(session);
   if (!requireAuth(auth)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

### Step 6: Verification

**Before Publishing**:
- [ ] Test all code examples
- [ ] Verify commit hashes are correct
- [ ] Check file paths exist
- [ ] Validate SQL migrations (if applicable)
- [ ] Review deployment checklist completeness
- [ ] Ensure breaking changes are clear
- [ ] Confirm version number follows semver

## Special Instructions for Claude Code

### When Asked to Create Release Notes:

1. **Automatically gather git information**:
   ```bash
   git log --oneline --since="[last release date]"
   git diff [last version tag]..HEAD --stat
   ```

2. **Read modified files** to extract actual code:
   ```bash
   # For each major change, read the file
   Read file at path with context around changed lines
   ```

3. **Check for breaking changes**:
   - Database schema modifications
   - API signature changes
   - Environment variable changes
   - Configuration updates

4. **Generate comprehensive examples**:
   - For each major change, include before/after code
   - Show actual implementation, not abstractions
   - Include file paths and line numbers

5. **Create deployment guide**:
   - List all new environment variables
   - Document migration steps
   - Provide verification queries/commands

### Version Numbering Logic

**Automatically determine version increment**:

```python
def determine_version_increment(changes):
    if has_breaking_changes(changes):
        return "MAJOR"  # X.0.0
    elif has_new_features(changes):
        return "MINOR"  # X.Y.0
    else:
        return "PATCH"  # X.Y.Z

def has_breaking_changes(changes):
    return any([
        "database schema" in changes,
        "API signature" in changes,
        "breaking:" in commit_messages,
        "removed deprecated" in changes
    ])

def has_new_features(changes):
    return any([
        "feat:" in commit_messages,
        "new feature" in changes,
        "add:" in commit_messages
    ])
```

### File Path References

**Always use relative paths from project root**:
- ✅ `src/app/api/route.ts`
- ❌ `/Users/hosung/project/src/app/api/route.ts`
- ❌ `route.ts` (too vague)

**Link to GitHub** (optional):
```markdown
[src/app/api/route.ts:42](https://github.com/HosungYou/wfed119/blob/main/src/app/api/route.ts#L42)
```

### Migration SQL Blocks

**Format database migrations**:
```markdown
**Migration File** (\`database/migrations/create-table-name.sql\`):
\`\`\`sql
CREATE TABLE IF NOT EXISTS public.table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_table_name_user_id ON public.table_name(user_id);

ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
\`\`\`
```

## Quality Standards

### Minimum Requirements

**Every release note MUST include**:
1. Clear overview (2-3 paragraphs)
2. At least one code example per major change
3. Complete deployment checklist
4. Verification steps
5. Code statistics with commit hashes
6. Developer notes section

### Excellent Release Notes Include:
- 5+ detailed code examples
- Before/after comparisons for all changes
- Complete migration guide
- Testing strategies
- Troubleshooting section
- Known issues and workarounds
- Future roadmap hints

### Avoid:
- Vague descriptions without code
- Missing file paths
- Untested code examples
- Incomplete deployment steps
- Missing breaking changes warnings

## Example Workflow

**User Request**:
```
"Create release notes for v2.6.1 with all changes since v2.6.0"
```

**Claude Code Actions**:
1. Run `git log v2.6.0..HEAD --oneline`
2. Read each modified file to get code context
3. Identify feature changes, bug fixes, technical changes
4. Extract before/after code for major changes
5. Check for database migrations
6. Document environment variable changes
7. Generate comprehensive release notes following template
8. Save as `release-notes/v2.6.1.md`
9. Update `release-notes/README.md` with new version
10. Create git commit with release notes

## Output Location

**File**: `release-notes/vX.Y.Z.md`
**Naming**: Semantic versioning (e.g., `v2.6.1.md`)
**Format**: Markdown with proper headings and code blocks

## Related Files

- [README.md](README.md) - Release notes directory overview
- [v2.6.1.md](v2.6.1.md) - Example of comprehensive release notes
- [v2.3.2.md](v2.3.2.md) - Example of bug fix release notes

---

**📝 This file is designed to be read by Claude Code for automated release note generation. Follow these instructions exactly to maintain consistency across all releases.**

**🤖 Generated with Claude Code assistance**
**📅 Last Updated**: October 7, 2025
**✍️ Author**: WFED 119 Development Team
