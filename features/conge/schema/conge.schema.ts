import { z } from 'zod';
import { CongeType, CongeStatut, DurationType } from '../types/conge.type';

// Base schema for conge validation
const baseCongeSchema = z.object({
  employeeId: z.string().min(1, "L'ID de l'employé est requis"),
  employeeName: z.string().min(1, "Le nom de l'employé est requis"),
  type: z.nativeEnum(CongeType, {
    errorMap: () => ({ message: "Le type de congé est requis" })
  }),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  duration: z.number().min(1, "La durée doit être d'au moins 1 jour"),
  reason: z.string().optional(),
  durationType: z.nativeEnum(DurationType).optional(),
});

// Create Conge Schema
export const CongeAddSchema = baseCongeSchema.extend({
  statut: z.nativeEnum(CongeStatut).default(CongeStatut.EN_ATTENTE),
});

// Update Conge Schema
export const CongeUpdateSchema = baseCongeSchema.partial().extend({
  statut: z.nativeEnum(CongeStatut).optional(),
});

// Conge Status Update Schema
export const CongeStatusUpdateSchema = z.object({
  statut: z.nativeEnum(CongeStatut, {
    errorMap: () => ({ message: "Le statut est requis" })
  }),
  reason: z.string().optional(),
});

// Export types
export type CongeAddDTO = z.infer<typeof CongeAddSchema>;
export type CongeUpdateDTO = z.infer<typeof CongeUpdateSchema>;
export type CongeStatusUpdateDTO = z.infer<typeof CongeStatusUpdateSchema>;
