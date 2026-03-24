// Export des mutations pour les utilisateurs
export { useAjouterUtilisateurMutation } from './utilisateur-add.mutation';
export { useModifierProfilMutation } from './utilisateur-update.mutation';
export { useSupprimerUtilisateurMutation } from './utilisateur-delete.mutation';

// Export des mutations pour les utilisateurs internes
export { useAjouterUtilisateurInterneMutation } from './utilisateur-interne-add.mutation';
export { useModifierUtilisateurInterneMutation } from './utilisateur-interne-update.mutation';

// Export des queries utilitaires
export { utilisateurKeyQuery, useInvalidateUtilisateurQuery } from './index.query';


