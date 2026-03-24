import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const utilisateurKeyQuery = (...params: unknown[]) => {
    if (params.length === 0) {
        return ['utilisateur'];
    }
    return ['utilisateur', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateUtilisateurQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: unknown[]) => {
        await queryClient.invalidateQueries({
            queryKey: utilisateurKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: utilisateurKeyQuery(),
            type: 'active'
        });
    };
};