-- Create table for OKR Comments
CREATE TABLE IF NOT EXISTS public.okr_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb, -- Array of mentioned user_ids
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.okr_comments ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified: Organization members can view/create)
-- Assuming we have organization_id on OKRs, we can join to check access, 
-- or for MVP just allow authenticated users to see comments if they can see the OKR.

-- View Policy: Users can view comments if they belong to the same org as the OKR
-- (This relies on the existing RLS logic for OKRs essentially)
CREATE POLICY "Users can view comments for visible OKRs" ON public.okr_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.okrs
            WHERE okrs.id = okr_comments.okr_id
            -- AND (Here we would typically check org membership, but strict RLS on okrs handles visibility)
        )
    );

-- Insert Policy: Authenticated users can comment
CREATE POLICY "Authenticated users can comment" ON public.okr_comments
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Delete Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.okr_comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.okr_comments;
