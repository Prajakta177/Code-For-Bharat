/*
  # Fix ambiguous column reference in update_savings_goal function

  1. Problem
    - The update_savings_goal() function has an ambiguous reference to "target_amount"
    - This causes queries to monthly_balances to fail with column reference error

  2. Solution
    - Update the function to properly qualify column references
    - Ensure all column references specify the correct table name
*/

-- Drop and recreate the update_savings_goal function with proper column qualification
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update savings goal when monthly balance changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Calculate saved amount as remaining balance for the month/year
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
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;