
-- 1. Create okr_updates table safely
CREATE TABLE IF NOT EXISTS public.okr_updates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    okr_id uuid REFERENCES public.okrs(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    progress_value numeric NOT NULL,
    current_value numeric,
    comment text,
    checkin_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.okr_updates ENABLE ROW LEVEL SECURITY;

-- 2. Add columns safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'okrs' AND column_name = 'current_value') THEN
        ALTER TABLE public.okrs ADD COLUMN current_value numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'okrs' AND column_name = 'last_checkin_date') THEN
        ALTER TABLE public.okrs ADD COLUMN last_checkin_date timestamp with time zone;
    END IF;
END
$$;

-- 3. Fix OKRS Table Policies (CRITICAL: Allow Team Access so inner queries work)
DROP POLICY IF EXISTS "Users can CRUD their own OKRs." ON public.okrs;
DROP POLICY IF EXISTS "Users can view OKRs they own or are in team" ON public.okrs;
DROP POLICY IF EXISTS "Users can update OKRs they own or are in team" ON public.okrs;
DROP POLICY IF EXISTS "Users can insert OKRs" ON public.okrs;
DROP POLICY IF EXISTS "Users can delete OKRs they own" ON public.okrs;

-- View: Owner OR Team Member
CREATE POLICY "Users can view OKRs they own or are in team"
    ON public.okrs FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_members.team_id = okrs.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Insert: Authenticated users can create OKRs (logic for team checks can be in app or trigger, but basic insert is allowed)
CREATE POLICY "Users can insert OKRs"
    ON public.okrs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update: Owner OR Team Member
CREATE POLICY "Users can update OKRs they own or are in team"
    ON public.okrs FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_members.team_id = okrs.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Delete: Only Owner
CREATE POLICY "Users can delete OKRs they own"
    ON public.okrs FOR DELETE
    USING (auth.uid() = user_id);


-- 4. Update Policies for okr_updates (Now that okrs is readable, this should work)
DROP POLICY IF EXISTS "Users can view updates for their OKRs" ON public.okr_updates;
DROP POLICY IF EXISTS "Users can create updates for their OKRs" ON public.okr_updates;

-- View updates: If I can see the OKR, I can see the updates
CREATE POLICY "Users can view updates for their OKRs"
    ON public.okr_updates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.okrs
            WHERE okrs.id = okr_updates.okr_id
            -- No extra checks needed here because RLS on 'okrs' will filter it automatically!
            -- If I can select the OKR ID, I have access.
        )
    );

-- Create updates: If I can see/edit the OKR, I can add an update
CREATE POLICY "Users can create updates for their OKRs"
    ON public.okr_updates FOR INSERT
    WITH CHECK (
        auth.uid() = user_id -- Author is me
        AND EXISTS (
            SELECT 1 FROM public.okrs
            WHERE okrs.id = okr_updates.okr_id -- Using the new row's okr_id
             -- Again, relies on 'okrs' RLS allowing me to finding this ID
        )
    );
