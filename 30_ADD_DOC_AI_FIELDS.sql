-- Add AI fields to organization_documents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'summary') THEN
        ALTER TABLE public.organization_documents ADD COLUMN summary text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'text_content') THEN
        ALTER TABLE public.organization_documents ADD COLUMN text_content text;
    END IF;
END
$$;
