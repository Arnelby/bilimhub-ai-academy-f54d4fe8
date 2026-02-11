
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage invite codes" ON public.invite_codes;

-- Create permissive admin-only policy
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
