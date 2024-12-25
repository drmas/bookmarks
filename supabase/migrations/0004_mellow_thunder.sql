/*
  # Add summary column to bookmarks table

  1. Changes
    - Add `summary` column to `bookmarks` table to store AI-generated summaries
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookmarks' AND column_name = 'summary'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN summary text;
  END IF;
END $$;