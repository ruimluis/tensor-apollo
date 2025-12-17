-- Create table for tracking read status of OKR conversations
CREATE TABLE IF NOT EXISTS public.okr_comment_reads (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    okr_id UUID NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, okr_id)
);

-- Enable RLS
ALTER TABLE public.okr_comment_reads ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own read status
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.okr_comment_reads;
CREATE POLICY "Users can manage their own read status" ON public.okr_comment_reads
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add last_comment_at to OKRs to easily check for updates
ALTER TABLE public.okrs ADD COLUMN IF NOT EXISTS last_comment_at TIMESTAMP WITH TIME ZONE;

-- Create Function to update last_comment_at on new comment
CREATE OR REPLACE FUNCTION public.update_okr_last_comment_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.okrs
    SET last_comment_at = NOW()
    WHERE id = NEW.okr_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_comment_insert_update_okr ON public.okr_comments;
CREATE TRIGGER on_comment_insert_update_okr
AFTER INSERT ON public.okr_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_okr_last_comment_at();

-- Realtime for okr_comment_reads isn't strictly necessary if we rely on okrs updates or periodic fetches,
-- but useful if we want to sync read status across devices instantly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'okr_comment_reads'
  ) THEN
    alter publication supabase_realtime add table public.okr_comment_reads;
  END IF;
END
$$;
