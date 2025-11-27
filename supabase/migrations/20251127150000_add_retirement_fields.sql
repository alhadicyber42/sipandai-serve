-- Add retirement-related fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS retirement_date DATE,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS retirement_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient retirement date queries
CREATE INDEX IF NOT EXISTS idx_profiles_retirement_date ON profiles(retirement_date) WHERE retirement_date IS NOT NULL;

-- Create function to automatically calculate retirement date based on birth date
-- Assuming retirement age is 58 years
CREATE OR REPLACE FUNCTION calculate_retirement_date(birth_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN birth_date + INTERVAL '58 years';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate retirement_date when birth_date is set/updated
CREATE OR REPLACE FUNCTION update_retirement_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL THEN
    NEW.retirement_date := calculate_retirement_date(NEW.birth_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_retirement_date ON profiles;
CREATE TRIGGER trigger_update_retirement_date
  BEFORE INSERT OR UPDATE OF birth_date ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_date();

-- Add comment for documentation
COMMENT ON COLUMN profiles.birth_date IS 'Employee birth date for retirement calculation';
COMMENT ON COLUMN profiles.retirement_date IS 'Calculated retirement date (birth_date + 58 years)';
COMMENT ON COLUMN profiles.email IS 'Employee email for retirement reminders';
COMMENT ON COLUMN profiles.retirement_reminder_sent_at IS 'Timestamp of last retirement reminder sent';
