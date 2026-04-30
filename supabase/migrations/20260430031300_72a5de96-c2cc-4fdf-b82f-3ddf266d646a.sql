UPDATE public.properties
SET primary_photo = NULL,
    photos = '{}'
WHERE primary_photo LIKE '%images.unsplash.com%'
   OR EXISTS (
     SELECT 1 FROM unnest(photos) p WHERE p LIKE '%images.unsplash.com%'
   );