-- Create leave_deferrals table for managing leave deferral balances
-- This table stores records of deferred leave days from previous years

-- Create deferral_status enum
CREATE TYPE deferral_status AS ENUM ('active', 'used', 'expired');

-- Create leave_deferrals table
CREATE TABLE IF NOT EXISTS leave_deferrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deferral_year INTEGER NOT NULL CHECK (deferral_year >= 2000 AND deferral_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
  days_deferred INTEGER NOT NULL CHECK (days_deferred > 0),
  approval_document TEXT NOT NULL,
  status deferral_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ensure one deferral record per user per year
  CONSTRAINT unique_deferral_per_user_year UNIQUE (user_id, deferral_year)
);

-- Enable Row Level Security
ALTER TABLE leave_deferrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_deferrals

-- Users can view their own deferral records
CREATE POLICY "Users can view their own deferrals" 
ON leave_deferrals 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Admin can view all deferral records
CREATE POLICY "Admin can view all deferrals" 
ON leave_deferrals 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin_unit', 'admin_pusat'))
);

-- Only admin_pusat can insert deferral records
CREATE POLICY "Admin pusat can insert deferrals" 
ON leave_deferrals 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- Only admin_pusat can update deferral records
CREATE POLICY "Admin pusat can update deferrals" 
ON leave_deferrals 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- Only admin_pusat can delete deferral records
CREATE POLICY "Admin pusat can delete deferrals" 
ON leave_deferrals 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- Trigger for updated_at
CREATE TRIGGER update_leave_deferrals_updated_at 
BEFORE UPDATE ON leave_deferrals
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_leave_deferrals_user_id ON leave_deferrals(user_id);
CREATE INDEX idx_leave_deferrals_status ON leave_deferrals(status);
CREATE INDEX idx_leave_deferrals_user_status ON leave_deferrals(user_id, status);
CREATE INDEX idx_leave_deferrals_year ON leave_deferrals(deferral_year);
