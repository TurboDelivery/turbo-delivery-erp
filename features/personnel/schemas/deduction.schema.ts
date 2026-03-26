import z from 'zod';

export const createPretSchema = z.object({
  employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
  totalAmount: z.number({ required_error: 'Le montant total est requis' }).positive('Le montant total doit etre superieur a 0'),
  duration: z.number({ required_error: 'La duree est requise' }).int('La duree doit etre un entier').min(1, 'La duree minimum est 1 mois'),
  startDate: z.string({ required_error: 'La date de debut est requise' }).min(1, 'La date de debut est requise'),
  motif: z.string({ required_error: 'Le motif est requis' }),
});

export const createAvanceSchema = z.object({
  employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
  amount: z.number({ required_error: 'Le montant est requis' }).positive('Le montant doit etre superieur a 0'),
  date: z.string({ required_error: "La date de l'avance est requise" }).min(1, "La date de l'avance est requise"),
  motif: z.string({ required_error: 'Le motif est requis' }),
});

export const createAbsenceDeductionSchema = z.object({
  employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
  days: z.number({ required_error: 'Le nombre de jours est requis' }).int('Le nombre de jours doit etre un entier').min(1, 'Le nombre de jours est requis'),
  date: z.string({ required_error: "La date de l'absence est requise" }).min(1, "La date de l'absence est requise"),
  motif: z.string({ required_error: 'Le motif est requis'}),
});

export const absenceDeductionFormSchema = z
  .object({
    employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }).min(1, "L'employe est requis"),
    dateDebut: z.string({ required_error: 'La date de debut est requise' }).min(1, 'La date de debut est requise'),
    dateFin: z.string({ required_error: 'La date de fin est requise' }).min(1, 'La date de fin est requise'),
    motif: z.string({ required_error: 'Le motif est requis' }).trim().min(2, 'Le motif est requis'),
  })
  .superRefine((value, ctx) => {
    if (value.dateFin < value.dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateFin'],
        message: 'La date de fin doit etre apres la date de debut',
      });
    }
  });

export const updatePretSchema = createPretSchema.partial();
export const updateAvanceSchema = createAvanceSchema.partial();
export const updateAbsenceDeductionSchema = createAbsenceDeductionSchema.partial();

export type CreatePretDTO = z.infer<typeof createPretSchema>;
export type CreateAvanceDTO = z.infer<typeof createAvanceSchema>;
export type CreateAbsenceDeductionDTO = z.infer<typeof createAbsenceDeductionSchema>;
export type AbsenceDeductionFormValues = z.infer<typeof absenceDeductionFormSchema>;

export type UpdatePretDTO = z.infer<typeof updatePretSchema>;
export type UpdateAvanceDTO = z.infer<typeof updateAvanceSchema>;
export type UpdateAbsenceDeductionDTO = z.infer<typeof updateAbsenceDeductionSchema>;

