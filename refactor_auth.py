#!/usr/bin/env python3
"""
Batch refactor authentication pattern in API routes
Replaces old pattern with new getVerifiedUser() helper
"""

import re
import sys
from pathlib import Path

def refactor_file(file_path: Path) -> bool:
    """Refactor a single file to use getVerifiedUser()"""
    try:
        content = file_path.read_text()
        original = content

        # Step 1: Add getVerifiedUser to imports
        import_pattern = r"import \{ ([^}]+) \} from '@/lib/supabase-server';"

        def add_get_verified_user(match):
            imports = match.group(1)
            if 'getVerifiedUser' in imports:
                return match.group(0)  # Already imported
            return f"import {{ {imports}, getVerifiedUser }} from '@/lib/supabase-server';"

        content = re.sub(import_pattern, add_get_verified_user, content)

        # Step 2: Replace the auth pattern
        # Pattern 1: Standard getUser pattern
        old_pattern1 = r"""    const supabase = await createServerSupabaseClient\(\);
    // Use getUser\(\) for better security \(authenticates via Auth server\)
    const \{ data: \{ user \}, error: userError \} = await supabase\.auth\.getUser\(\);

    if \(userError \|\| !user\) \{
      return NextResponse\.json\(
        \{ error: ['"]Unauthorized['"] \},
        \{ status: 401 \}
      \);
    \}"""

        new_pattern1 = """    const user = await getVerifiedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();"""

        content = re.sub(old_pattern1, new_pattern1, content, flags=re.MULTILINE)

        # Pattern 2: getUser without immediate rejection (storing in variable)
        old_pattern2 = r"""    const supabase = await createServerSupabaseClient\(\);
    // Use getUser\(\) for better security \(authenticates via Auth server\)
    const \{ data: \{ user \}, error: userError \} = await supabase\.auth\.getUser\(\);"""

        new_pattern2 = """    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();"""

        content = re.sub(old_pattern2, new_pattern2, content, flags=re.MULTILINE)

        # Pattern 3: Alternative placement (supabase after checks)
        old_pattern3 = r"""    const supabase = await createServerSupabaseClient\(\);
    const \{ data: \{ user \}, error: userError \} = await supabase\.auth\.getUser\(\);

    if \(userError \|\| !user\) \{"""

        new_pattern3 = """    const user = await getVerifiedUser();

    if (!user) {"""

        content = re.sub(old_pattern3, new_pattern3, content, flags=re.MULTILINE)

        # If content changed, write it back
        if content != original:
            file_path.write_text(content)
            print(f"✅ Updated: {file_path}")
            return True
        else:
            print(f"⏭️  Skipped: {file_path} (no changes needed)")
            return False

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    """Main refactoring function"""
    files_to_refactor = [
        "src/app/api/admin/database/cleanup/route.ts",
        "src/app/api/admin/database/export/route.ts",
        "src/app/api/admin/database/stats/route.ts",
        "src/app/api/admin/share/route.ts",
        "src/app/api/chat/stream/route.ts",
        "src/app/api/discover/career-options/ai-suggest/route.ts",
        "src/app/api/discover/career-options/analyze-resume/route.ts",
        "src/app/api/discover/career-options/check-prerequisites/route.ts",
        "src/app/api/discover/career-options/session/route.ts",
        "src/app/api/discover/mission/ai-commitments/route.ts",
        "src/app/api/discover/mission/ai-questions/route.ts",
        "src/app/api/discover/mission/ai-roles/route.ts",
        "src/app/api/discover/mission/ai-suggest/route.ts",
        "src/app/api/discover/mission/check-prerequisites/route.ts",
        "src/app/api/discover/mission/context/route.ts",
        "src/app/api/discover/mission/session/route.ts",
        "src/app/api/discover/vision/session/route.ts",
        "src/app/api/dreams/analyze/route.ts",
        "src/app/api/dreams/finalize/route.ts",
        "src/app/api/dreams/generate-suggestions/route.ts",
        "src/app/api/enneagram/answer/route.ts",
        "src/app/api/enneagram/interpret/route.ts",
        "src/app/api/errc/items/[id]/route.ts",
        "src/app/api/errc/items/[id]/steps/route.ts",
        "src/app/api/errc/items/route.ts",
        "src/app/api/errc/reflections/route.ts",
        "src/app/api/errc/session/route.ts",
        "src/app/api/errc/suggestions/route.ts",
        "src/app/api/errc/wellbeing/route.ts",
        "src/app/api/goals/action-plans/route.ts",
        "src/app/api/goals/ai/suggest/route.ts",
        "src/app/api/goals/key-results/route.ts",
        "src/app/api/goals/objectives/route.ts",
        "src/app/api/goals/reflections/route.ts",
        "src/app/api/goals/roles/route.ts",
        "src/app/api/goals/session/route.ts",
        "src/app/api/life-themes/analyze/route.ts",
        "src/app/api/life-themes/responses/route.ts",
        "src/app/api/life-themes/session/route.ts",
        "src/app/api/life-themes/themes/route.ts",
        "src/app/api/swot/auto-fill/route.ts",
        "src/app/api/swot/errc/route.ts",
    ]

    base_path = Path("/Volumes/External SSD/Projects/wfed119")

    updated_count = 0
    for file_rel in files_to_refactor:
        file_path = base_path / file_rel
        if file_path.exists():
            if refactor_file(file_path):
                updated_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")

    print(f"\n✅ Refactoring complete! Updated {updated_count} files.")

if __name__ == "__main__":
    main()
