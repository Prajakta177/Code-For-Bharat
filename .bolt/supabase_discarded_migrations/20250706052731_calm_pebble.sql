/*
  # Fix ambiguous column reference in update_savings_goal function

  1. Problem
    - The `update_savings_goal()` function has an ambiguous reference to `target_amount`
    - This causes queries to `monthly_balances` to fail with error 42702
    - The function likely joins `monthly_balances` and `savings_goals` tables

  2. Solution
    - Recreate the `update_savings_goal()` function with properly qualified column references
    - Ensure all column references specify the table name or alias
    - Update the `saved_amount` in `savings_goals` based on `remaining_balance` from `monthly_balances`
*/

-- Drop and recreate the update_savings_goal function with proper column qualification
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the saved_amount in savings_goals table based on the remaining_balance
  -- Only update if there's a positive remaining balance
  UPDATE savings_goals 
  SET 
    saved_amount = CASE 
      WHEN NEW.remaining_balance > 0 THEN NEW.remaining_balance
      ELSE 0
    END,
    is_achieved = CASE 
      WHEN NEW.remaining_balance >= savings_goals.target_amount THEN true
      ELSE false
    END,
    updated_at = now()
  WHERE savings_goals.user_id = NEW.user_id 
    AND savings_goals.month = NEW.month 
    AND savings_goals.year = NEW.year;

  -- If no savings goal exists for this month/year, create one with default target
  IF NOT FOUND THEN
    INSERT INTO savings_goals (
      user_id, 
      month, 
      year, 
      target_amount, 
      saved_amount, 
      is_achieved
    ) VALUES (
      NEW.user_id,
      NEW.month,
      NEW.year,
      GREATEST(NEW.remaining_balance * 0.2, 100), -- Default to 20% of remaining balance or $100, whichever is higher
      CASE WHEN NEW.remaining_balance > 0 THEN NEW.remaining_balance ELSE 0 END,
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;