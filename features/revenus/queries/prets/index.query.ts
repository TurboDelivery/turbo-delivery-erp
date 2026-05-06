import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const pretKeyQuery = (...params: any[]) => {
    if (params.length === 0) {
        return ['prets'];
    }
    return ['prets', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidatePretQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: any[]) => {
        await queryClient.invalidateQueries({
            queryKey: pretKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: pretKeyQuery(),
            type: 'active'
        });
    };
};