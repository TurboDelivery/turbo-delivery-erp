import { z } from 'zod';

// Schema pour l'ajout d'un utilisateur
export const UtilisateurAddSchema = z.object({
  firstName: z.string({ message: "Le prénom est requis" })
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères")
    .trim(),

  lastName: z.string({ message: "Le nom est requis" })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .trim(),

  email: z.string({ message: "L'email est requis" })
    .email("L'email doit être une adresse valide")
    .max(100, "L'email ne doit pas dépasser 100 caractères")
    .toLowerCase()
    .trim(),

  phoneNumber: z.string({ message: "Le numéro de téléphone est requis" })
    .max(20, "Le numéro de téléphone ne doit pas dépasser 20 caractères")
    .regex(/^\+?[\d\s\-]+$/, "Numéro de téléphone invalide")
    .trim(),

  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AGENT', 'CUSTOMER'], { message: "Le rôle est requis" })
});

export type UtilisateurAddDTO = z.infer<typeof UtilisateurAddSchema>;


// Schema pour la modification d'un utilisateur
export const UtilisateurUpdateSchema = UtilisateurAddSchema.partial();
export type UtilisateurUpdateDTO = z.infer<typeof UtilisateurUpdateSchema>;


// Schema pour la modification du role d'un utilisateur
export const UtilisateurRoleSchema = UtilisateurAddSchema.pick({ role: true });
export type UtilisateurRoleDTO = z.infer<typeof UtilisateurRoleSchema>;