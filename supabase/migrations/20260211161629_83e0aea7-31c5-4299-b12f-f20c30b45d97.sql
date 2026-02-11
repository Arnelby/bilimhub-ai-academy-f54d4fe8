
-- Add leaderboard opt-in column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT false;

-- Drop the existing SELECT policy and recreate with leaderboard support
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view own or leaderboard profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR leaderboard_visible = true);
