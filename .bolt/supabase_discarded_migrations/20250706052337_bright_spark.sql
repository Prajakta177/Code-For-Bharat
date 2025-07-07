/*
  # Fix ambiguous column reference in trigger functions

  1. Database Functions
    - Update `update_savings_goal()` function to properly qualify column references
    - Ensure all column references are explicit with table names to prevent ambiguity

  2. Changes
    - Fix ambiguous reference to `target_amount` column in trigger function
    - Properly qualify all column references in the function
*/

-- Drop and recreate the update_savings_goal function with proper column qualification
CREATE OR REPLACE FUNCTION update_savings_goal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update savings goal when monthly balance changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the saved_amount in savings_goals based on remaining_balance from monthly_balances
    UPDATE savings_goals 
    SET 
      saved_amount = GREATEST(0, NEW.remaining_balance),
      is_achieved = (GREATEST(0, NEW.remaining_balance) >= savings_goals.target_amount),
      updated_at = now()
    WHERE savings_goals.user_id = NEW.user_id 
      AND savings_goals.month = NEW.month 
      AND savings_goals.year = NEW.year;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;