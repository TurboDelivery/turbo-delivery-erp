import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const commissionKeyQuery = (...params: any[]) => {
    if (params.length === 0) {
        return ['commission'];
    }
    return ['commission', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateCommissionQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: any[]) => {
        await queryClient.invalidateQueries({
            queryKey: commissionKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: commissionKeyQuery(),
            type: 'active'
        });
    };
};