-- Feature 06 repair: backfill profiles for users created before the trigger.
INSERT INTO public.profiles (id, email, is_complete, created_at, updated_at)
SELECT
  users.id,
  users.email,
  false,
  now(),
  now()
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;
