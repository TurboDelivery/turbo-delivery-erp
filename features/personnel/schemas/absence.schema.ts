import z from 'zod';

export const absenceFormSchema = z
  .object({
    employeeId: z.string({ required_error: "L'identifiant de l'employe est requis" }).min(1, "L'employe est requis"),
    type: z.enum(['ABSENCE', 'RETARD'], { required_error: 'Le type est requis' }),
    motif: z.string({ required_error: 'Le motif est requis' }).trim().min(2, 'Le motif est requis'),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    retardDate: z.string().optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'ABSENCE') {
      if (!value.dateDebut) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateDebut'], message: 'La date de debut est requise' });
      }
      if (!value.dateFin) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateFin'], message: 'La date de fin est requise' });
      }

      if (value.dateDebut && value.dateFin && value.dateFin < value.dateDebut) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateFin'], message: 'La date de fin doit etre apres la date de debut' });
      }
      return;
    }

    if (!value.retardDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['retardDate'], message: 'La date du retard est requise' });
    }
    if (!value.heureDebut) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['heureDebut'], message: "L'heure de debut est requise" });
    }
    if (!value.heureFin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['heureFin'], message: "L'heure de fin est requise" });
    }

    if (value.heureDebut && value.heureFin && value.heureFin <= value.heureDebut) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['heureFin'], message: "L'heure de fin doit etre apres l'heure de debut" });
    }
  });

export type AbsenceFormValues = z.infer<typeof absenceFormSchema>;

