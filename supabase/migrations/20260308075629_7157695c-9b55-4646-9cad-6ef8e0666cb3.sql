
-- Profiles table storing onboarding data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  zone TEXT,
  location TEXT,
  profiles TEXT[] DEFAULT '{}',
  custom_reason TEXT,
  planner_score INTEGER DEFAULT 50,
  time_score INTEGER DEFAULT 5,
  result_vs_joy_score INTEGER DEFAULT 50,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing tables: change user_id from TEXT to UUID for proper auth
-- First drop the old text-based user_id columns and replace with UUID referencing auth.users
ALTER TABLE public.gardens ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.gardens ADD CONSTRAINT gardens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.crops ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.crops ADD CONSTRAINT crops_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.seed_inventory ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.seed_inventory ADD CONSTRAINT seed_inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies on existing tables to use auth.uid()
DROP POLICY IF EXISTS "Users can view their own gardens" ON public.gardens;
DROP POLICY IF EXISTS "Users can create gardens" ON public.gardens;
DROP POLICY IF EXISTS "Users can update their own gardens" ON public.gardens;
DROP POLICY IF EXISTS "Users can delete their own gardens" ON public.gardens;

CREATE POLICY "Users can view their own gardens" ON public.gardens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create gardens" ON public.gardens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gardens" ON public.gardens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gardens" ON public.gardens FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own crops" ON public.crops;
DROP POLICY IF EXISTS "Users can create crops" ON public.crops;
DROP POLICY IF EXISTS "Users can update their own crops" ON public.crops;
DROP POLICY IF EXISTS "Users can delete their own crops" ON public.crops;

CREATE POLICY "Users can view their own crops" ON public.crops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create crops" ON public.crops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crops" ON public.crops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own crops" ON public.crops FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own seeds" ON public.seed_inventory;
DROP POLICY IF EXISTS "Users can create seeds" ON public.seed_inventory;
DROP POLICY IF EXISTS "Users can update their own seeds" ON public.seed_inventory;
DROP POLICY IF EXISTS "Users can delete their own seeds" ON public.seed_inventory;

CREATE POLICY "Users can view their own seeds" ON public.seed_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create seeds" ON public.seed_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own seeds" ON public.seed_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own seeds" ON public.seed_inventory FOR DELETE USING (auth.uid() = user_id);
