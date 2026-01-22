import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const recouvrementKeyQuery = (...params: any[]) => {
    if (params.length === 0) {
        return ['recouvrement'];
    }
    return ['recouvrement', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateRecouvrementQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: any[]) => {
        await queryClient.invalidateQueries({
            queryKey: recouvrementKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: recouvrementKeyQuery(),
            type: 'active'
        });
    };
};