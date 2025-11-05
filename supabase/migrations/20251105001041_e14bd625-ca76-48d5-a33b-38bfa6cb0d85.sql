-- Update RLS policy for admin_pusat to only see services approved by admin_unit
DROP POLICY IF EXISTS "Admin pusat can view all services" ON services;

-- Admin pusat can only view services that have been approved by admin_unit first
CREATE POLICY "Admin pusat can view approved services"
ON services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin_pusat'
  )
  AND status IN ('approved_by_unit', 'under_review_central', 'approved_final', 'returned_to_unit')
);