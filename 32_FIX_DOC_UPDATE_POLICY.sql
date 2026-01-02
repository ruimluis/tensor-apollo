-- Fix: Allow users to update documents in their organization (needed for AI analysis saving)
CREATE POLICY "Users can update docs of their org"
    ON public.organization_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organization_documents.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );
