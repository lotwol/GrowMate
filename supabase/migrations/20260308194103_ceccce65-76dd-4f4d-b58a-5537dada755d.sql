
ALTER TABLE public.seed_inventory
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';
