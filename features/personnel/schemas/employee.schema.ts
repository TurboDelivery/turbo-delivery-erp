import { z } from 'zod';
import { Employee } from '@/features/personnel/types/types';

export const EmployeeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  position: z.string().min(1, 'Le poste est requis'),
  department: z.string().min(1, 'Le département est requis'),
  salary: z.number().min(1, 'Le salaire est requis'),
  entryDate: z.string().min(1, 'La date d\'entrée est requise'),
  statut: z.enum(['Actif', 'Inactif', 'Congé']).default('Actif')
});

export const EmployeeCreateSchema = EmployeeSchema.extend({
  // Add create specific fields here if needed
});

export const EmployeeUpdateSchema = EmployeeSchema.partial();

export type EmployeeDTO = z.infer<typeof EmployeeSchema>;
export type EmployeeCreateDTO = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdateDTO = z.infer<typeof EmployeeUpdateSchema>;
