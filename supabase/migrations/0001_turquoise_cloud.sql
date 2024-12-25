/*
  # Bookmark Manager Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `username` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text)
      - `updated_at` (timestamp)
    
    - `folders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `user_id` (uuid) - references profiles
      - `parent_id` (uuid, nullable) - for nested folders
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `bookmarks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `url` (text)
      - `description` (text)
      - `folder_id` (uuid) - references folders
      - `user_id` (uuid) - references profiles
      - `favicon` (text)
      - `last_checked` (timestamp)
      - `is_valid` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid) - references profiles
      - `created_at` (timestamp)
    
    - `bookmark_tags`
      - Junction table for bookmarks and tags
      - `bookmark_id` (uuid) - references bookmarks
      - `tag_id` (uuid) - references tags
    
    - `reading_list`
      - `id` (uuid, primary key)
      - `bookmark_id` (uuid) - references bookmarks
      - `user_id` (uuid) - references profiles
      - `priority` (int)
      - `read_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for shared bookmarks
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Create folders table
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  parent_id uuid REFERENCES folders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  folder_id uuid REFERENCES folders(id),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  favicon text,
  last_checked timestamptz DEFAULT now(),
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tags table
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Create bookmark_tags junction table
CREATE TABLE bookmark_tags (
  bookmark_id uuid REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);

-- Create reading_list table
CREATE TABLE reading_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id uuid REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  priority int DEFAULT 0,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Folders
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Tags
CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Bookmark Tags
CREATE POLICY "Users can view their own bookmark tags"
  ON bookmark_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = bookmark_tags.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own bookmark tags"
  ON bookmark_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = bookmark_tags.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

-- Reading List
CREATE POLICY "Users can view their own reading list"
  ON reading_list FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their reading list"
  ON reading_list FOR ALL
  TO authenticated
  USING (user_id = auth.uid());