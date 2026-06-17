-- Custom shelf order per storage location (set on desktop, consumed on phone).

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS shelf_sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS inventory_location_shelf_sort_idx
  ON public.inventory (location_id, shelf_sort_order);
