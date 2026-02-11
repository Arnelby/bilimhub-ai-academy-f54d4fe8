
-- Drop existing restrictive INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate as permissive, scoped to authenticated only
CREATE POLICY "Users can insert their own profile"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
