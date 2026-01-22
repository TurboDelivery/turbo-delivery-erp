import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const categorieDepenseKeyQuery = (...params: any[]) => {
    if (params.length === 0) {
        return ['categorieDepense'];
    }
    return ['categorieDepense', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateDepenseQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: any[]) => {
        await queryClient.invalidateQueries({
            queryKey: categorieDepenseKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: categorieDepenseKeyQuery(),
            type: 'active'
        });
    };
};