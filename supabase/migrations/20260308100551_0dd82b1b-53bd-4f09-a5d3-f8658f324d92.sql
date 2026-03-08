
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  emoji TEXT DEFAULT '📅',
  event_type TEXT DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.calendar_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events" ON public.calendar_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON public.calendar_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.calendar_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
