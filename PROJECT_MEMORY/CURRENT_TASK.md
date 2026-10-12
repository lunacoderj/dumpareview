## Current Objective
Resolve Supabase `401 Unauthorized` (`new row violates row-level security policy for table "profiles"` / `"qr_codes"`) during QR generation.

## Current Status
Completed - Root cause identified (Firebase Auth vs Supabase Auth RLS mismatch). SQL script created and updated in `supabase_schema.sql` to grant necessary table permissions.

## Files Being Worked On
- `supabase_schema.sql`
- `PROJECT_MEMORY/BUGS_AND_FIXES.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`

## Implementation Progress
- [x] Trace error: `42501` returned by PostgREST when inserting into `profiles` and `qr_codes`
- [x] Identify root cause: Supabase RLS policies require `auth.uid() = user_id`, but client authenticates via Firebase Auth so PostgREST executes as role `anon` with `auth.uid() = NULL`
- [x] Update `supabase_schema.sql` with RLS fix scripts
- [x] Prepare step-by-step instructions and SQL snippet for user to execute in Supabase SQL editor
