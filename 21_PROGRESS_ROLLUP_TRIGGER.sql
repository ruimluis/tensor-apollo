-- Function to calculate rollup progress
CREATE OR REPLACE FUNCTION public.calculate_progress_rollup()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    parent_id_val uuid;
    avg_progress numeric;
begin
    -- Determine the parent to update
    IF TG_OP = 'DELETE' THEN
        parent_id_val := OLD.parent_id;
    ELSE
        parent_id_val := NEW.parent_id;
    END IF;

    -- If no parent (top level), nothing to do
    IF parent_id_val IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate average progress of all children of this parent
    -- Uses COALESCE to treat null progress as 0
    SELECT ROUND(AVG(COALESCE(progress, 0)))
    INTO avg_progress
    FROM okrs
    WHERE parent_id = parent_id_val;

    -- Update parent progress
    -- This update will recursively trigger this same function if the parent has a parent
    UPDATE okrs
    SET 
        progress = avg_progress,
        updated_at = NOW() 
    WHERE id = parent_id_val;

    RETURN NULL;
end;
$function$;

-- Trigger creation
DROP TRIGGER IF EXISTS on_okr_progress_change ON okrs;

CREATE TRIGGER on_okr_progress_change
    AFTER INSERT OR UPDATE OF progress, parent_id OR DELETE ON okrs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_progress_rollup();
