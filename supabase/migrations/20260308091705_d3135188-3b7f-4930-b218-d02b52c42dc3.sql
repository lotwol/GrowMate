-- Drop existing table and recreate with wellbeing columns
DROP TABLE IF EXISTS public.diary_entries CASCADE;

CREATE TABLE public.diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  content TEXT,
  mood_garden INTEGER,
  wellbeing_physical INTEGER,
  wellbeing_mental INTEGER,
  wellbeing_social INTEGER,
  activities TEXT[] DEFAULT '{}',
  season_year INTEGER DEFAULT (EXTRACT(YEAR FROM CURRENT_DATE))::integer,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Validation triggers instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_diary_scores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.mood_garden IS NOT NULL AND (NEW.mood_garden < 1 OR NEW.mood_garden > 5) THEN
    RAISE EXCEPTION 'mood_garden must be between 1 and 5';
  END IF;
  IF NEW.wellbeing_physical IS NOT NULL AND (NEW.wellbeing_physical < 1 OR NEW.wellbeing_physical > 5) THEN
    RAISE EXCEPTION 'wellbeing_physical must be between 1 and 5';
  END IF;
  IF NEW.wellbeing_mental IS NOT NULL AND (NEW.wellbeing_mental < 1 OR NEW.wellbeing_mental > 5) THEN
    RAISE EXCEPTION 'wellbeing_mental must be between 1 and 5';
  END IF;
  IF NEW.wellbeing_social IS NOT NULL AND (NEW.wellbeing_social < 1 OR NEW.wellbeing_social > 5) THEN
    RAISE EXCEPTION 'wellbeing_social must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_diary_scores_trigger
  BEFORE INSERT OR UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_diary_scores();

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary entries" ON public.diary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own diary entries" ON public.diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diary entries" ON public.diary_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diary entries" ON public.diary_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();