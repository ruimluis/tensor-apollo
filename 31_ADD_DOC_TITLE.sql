-- Add title field to organization_documents for AI-generated names
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'title') THEN
        ALTER TABLE public.organization_documents ADD COLUMN title text;
    END IF;
END
$$;
