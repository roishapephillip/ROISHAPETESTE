/*
# Harden trigger functions

1. Set search_path on update_updated_at to avoid mutable search_path warning.
2. Revoke EXECUTE on handle_new_user from anon and authenticated so the SECURITY DEFINER
   trigger function cannot be invoked directly via the REST API. It is only meant to run
   as a trigger on auth.users inserts.
*/

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
