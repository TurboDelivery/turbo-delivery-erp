import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const livraisonKeyQuery = (...params: any[]) => {
    if (params.length === 0) {
        return ['livraison'];
    }
    return ['livraison', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateLivraisonQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: any[]) => {
        await queryClient.invalidateQueries({
            queryKey: livraisonKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: livraisonKeyQuery(),
            type: 'active'
        });
    };
};