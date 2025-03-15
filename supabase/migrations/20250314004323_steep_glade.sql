/*
  # Add pairwise matrix column to analyses table

  1. Changes
    - Add `pairwise_matrix` column to `analyses` table to store pairwise comparison data
    - Column type is JSONB to store the matrix as a nested array
    - Default value is NULL since not all analyses will have pairwise data

  2. Security
    - No additional RLS policies needed as the column inherits existing table policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analyses' 
    AND column_name = 'pairwise_matrix'
  ) THEN
    ALTER TABLE analyses 
    ADD COLUMN pairwise_matrix JSONB;
  END IF;
END $$;