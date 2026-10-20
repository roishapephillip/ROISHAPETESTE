/*
# Allow Personal Trainers to manage the exercise library

## Objective
Enable authenticated Personal Trainers to add and edit exercises used in the
Fullbody ROI SHAPE method, while preserving the existing admin access.

## Modified table
- `public.exercises`: write permissions now include users whose profile role is
  `personal` or `admin`. Existing exercise rows and all columns are unchanged.

## Security
- RLS remains enabled on `public.exercises`.
- SELECT remains available to authenticated users so Personal Trainers and
  students can use the library.
- INSERT, UPDATE and DELETE remain blocked for unauthenticated users and are
  allowed only when the caller role is `personal` or `admin`.
- Role checks use the existing `public.is_role(text)` SECURITY DEFINER helper,
  avoiding recursive reads of `profiles` inside an RLS policy.
*/

DROP POLICY IF EXISTS "exercises_insert_admin" ON public.exercises;
CREATE POLICY "exercises_insert_personal_or_admin"
ON public.exercises FOR INSERT
TO authenticated
WITH CHECK (public.is_role('personal') OR public.is_role('admin'));

DROP POLICY IF EXISTS "exercises_update_admin" ON public.exercises;
CREATE POLICY "exercises_update_personal_or_admin"
ON public.exercises FOR UPDATE
TO authenticated
USING (public.is_role('personal') OR public.is_role('admin'))
WITH CHECK (public.is_role('personal') OR public.is_role('admin'));

DROP POLICY IF EXISTS "exercises_delete_admin" ON public.exercises;
CREATE POLICY "exercises_delete_personal_or_admin"
ON public.exercises FOR DELETE
TO authenticated
USING (public.is_role('personal') OR public.is_role('admin'));
