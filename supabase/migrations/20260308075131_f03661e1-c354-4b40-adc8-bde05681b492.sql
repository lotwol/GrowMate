
-- Enums
CREATE TYPE public.garden_type AS ENUM ('friland', 'balkong', 'växthus', 'pallkrage', 'kruka');
CREATE TYPE public.crop_category AS ENUM ('grönsak', 'ört', 'frukt', 'bär', 'blomma');
CREATE TYPE public.crop_status AS ENUM ('planerad', 'sådd', 'grodd', 'utplanterad', 'skördad', 'misslyckad');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Gardens table
CREATE TABLE public.gardens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type garden_type NOT NULL DEFAULT 'friland',
  size_sqm NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gardens"
  ON public.gardens FOR SELECT USING (true);
CREATE POLICY "Users can create gardens"
  ON public.gardens FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own gardens"
  ON public.gardens FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own gardens"
  ON public.gardens FOR DELETE USING (true);

CREATE TRIGGER update_gardens_updated_at
  BEFORE UPDATE ON public.gardens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Crops table
CREATE TABLE public.crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garden_id UUID REFERENCES public.gardens(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category crop_category NOT NULL DEFAULT 'grönsak',
  status crop_status NOT NULL DEFAULT 'planerad',
  sow_date DATE,
  harvest_date DATE,
  cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crops"
  ON public.crops FOR SELECT USING (true);
CREATE POLICY "Users can create crops"
  ON public.crops FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own crops"
  ON public.crops FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own crops"
  ON public.crops FOR DELETE USING (true);

CREATE TRIGGER update_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inventory table
CREATE TABLE public.seed_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category crop_category NOT NULL DEFAULT 'grönsak',
  quantity TEXT,
  best_before DATE,
  purchased_from TEXT,
  cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seed_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own seeds"
  ON public.seed_inventory FOR SELECT USING (true);
CREATE POLICY "Users can create seeds"
  ON public.seed_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own seeds"
  ON public.seed_inventory FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own seeds"
  ON public.seed_inventory FOR DELETE USING (true);

CREATE TRIGGER update_seed_inventory_updated_at
  BEFORE UPDATE ON public.seed_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
