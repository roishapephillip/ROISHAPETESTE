/*
# Fix infinite recursion in profiles RLS policies

## Problem
Several RLS policies on `profiles` (and other tables) contained
`EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')`.
Because RLS is enabled on `profiles`, that inner SELECT itself was subject to the
`profiles_select_own_or_related` policy — which *also* subqueried `profiles` —
causing infinite recursion: "infinite recursion detected in policy for relation profiles".

## Solution
1. Create a `SECURITY DEFINER` function `public.is_role(role_name text)` that reads
   the caller's profile row with the function-owner's privileges (bypassing RLS).
   This breaks the recursion: the function reads `profiles` without re-triggering
   the `profiles` RLS policies.
2. Rewrite every policy that subqueried `profiles` to call `is_role(...)` instead.

## Affected tables / policies
- `profiles`: select, insert (student-by-personal)
- `exercises`: insert, update, delete (admin checks)
- `workouts`: insert, update, delete (admin checks)
- `workout_exercises`: insert, update, delete (admin checks)

## Security
- `is_role()` is `SECURITY DEFINER`, `LANGUAGE sql`, `STABLE`, `SET search_path = public`.
  It only reads a single row by `auth.uid()` and returns a boolean — no side effects.
- All policies keep the same access semantics; only the implementation changes.
*/

-- ============================================================
-- 1. SECURITY DEFINER helper that reads the caller's role
--    without triggering RLS on profiles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = role_name
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_role(text) TO authenticated, anon;

-- ============================================================
-- 2. profiles — rewrite recursive policies
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own_or_related" ON profiles;
CREATE POLICY "profiles_select_own_or_related"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR assigned_personal_id = auth.uid()
  OR public.is_role('admin')
);

DROP POLICY IF EXISTS "profiles_insert_student_by_personal" ON profiles;
CREATE POLICY "profiles_insert_student_by_personal"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  (public.is_role('admin') OR public.is_role('personal'))
  AND assigned_personal_id = auth.uid()
);

-- profiles_insert_self, profiles_update_own, profiles_update_students are fine as-is.

-- ============================================================
-- 3. exercises — replace admin subqueries
-- ============================================================
DROP POLICY IF EXISTS "exercises_insert_admin" ON exercises;
CREATE POLICY "exercises_insert_admin"
ON exercises FOR INSERT
TO authenticated
WITH CHECK (public.is_role('admin'));

DROP POLICY IF EXISTS "exercises_update_admin" ON exercises;
CREATE POLICY "exercises_update_admin"
ON exercises FOR UPDATE
TO authenticated
USING (public.is_role('admin'))
WITH CHECK (public.is_role('admin'));

DROP POLICY IF EXISTS "exercises_delete_admin" ON exercises;
CREATE POLICY "exercises_delete_admin"
ON exercises FOR DELETE
TO authenticated
USING (public.is_role('admin'));

-- ============================================================
-- 4. workouts — replace admin subqueries
-- ============================================================
DROP POLICY IF EXISTS "workouts_insert_personal" ON workouts;
CREATE POLICY "workouts_insert_personal"
ON workouts FOR INSERT
TO authenticated
WITH CHECK (personal_id = auth.uid() OR public.is_role('admin'));

DROP POLICY IF EXISTS "workouts_update_personal" ON workouts;
CREATE POLICY "workouts_update_personal"
ON workouts FOR UPDATE
TO authenticated
USING (personal_id = auth.uid() OR public.is_role('admin'))
WITH CHECK (personal_id = auth.uid() OR public.is_role('admin'));

DROP POLICY IF EXISTS "workouts_delete_personal" ON workouts;
CREATE POLICY "workouts_delete_personal"
ON workouts FOR DELETE
TO authenticated
USING (personal_id = auth.uid() OR public.is_role('admin'));

-- ============================================================
-- 5. workout_exercises — replace admin subqueries
-- ============================================================
DROP POLICY IF EXISTS "workout_exercises_insert_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_insert_via_workout"
ON workout_exercises FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid() OR public.is_role('admin'))
  )
);

DROP POLICY IF EXISTS "workout_exercises_update_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_update_via_workout"
ON workout_exercises FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid() OR public.is_role('admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid() OR public.is_role('admin'))
  )
);

DROP POLICY IF EXISTS "workout_exercises_delete_via_workout" ON workout_exercises;
CREATE POLICY "workout_exercises_delete_via_workout"
ON workout_exercises FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_exercises.workout_id
      AND (w.personal_id = auth.uid() OR public.is_role('admin'))
  )
);
