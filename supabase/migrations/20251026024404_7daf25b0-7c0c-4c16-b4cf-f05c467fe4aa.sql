-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-documents',
  'service-documents',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- RLS policies for storage
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-documents' AND
  (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-documents' AND
  (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

CREATE POLICY "Admin unit can view documents in their unit"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-documents' AND
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p2.id = ((storage.foldername(storage.objects.name))[1])::uuid
    WHERE p1.id = auth.uid() 
    AND p1.role = 'admin_unit'
    AND p1.work_unit_id = p2.work_unit_id
  )
);

CREATE POLICY "Admin pusat can view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-documents' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'service-documents' AND
  (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);