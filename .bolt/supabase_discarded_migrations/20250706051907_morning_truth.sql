/*
  # Fix ambiguous column reference in database functions

  This migration addresses the "column reference 'target_amount' is ambiguous" error
  by updating the database functions to properly qualify column names.

  ## Changes Made
  1. Update the update_savings_goal() function to properly qualify column references
  2. Update the update_monthly_balance() function to properly qualify column references
  3. Ensure all column references are explicitly qualified with table names

  ## Background
  The error occurs because database functions/triggers are joining tables without
  properly qualifying column names, causing PostgreSQL to be unable to determine
  which table's column is being referenced.
*/

-- Drop existing functions to recreate them with proper column qualification
DROP FUNCTION IF EXISTS update_savings_goal();
DROP FUNCTION IF EXISTS update_monthly_balance();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the update_monthly_balance function with proper column qualification
CREATE OR REPLACE FUNCTION update_monthly_balance()
RETURNS TRIGGER AS $$
DECLARE
    expense_month INTEGER;
    expense_year INTEGER;
    total_amount NUMERIC(10,2);
BEGIN
    -- Extract month and year from the expense date
    IF TG_OP = 'DELETE' THEN
        expense_month := EXTRACT(MONTH FROM OLD.date);
        expense_year := EXTRACT(YEAR FROM OLD.date);
    ELSE
        expense_month := EXTRACT(MONTH FROM NEW.date);
        expense_year := EXTRACT(YEAR FROM NEW.date);
    END IF;

    -- Calculate total expenses for the month
    SELECT COALESCE(SUM(e.amount), 0) INTO total_amount
    FROM expenses e
    WHERE e.user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND EXTRACT(MONTH FROM e.date) = expense_month
      AND EXTRACT(YEAR FROM e.date) = expense_year;

    -- Update or insert monthly balance
    INSERT INTO monthly_balances (user_id, month, year, monthly_income, total_expenses, remaining_balance)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        expense_month,
        expense_year,
        0,
        total_amount,
        0 - total_amount
    )
    ON CONFLICT (user_id, month, year)
    DO UPDATE SET
        total_expenses = total_amount,
        remaining_balance = monthly_balances.monthly_income - total_amount,
        updated_at = CURRENT_TIMESTAMP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the update_savings_goal function with proper column qualification
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
DECLARE
    current_saved NUMERIC(10,2);
BEGIN
    -- Calculate saved amount (remaining balance if positive, 0 if negative)
    current_saved := GREATEST(NEW.remaining_balance, 0);

    -- Update or insert savings goal
    INSERT INTO savings_goals (user_id, month, year, target_amount, saved_amount, is_achieved)
    VALUES (
        NEW.user_id,
        NEW.month,
        NEW.year,
        0,
        current_saved,
        false
    )
    ON CONFLICT (user_id, month, year)
    DO UPDATE SET
        saved_amount = current_saved,
        is_achieved = (current_saved >= savings_goals.target_amount AND savings_goals.target_amount > 0),
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate all triggers with the updated functions
DROP TRIGGER IF EXISTS update_monthly_balances_updated_at ON monthly_balances;
DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS trigger_update_monthly_balance ON expenses;
DROP TRIGGER IF EXISTS trigger_update_savings_goal ON monthly_balances;

-- Recreate updated_at triggers
CREATE TRIGGER update_monthly_balances_updated_at
    BEFORE UPDATE ON monthly_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate business logic triggers
CREATE TRIGGER trigger_update_monthly_balance
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_balance();

CREATE TRIGGER trigger_update_savings_goal
    AFTER INSERT OR UPDATE ON monthly_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_savings_goal();