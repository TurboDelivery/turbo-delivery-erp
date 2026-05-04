import { z } from 'zod';

export const priceListSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Le nom est obligatoire'),
  restaurantId: z.string().min(1, 'Le restaurant est requis'),
  zone: z.string().min(1, 'La zone est requise'),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  distanceDebut: z.coerce.number().min(0),
  distanceFin: z.coerce.number().min(0),
  prix: z.coerce.number().min(1, 'Le prix doit être supérieur à 0'),
  commission: z.coerce.number().min(0),
});

export type PriceListFormData = z.infer<typeof priceListSchema>;
