/*
  # Add bookmark insert policy

  1. Changes
    - Add RLS policy to allow authenticated users to insert bookmarks with their user_id
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;

-- Create new policy
CREATE POLICY "Users can create bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);