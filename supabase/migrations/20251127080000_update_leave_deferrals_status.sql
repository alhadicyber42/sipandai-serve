-- Update deferral_status enum
ALTER TYPE deferral_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE deferral_status ADD VALUE IF NOT EXISTS 'rejected';

-- Allow users to insert their own deferral requests
CREATE POLICY "Users can insert their own deferrals" 
ON leave_deferrals 
FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  status = 'pending'
);

-- Allow users to update their own pending deferrals (e.g. fix document link)
CREATE POLICY "Users can update their own pending deferrals" 
ON leave_deferrals 
FOR UPDATE 
TO authenticated 
USING (
  user_id = auth.uid() AND 
  status = 'pending'
)
WITH CHECK (
  user_id = auth.uid() AND 
  status = 'pending'
);

-- Allow users to delete their own pending deferrals
CREATE POLICY "Users can delete their own pending deferrals" 
ON leave_deferrals 
FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() AND 
  status = 'pending'
);
