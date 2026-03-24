import { z } from 'zod';

// Les rôles pour les utilisateurs internes (excluant CUSTOMER)
export const INTERNAL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AGENT'] as const;

// Schema pour l'ajout d'un utilisateur interne
export const UtilisateurInterneAddSchema = z.object({
  firstName: z.string({ message: "Le prénom est requis" })
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères")
    .trim(),

  lastName: z.string({ message: "Le nom est requis" })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .trim(),

  email: z
    .email("L'email doit être une adresse valide")
    .max(100, "L'email ne doit pas dépasser 100 caractères")
    .toLowerCase()
    .trim(),

  password: z.string({ message: "Le mot de passe est requis" })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100, "Le mot de passe ne doit pas dépasser 100 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),

  role: z.enum(INTERNAL_ROLES, { message: "Le rôle est requis" }),

  phone: z.string()
    .max(20, "Le numéro de téléphone ne doit pas dépasser 20 caractères")
    .regex(/^\+?[\d\s\-]+$/, "Numéro de téléphone invalide")
    .trim()
    .optional(),
});

export type UtilisateurInterneAddDTO = z.infer<typeof UtilisateurInterneAddSchema>;

// Schema pour la modification d'un utilisateur interne (tous les champs optionnels sauf password qui reste avec validation stricte)
export const UtilisateurInterneUpdateSchema = z.object({
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères")
    .trim()
    .optional(),

  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .trim()
    .optional(),

  email: z
    .email("L'email doit être une adresse valide")
    .max(100, "L'email ne doit pas dépasser 100 caractères")
    .toLowerCase()
    .trim()
    .optional(),

  password: z
    .string()
    .transform((val) => val === '' ? undefined : val)
    .pipe(
      z.string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .max(100, "Le mot de passe ne doit pas dépasser 100 caractères")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
        .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
        .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial")
        .optional()
    )
    .optional(),

  role: z.enum(INTERNAL_ROLES, { message: "Le rôle doit être valide" })
    .optional(),

  phone: z.string()
    .max(20, "Le numéro de téléphone ne doit pas dépasser 20 caractères")
    .regex(/^\+?[\d\s\-]+$/, "Numéro de téléphone invalide")
    .trim()
    .optional(),
});

export type UtilisateurInterneUpdateDTO = z.infer<typeof UtilisateurInterneUpdateSchema>;

