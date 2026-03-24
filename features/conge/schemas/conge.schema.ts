import { z } from 'zod';
import { CongeType, CongeStatut, DurationType } from '../types/conge.type';

export const CongeAddSchema = z.object({
  employeeId: z.string().min(1, "L'ID de l'employé est requis"),
  employeeName: z.string().optional(),
  type: z.nativeEnum(CongeType, { errorMap: () => ({ message: "Type de congé invalide" }) }),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  duration: z.number().min(1, "La durée doit être supérieure à 0"),
  durationType: z.nativeEnum(DurationType, { errorMap: () => ({ message: "Type de durée invalide" }) }),
  reason: z.string().optional(),
});

export const CongeUpdateSchema = z.object({
  employeeId: z.string().min(1, "L'ID de l'employé est requis").optional(),
  employeeName: z.string().optional(),
  type: z.nativeEnum(CongeType, { errorMap: () => ({ message: "Type de congé invalide" }) }).optional(),
  startDate: z.string().min(1, "La date de début est requise").optional(),
  endDate: z.string().min(1, "La date de fin est requise").optional(),
  duration: z.number().min(1, "La durée doit être supérieure à 0").optional(),
  durationType: z.nativeEnum(DurationType, { errorMap: () => ({ message: "Type de durée invalide" }) }).optional(),
  reason: z.string().optional(),
  statut: z.string().optional(),
});

export const CongeStatusUpdateSchema = z.object({
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
  reason: z.string().optional(),
  comment: z.string().optional(),
});

export type CongeAddDTO = z.infer<typeof CongeAddSchema>;
export type CongeUpdateDTO = z.infer<typeof CongeUpdateSchema>;
export type CongeStatusUpdateDTO = z.infer<typeof CongeStatusUpdateSchema>;
