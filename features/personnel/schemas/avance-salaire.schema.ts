import z from 'zod';

export const avanceSalaireSchema = z
  .object({
    employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
    salary: z.number({ required_error: 'Le salaire est requis' }).min(0).default(0),
    amount: z.number({ required_error: 'Le montant est requis' }).positive('Le montant doit etre superieur a 0'),
    date: z.string({ required_error: "La date de l'avance est requise" }).min(1, "La date de l'avance est requise"),
  })
  .superRefine((values, ctx) => {
    if (values.salary > 0 && values.amount >= values.salary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: 'Le montant doit etre strictement inferieur au salaire.',
      });
    }
  });

export type AvanceSalaireFormValues = z.infer<typeof avanceSalaireSchema>;
