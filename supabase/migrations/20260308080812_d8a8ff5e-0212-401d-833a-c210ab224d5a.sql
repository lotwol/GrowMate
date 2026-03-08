ALTER TABLE public.gardens 
  ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN type SET DATA TYPE public.garden_type[] USING ARRAY[type],
  ALTER COLUMN type SET DEFAULT '{friland}'::public.garden_type[];