-- Create policy to allow authenticated users to read files from tests bucket
CREATE POLICY "Authenticated users can view test files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tests' AND auth.role() = 'authenticated');