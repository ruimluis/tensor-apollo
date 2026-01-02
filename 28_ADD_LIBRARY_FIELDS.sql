-- Add description columns to organizations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'organization_description') THEN
        ALTER TABLE public.organizations ADD COLUMN organization_description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'product_description') THEN
        ALTER TABLE public.organizations ADD COLUMN product_description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'mission_vision') THEN
        ALTER TABLE public.organizations ADD COLUMN mission_vision text;
    END IF;
END
$$;
