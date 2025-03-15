/*
  # Add analyses table for storing MFA analysis results

  1. New Tables
    - `analyses` - Stores MFA analysis results
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Name of the analysis
      - `description` (text) - Optional description
      - `attributes` (jsonb) - Attribute weights and settings
      - `scenarios` (jsonb) - Scenario configurations and ratings
      - `results` (jsonb) - Calculated results and rankings
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `analyses` table
    - Add policies for authenticated users to manage their own analyses
*/

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  attributes jsonb NOT NULL,
  scenarios jsonb NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analyses"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
  ON analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);