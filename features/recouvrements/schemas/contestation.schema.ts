import z from 'zod';

export const createContestationSchema = z.object({
    factureId: z.string({
        required_error: 'L\'identifiant de la facture est requis',
    }),
    description: z
        .string({
            required_error: 'La description est requise',
        })
        .min(10, 'La description doit contenir au moins 10 caractères')
        .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
});

export type createContestationDTO = z.infer<typeof createContestationSchema>;

export const updateContestationSchema = z.object({
    description: z
        .string({
            required_error: 'La description est requise',
        })
        .min(10, 'La description doit contenir au moins 10 caractères')
        .max(1000, 'La description ne peut pas dépasser 1000 caractères')
        .optional(),
    status: z.enum(['ACTIVE', 'RESOLUE']).optional(),
});

export type updateContestationDTO = z.infer<typeof updateContestationSchema>;


