
-- Drop old unique constraint that limits one crop to one cell
ALTER TABLE public.crop_placements DROP CONSTRAINT IF EXISTS crop_placements_layout_id_crop_id_key;

-- Add new unique constraint: one cell can only have one crop
ALTER TABLE public.crop_placements ADD CONSTRAINT crop_placements_layout_cell_unique UNIQUE (layout_id, cell_row, cell_col);
