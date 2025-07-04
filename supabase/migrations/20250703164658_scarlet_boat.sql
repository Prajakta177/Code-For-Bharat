/*
  # Add Balance Tracking System

  1. New Tables
    - `monthly_balances` - Track monthly income/allowance and balance history
    
  2. Security
    - Enable RLS on monthly_balances table
    - Add policies for authenticated users to access only their own data

  3. Features
    - Monthly income tracking
    - Balance history
    - Automatic balance calculations
*/

-- Create monthly_balances table
CREATE TABLE IF NOT EXISTS monthly_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    monthly_income numeric(10,2) NOT NULL DEFAULT 0,
    total_expenses numeric(10,2) DEFAULT 0,
    remaining_balance numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT monthly_balances_month_check CHECK (month >= 1 AND month <= 12),
    CONSTRAINT monthly_balances_year_check CHECK (year >= 2020 AND year <= 2100),
    CONSTRAINT monthly_balances_income_check CHECK (monthly_income >= 0),
    CONSTRAINT fk_monthly_balances_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_month_year UNIQUE (user_id, month, year)
);

-- Create indexes for monthly_balances table
CREATE INDEX IF NOT EXISTS idx_monthly_balances_user_id ON monthly_balances USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_balances_year_month ON monthly_balances USING btree (year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_balances_created_at ON monthly_balances USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_balances table
CREATE POLICY "Users can read own monthly balances"
    ON monthly_balances
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly balances"
    ON monthly_balances
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly balances"
    ON monthly_balances
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly balances"
    ON monthly_balances
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at timestamps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_monthly_balances_updated_at'
    ) THEN
        CREATE TRIGGER update_monthly_balances_updated_at
            BEFORE UPDATE ON monthly_balances
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to update monthly balance when expenses change
CREATE OR REPLACE FUNCTION update_monthly_balance()
RETURNS TRIGGER AS $$
DECLARE
    expense_month integer;
    expense_year integer;
    total_month_expenses numeric(10,2);
    current_income numeric(10,2);
BEGIN
    -- Extract month and year from expense date
    IF TG_OP = 'DELETE' THEN
        expense_month := EXTRACT(MONTH FROM OLD.date);
        expense_year := EXTRACT(YEAR FROM OLD.date);
    ELSE
        expense_month := EXTRACT(MONTH FROM NEW.date);
        expense_year := EXTRACT(YEAR FROM NEW.date);
    END IF;

    -- Calculate total expenses for the month
    SELECT COALESCE(SUM(amount), 0) INTO total_month_expenses
    FROM expenses 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND EXTRACT(MONTH FROM date) = expense_month
    AND EXTRACT(YEAR FROM date) = expense_year;

    -- Get current monthly income (create record if doesn't exist)
    SELECT monthly_income INTO current_income
    FROM monthly_balances 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND month = expense_month 
    AND year = expense_year;

    -- If no monthly balance record exists, create one
    IF current_income IS NULL THEN
        current_income := 0;
        INSERT INTO monthly_balances (user_id, month, year, monthly_income, total_expenses, remaining_balance)
        VALUES (
            COALESCE(NEW.user_id, OLD.user_id), 
            expense_month, 
            expense_year, 
            0, 
            total_month_expenses, 
            0 - total_month_expenses
        )
        ON CONFLICT (user_id, month, year) DO NOTHING;
    ELSE
        -- Update existing record
        UPDATE monthly_balances 
        SET 
            total_expenses = total_month_expenses,
            remaining_balance = monthly_income - total_month_expenses,
            updated_at = now()
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND month = expense_month 
        AND year = expense_year;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update monthly balance when expenses change
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_monthly_balance'
    ) THEN
        CREATE TRIGGER trigger_update_monthly_balance
            AFTER INSERT OR UPDATE OR DELETE ON expenses
            FOR EACH ROW EXECUTE FUNCTION update_monthly_balance();
    END IF;
END $$;