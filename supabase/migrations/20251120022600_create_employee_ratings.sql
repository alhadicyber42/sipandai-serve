-- Create employee_ratings table for Employee of the Month feature
CREATE TABLE IF NOT EXISTS employee_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_period TEXT NOT NULL, -- Format: "YYYY-MM" e.g., "2025-11"
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one rating per person per employee per period
  CONSTRAINT unique_rating_per_period UNIQUE (rater_id, rated_employee_id, rating_period)
);

-- Enable Row Level Security
ALTER TABLE employee_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_ratings
CREATE POLICY "Users can view their own ratings given" 
ON employee_ratings 
FOR SELECT 
TO authenticated 
USING (rater_id = auth.uid());

CREATE POLICY "Users can view ratings they received" 
ON employee_ratings 
FOR SELECT 
TO authenticated 
USING (rated_employee_id = auth.uid());

CREATE POLICY "Admin can view all ratings" 
ON employee_ratings 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin_unit', 'admin_pusat'))
);

CREATE POLICY "Users can insert their own ratings" 
ON employee_ratings 
FOR INSERT 
TO authenticated 
WITH CHECK (rater_id = auth.uid());

CREATE POLICY "Users can update their own ratings" 
ON employee_ratings 
FOR UPDATE 
TO authenticated 
USING (rater_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_employee_ratings_updated_at 
BEFORE UPDATE ON employee_ratings
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_employee_ratings_period ON employee_ratings(rating_period);
CREATE INDEX idx_employee_ratings_rated_employee ON employee_ratings(rated_employee_id, rating_period);
