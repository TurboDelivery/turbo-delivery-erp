import z from 'zod';

export const createPretSchema = z.object({
  employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
  totalAmount: z.number({ required_error: 'Le montant total est requis' }).positive('Le montant total doit etre superieur a 0'),
  duration: z.number({ required_error: 'La duree est requise' }).int('La duree doit etre un entier').min(1, 'La duree minimum est 1 mois'),
  startDate: z.string({ required_error: 'La date de debut est requise' }).min(1, 'La date de debut est requise'),
});

export const createAvanceSchema = z.object({
  employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
  amount: z.number({ required_error: 'Le montant est requis' }).positive('Le montant doit etre superieur a 0'),
  date: z.string({ required_error: "La date de l'avance est requise" }).min(1, "La date de l'avance est requise"),
});

export const createAbsenceDeductionSchema = z.object({
  employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }),
  days: z.number({ required_error: 'Le nombre de jours est requis' }).int('Le nombre de jours doit etre un entier').min(1, 'Le nombre de jours est requis'),
  date: z.string({ required_error: "La date de l'absence est requise" }).min(1, "La date de l'absence est requise"),
});

export const updatePretSchema = createPretSchema.partial();
export const updateAvanceSchema = createAvanceSchema.partial();
export const updateAbsenceDeductionSchema = createAbsenceDeductionSchema.partial();

export type CreatePretDTO = z.infer<typeof createPretSchema>;
export type CreateAvanceDTO = z.infer<typeof createAvanceSchema>;
export type CreateAbsenceDeductionDTO = z.infer<typeof createAbsenceDeductionSchema>;

export type UpdatePretDTO = z.infer<typeof updatePretSchema>;
export type UpdateAvanceDTO = z.infer<typeof updateAvanceSchema>;
export type UpdateAbsenceDeductionDTO = z.infer<typeof updateAbsenceDeductionSchema>;

