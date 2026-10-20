/*
# Force password change on first student login

## Objective
When a Personal Trainer creates a student with a default/temporary password,
the student must change it on first login before accessing the app.

## Changes
- `profiles.must_change_password` (boolean, NOT NULL, default false):
  flag set to `true` when a student is created via the Personal's create-student
  flow. The frontend checks this after login and shows a "change password"
  screen before granting access.

## Security
- The column is written by the edge function (service role) during student
  creation, and cleared by the student themselves through their own profile
  update (already allowed by `profiles_update_own` RLS policy).
- No new RLS policies needed: existing profile policies cover read/update.
- No data is lost: existing rows get the default `false` value.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;