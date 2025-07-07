/*
  # Create savings_goals table

  1. New Tables
    - `savings_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `month` (integer, 1-12)
      - `year` (integer, 2020-2100)
      - `target_amount` (numeric, >= 0)
      - `saved_amount` (numeric, >= 0, default 0)
      - `is_achieved` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `savings_goals` table
    - Add policies for authenticated users to manage their own savings goals

  3. Indexes
    - Add indexes for performance on user_id, year/month, and created_at
    - Add unique constraint for user_id + month + year combination

  4. Constraints
    - Month must be between 1-12
    - Year must be between 2020-2100
    - Target and saved amounts must be >= 0

  5. Triggers
    - Auto-update updated_at timestamp on record changes
*/

-- Create the savings_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  target_amount numeric(10,2) NOT NULL DEFAULT 0,
  saved_amount numeric(10,2) DEFAULT 0,
  is_achieved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_savings_goals_user_id'
  ) THEN
    ALTER TABLE savings_goals 
    ADD CONSTRAINT fk_savings_goals_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'savings_goals_month_check'
  ) THEN
    ALTER TABLE savings_goals 
    ADD CONSTRAINT savings_goals_month_check 
    CHECK (month >= 1 AND month <= 12);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'savings_goals_year_check'
  ) THEN
    ALTER TABLE savings_goals 
    ADD CONSTRAINT savings_goals_year_check 
    CHECK (year >= 2020 AND year <= 2100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'savings_goals_target_check'
  ) THEN
    ALTER TABLE savings_goals 
    ADD CONSTRAINT savings_goals_target_check 
    CHECK (target_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'savings_goals_saved_check'
  ) THEN
    ALTER TABLE savings_goals 
    ADD CONSTRAINT savings_goals_saved_check 
    CHECK (saved_amount >= 0);
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_user_savings_month_year'
  ) THEN
    ALTER TABLE savings_goals 
    ADD CONSTRAINT unique_user_savings_month_year 
    UNIQUE (user_id, month, year);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_year_month ON savings_goals (year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_savings_goals_created_at ON savings_goals (created_at DESC);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'savings_goals' AND policyname = 'Users can read own savings goals'
  ) THEN
    CREATE POLICY "Users can read own savings goals"
      ON savings_goals
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'savings_goals' AND policyname = 'Users can insert own savings goals'
  ) THEN
    CREATE POLICY "Users can insert own savings goals"
      ON savings_goals
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'savings_goals' AND policyname = 'Users can update own savings goals'
  ) THEN
    CREATE POLICY "Users can update own savings goals"
      ON savings_goals
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'savings_goals' AND policyname = 'Users can delete own savings goals'
  ) THEN
    CREATE POLICY "Users can delete own savings goals"
      ON savings_goals
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_savings_goals_updated_at'
  ) THEN
    CREATE TRIGGER update_savings_goals_updated_at
      BEFORE UPDATE ON savings_goals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;