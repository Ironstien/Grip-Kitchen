-- Store the unit that price_per_unit applies to (e.g. $5 per kg).
ALTER TABLE public.inventory
  ADD COLUMN price_unit_of_measure TEXT NOT NULL DEFAULT 'each';

UPDATE public.inventory
SET price_unit_of_measure = unit_of_measure;
