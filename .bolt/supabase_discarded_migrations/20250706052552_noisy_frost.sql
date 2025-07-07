/*
  # Fix ambiguous column reference in update_savings_goal function

  1. Problem
    - The `update_savings_goal()` function has an ambiguous reference to `target_amount`
    - This causes queries to `monthly_balances` to fail with "column reference target_amount is ambiguous"

  2. Solution
    - Update the `update_savings_goal()` function to properly qualify column references
    - Ensure all table references are explicit to avoid ambiguity

  3. Changes
    - Recreate the `update_savings_goal()` function with proper table qualifications
    - Fix any ambiguous column references in the function logic
*/

-- Drop and recreate the update_savings_goal function with proper column qualifications
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update saved_amount in savings_goals based on remaining_balance from monthly_balances
  UPDATE savings_goals 
  SET 
    saved_amount = GREATEST(0, NEW.remaining_balance),
    is_achieved = (GREATEST(0, NEW.remaining_balance) >= savings_goals.target_amount),
    updated_at = now()
  WHERE 
    savings_goals.user_id = NEW.user_id 
    AND savings_goals.month = NEW.month 
    AND savings_goals.year = NEW.year;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;