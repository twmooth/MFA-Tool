/*
  # Set up MFA analysis tables and policies

  1. New Tables
    - `mfa_scenarios` - Stores scenario configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `ratings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `mfa_scenarios` table
    - Add policies for authenticated users to manage their own scenarios
*/

-- Create scenarios table
CREATE TABLE IF NOT EXISTS mfa_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  ratings jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mfa_scenarios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scenarios"
  ON mfa_scenarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenarios"
  ON mfa_scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
  ON mfa_scenarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
  ON mfa_scenarios
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);