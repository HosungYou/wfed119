-- Create admin user if doesn't exist
-- Replace the email and googleId with actual values

-- Check if user exists
DO $$
BEGIN
    -- Insert admin user if not exists
    INSERT INTO "public"."User" (id, "googleId", email, name, role, "isActive", "createdAt", "updatedAt")
    VALUES (
        gen_random_uuid(),
        'REPLACE_WITH_ACTUAL_GOOGLE_SUB',  -- This should be the actual Google sub from OAuth
        'REPLACE_WITH_ADMIN_EMAIL',        -- This should be the admin email
        'Admin User',
        'SUPER_ADMIN',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT ("googleId") DO UPDATE SET
        role = 'SUPER_ADMIN',
        "isActive" = true,
        "updatedAt" = NOW();

    RAISE NOTICE 'Admin user setup completed';
END $$;