import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createContestationDTO, updateContestationDTO } from '@/features/recouvrements/schemas/contestation.schema';
import { creerContestationRequest, modifierContestationRequest, resolveContestationRequest } from '@/features/recouvrements/requests/contestations.request';
import { factureKeys } from '@/features/recouvrements/queries/facture.query';
import { useInvalidateContestationsQuery } from '@/features/recouvrements/queries/index.query';

/**
 * Hook pour créer une contestation
 */
export function useCreerContestation() {
    const queryClient = useQueryClient();
    const invalidateContestations = useInvalidateContestationsQuery();

    return useMutation({
        mutationFn: (data: createContestationDTO) => creerContestationRequest(data),
        onSuccess: async (_) => {
            toast.success('Contestation créée avec succès');
            // Invalider et recharger toutes les contestations
            await invalidateContestations();
            // Invalider la liste des factures pour mettre à jour le compteur
            queryClient.invalidateQueries({ queryKey: factureKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Erreur lors de la création de la contestation');
        },
    });
}

/**
 * Hook pour modifier une contestation
 */
export function useModifierContestation() {
    const queryClient = useQueryClient();
    const invalidateContestations = useInvalidateContestationsQuery();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: updateContestationDTO }) => modifierContestationRequest(id, data),
        onSuccess: async () => {
            toast.success('Contestation modifiée avec succès');
            // Invalider et recharger toutes les contestations
            await invalidateContestations();
            // Invalider la liste des factures
            queryClient.invalidateQueries({ queryKey: factureKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Erreur lors de la modification de la contestation');
        },
    });
}

/**
 * Hook pour résoudre une contestation
 */
export function useResolveContestation() {
    const queryClient = useQueryClient();
    const invalidateContestations = useInvalidateContestationsQuery();

    return useMutation({
        mutationFn: (id: string) => resolveContestationRequest(id),
        onSuccess: async () => {
            toast.success('Contestation résolue avec succès');
            // Invalider et recharger toutes les contestations
            await invalidateContestations();
            // Invalider la liste des factures
            queryClient.invalidateQueries({ queryKey: factureKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Erreur lors de la résolution de la contestation');
        },
    });
}
