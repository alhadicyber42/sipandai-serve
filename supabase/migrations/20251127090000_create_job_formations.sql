-- Create job_formations table
CREATE TABLE IF NOT EXISTS job_formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_unit_id BIGINT REFERENCES work_units(id) ON DELETE CASCADE NOT NULL,
  position_name TEXT NOT NULL,
  quota INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add target columns to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS target_work_unit_id BIGINT REFERENCES work_units(id),
ADD COLUMN IF NOT EXISTS target_job_formation_id UUID REFERENCES job_formations(id);

-- Enable RLS
ALTER TABLE job_formations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_formations

-- Everyone can view formations (needed for users to select destination)
CREATE POLICY "Everyone can view job formations"
ON job_formations FOR SELECT
TO authenticated
USING (true);

-- Admin Pusat can do everything
CREATE POLICY "Admin Pusat can manage all job formations"
ON job_formations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Admin Unit can manage their own unit's formations
CREATE POLICY "Admin Unit can manage their own formations"
ON job_formations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_unit'
    AND profiles.work_unit_id = job_formations.work_unit_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_unit'
    AND profiles.work_unit_id = job_formations.work_unit_id
  )
);
