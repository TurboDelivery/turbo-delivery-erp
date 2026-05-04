import { z } from 'zod';

export const priceListSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Le nom est obligatoire'),
  restaurantId: z.string().min(1, 'Le restaurant est requis'),
  zone: z.string().min(1, 'La zone est requise'),
  latitude: z.number(),
  longitude: z.number(),
  distanceDebut: z.number().min(0),
  distanceFin: z.number().min(0),
  prix: z.number().min(1, 'Le prix doit être supérieur à 0'),
  commission: z.number().min(0),
});

export type PriceListFormData = z.infer<typeof priceListSchema>;
