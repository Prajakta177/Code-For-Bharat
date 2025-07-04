/*
  # Add Savings Goals Feature

  1. New Tables
    - `savings_goals` - Track monthly savings targets and progress
    
  2. Security
    - Enable RLS on savings_goals table
    - Add policies for authenticated users to access only their own data

  3. Features
    - Monthly savings targets
    - Progress tracking
    - Goal achievement tracking
*/

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    target_amount numeric(10,2) NOT NULL DEFAULT 0,
    saved_amount numeric(10,2) DEFAULT 0,
    is_achieved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT savings_goals_month_check CHECK (month >= 1 AND month <= 12),
    CONSTRAINT savings_goals_year_check CHECK (year >= 2020 AND year <= 2100),
    CONSTRAINT savings_goals_target_check CHECK (target_amount >= 0),
    CONSTRAINT savings_goals_saved_check CHECK (saved_amount >= 0),
    CONSTRAINT fk_savings_goals_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_savings_month_year UNIQUE (user_id, month, year)
);

-- Create indexes for savings_goals table
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_year_month ON savings_goals USING btree (year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_savings_goals_created_at ON savings_goals USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for savings_goals table
CREATE POLICY "Users can read own savings goals"
    ON savings_goals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
    ON savings_goals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
    ON savings_goals
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
    ON savings_goals
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at timestamps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_savings_goals_updated_at'
    ) THEN
        CREATE TRIGGER update_savings_goals_updated_at
            BEFORE UPDATE ON savings_goals
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to update savings goal when balance changes
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
DECLARE
    current_month integer;
    current_year integer;
    remaining_balance numeric(10,2);
    target_amount numeric(10,2);
BEGIN
    -- Get current month and year from the balance record
    current_month := NEW.month;
    current_year := NEW.year;
    remaining_balance := NEW.remaining_balance;

    -- Get the savings target for this month (if exists)
    SELECT target_amount INTO target_amount
    FROM savings_goals 
    WHERE user_id = NEW.user_id
    AND month = current_month 
    AND year = current_year;

    -- If savings goal exists, update the saved amount and achievement status
    IF target_amount IS NOT NULL THEN
        UPDATE savings_goals 
        SET 
            saved_amount = GREATEST(remaining_balance, 0),
            is_achieved = (remaining_balance >= target_amount),
            updated_at = now()
        WHERE user_id = NEW.user_id
        AND month = current_month 
        AND year = current_year;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update savings goal when monthly balance changes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_savings_goal'
    ) THEN
        CREATE TRIGGER trigger_update_savings_goal
            AFTER INSERT OR UPDATE ON monthly_balances
            FOR EACH ROW EXECUTE FUNCTION update_savings_goal();
    END IF;
END $$;