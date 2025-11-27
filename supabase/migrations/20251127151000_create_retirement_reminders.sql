-- Create retirement_reminders table to track all reminder activities
CREATE TABLE IF NOT EXISTS retirement_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'whatsapp')),
  sent_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  message_content TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_retirement_reminders_user_id ON retirement_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_retirement_reminders_sent_at ON retirement_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_retirement_reminders_status ON retirement_reminders(status);

-- Enable RLS
ALTER TABLE retirement_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin pusat can view all reminders
CREATE POLICY "Admin pusat can view all retirement reminders"
ON retirement_reminders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- RLS Policy: Admin unit can view reminders for their unit's employees
CREATE POLICY "Admin unit can view their unit's retirement reminders"
ON retirement_reminders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin
    INNER JOIN profiles AS employee ON employee.id = retirement_reminders.user_id
    WHERE admin.id = auth.uid()
    AND admin.role = 'admin_unit'
    AND admin.work_unit_id = employee.work_unit_id
  )
);

-- RLS Policy: Admins can insert reminders
CREATE POLICY "Admins can insert retirement reminders"
ON retirement_reminders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin_pusat', 'admin_unit')
  )
);

-- RLS Policy: Admins can update reminders they sent
CREATE POLICY "Admins can update their retirement reminders"
ON retirement_reminders
FOR UPDATE
TO authenticated
USING (sent_by = auth.uid())
WITH CHECK (sent_by = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retirement_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_retirement_reminders_updated_at ON retirement_reminders;
CREATE TRIGGER trigger_update_retirement_reminders_updated_at
  BEFORE UPDATE ON retirement_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_reminders_updated_at();

-- Add comments for documentation
COMMENT ON TABLE retirement_reminders IS 'Tracks all retirement reminder activities sent to employees';
COMMENT ON COLUMN retirement_reminders.reminder_type IS 'Type of reminder: email or whatsapp';
COMMENT ON COLUMN retirement_reminders.status IS 'Status: pending, sent, or failed';
COMMENT ON COLUMN retirement_reminders.message_content IS 'Content of the reminder message sent';
