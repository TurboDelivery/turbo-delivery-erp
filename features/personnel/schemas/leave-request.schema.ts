// import { z } from 'zod';
// import { LeaveRequest } from '@/features/personnel/types/types';

// export const LeaveRequestCreateSchema = z.object({
//   employeeId: z.string().min(1, 'L\'ID de l\'employé est requis'),
//   employeeName: z.string().min(1, 'Le nom de l\'employé est requis'),
//   type: z.enum(['annuel', 'maladie', 'sans solde']),
//   startDate: z.string().min(1, 'La date de début est requise'),
//   endDate: z.string().min(1, 'La date de fin est requise'),
//   duration: z.number().min(1, 'La durée doit être positive'),
//   reason: z.string().min(1, 'Le motif est requis'),
// });

// export const LeaveRequestUpdateSchema = z.object({
//   employeeId: z.string().min(1, 'L\'ID de l\'employé est requis').optional(),
//   employeeName: z.string().min(1, 'Le nom de l\'employé est requis').optional(),
//   type: z.enum(['annuel', 'maladie', 'sans solde']).optional(),
//   startDate: z.string().min(1, 'La date de début est requise').optional(),
//   endDate: z.string().min(1, 'La date de fin est requise').optional(),
//   duration: z.number().min(1, 'La durée doit être positive').optional(),
//   reason: z.string().min(1, 'Le motif est requis').optional(),
// });

// export type LeaveRequestCreateDTO = z.infer<typeof LeaveRequestCreateSchema>;
// export type LeaveRequestUpdateDTO = z.infer<typeof LeaveRequestUpdateSchema>;
// export type LeaveRequestType = z.infer<typeof LeaveRequestCreateSchema>;
