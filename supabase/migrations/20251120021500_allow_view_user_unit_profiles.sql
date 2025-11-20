-- Add policy to allow users to view other user_unit profiles for Employee of the Month feature
CREATE POLICY "Users can view other user_unit profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  role = 'user_unit'
);
