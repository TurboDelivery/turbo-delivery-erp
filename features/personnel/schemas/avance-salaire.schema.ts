import { z } from 'zod';

export const avanceSalaireSchema = z
  .object({
    employeeId: z.string().min(1, "L'employe est requis"),
    salaire: z.number().min(1, 'Le salaire est requis'),
    montant: z.number().positive('Le montant doit etre superieur a 0'),
    dateDemande: z.string().min(1, 'La date de demande est requise'),
    motif: z.string().trim().min(2, 'Le motif est requis'),
  })
  .superRefine((values, ctx) => {
    if (values.montant >= values.salaire) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['montant'],
        message: 'Le montant doit etre strictement inferieur au salaire.',
      });
    }
  });

export type AvanceSalaireFormValues = z.infer<typeof avanceSalaireSchema>;

