// import { z } from 'zod';
// import { Deduction } from '@/features/personnel/types/types';

// export const DeductionCreateSchema = z.object({
//   employeeId: z.string().min(1, 'L\'ID de l\'employé est requis'),
//   employeeName: z.string().min(1, 'Le nom de l\'employé est requis'),
//   type: z.enum(['Retard', 'Absence injustifiée', 'Dommage matériel', 'Avance sur salaire']),
//   amount: z.number().min(0, 'Le montant doit être positif'),
//   reason: z.string().min(1, 'Le motif est requis'),
//   date: z.string().min(1, 'La date est requise'),
//   repaymentDuration: z.number().min(1, 'La durée de remboursement doit être positive').optional(),
// });

// export const DeductionUpdateSchema = z.object({
//   employeeId: z.string().min(1, 'L\'ID de l\'employé est requis').optional(),
//   employeeName: z.string().min(1, 'Le nom de l\'employé est requis').optional(),
//   type: z.enum(['Retard', 'Absence injustifiée', 'Dommage matériel', 'Avance sur salaire']).optional(),
//   amount: z.number().min(0, 'Le montant doit être positif').optional(),
//   reason: z.string().min(1, 'Le motif est requis').optional(),
//   date: z.string().min(1, 'La date est requise').optional(),
//   repaymentDuration: z.number().min(1, 'La durée de remboursement doit être positive').optional(),
// });

// export type DeductionCreateDTO = z.infer<typeof DeductionCreateSchema>;
// export type DeductionUpdateDTO = z.infer<typeof DeductionUpdateSchema>;
