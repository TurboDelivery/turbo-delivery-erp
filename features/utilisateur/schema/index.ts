// Export des schémas pour les utilisateurs
export {
  UtilisateurAddSchema,
  UtilisateurUpdateSchema,
  UtilisateurRoleSchema,
  type UtilisateurAddDTO,
  type UtilisateurUpdateDTO,
  type UtilisateurRoleDTO,
} from './utilisateur.schema';

// Export des schémas pour les utilisateurs internes
export {
  UtilisateurInterneAddSchema,
  UtilisateurInterneUpdateSchema,
  INTERNAL_ROLES,
  type UtilisateurInterneAddDTO,
  type UtilisateurInterneUpdateDTO,
} from './utilisateur-interne.schema';

