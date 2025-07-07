/*
  # Fix ambiguous column reference in update_savings_goal function

  1. Problem
    - The `update_savings_goal()` trigger function has ambiguous column references
    - When querying monthly_balances, PostgreSQL can't determine which table "target_amount" refers to
    - This causes the monthly_balances queries to fail

  2. Solution
    - Recreate the `update_savings_goal()` function with proper table aliases
    - Ensure all column references are properly qualified
    - Fix any ambiguous references between monthly_balances and savings_goals tables
*/

-- Drop and recreate the update_savings_goal function with proper column qualification
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the saved_amount in savings_goals based on remaining_balance from monthly_balances
  UPDATE savings_goals sg
  SET 
    saved_amount = GREATEST(0, NEW.remaining_balance),
    is_achieved = (GREATEST(0, NEW.remaining_balance) >= sg.target_amount),
    updated_at = now()
  WHERE sg.user_id = NEW.user_id 
    AND sg.month = NEW.month 
    AND sg.year = NEW.year;

  -- If no savings goal exists for this month/year, create one with default target
  IF NOT FOUND THEN
    INSERT INTO savings_goals (user_id, month, year, target_amount, saved_amount, is_achieved)
    VALUES (
      NEW.user_id, 
      NEW.month, 
      NEW.year, 
      0, 
      GREATEST(0, NEW.remaining_balance),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;