import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const investissementKeyQuery = (...params: any[]) => {
    if (params.length === 0) {
        return ['investissement'];
    }
    return ['investissement', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateInvestissementQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: any[]) => {
        await queryClient.invalidateQueries({
            queryKey: investissementKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: investissementKeyQuery(),
            type: 'active'
        });
    };
};