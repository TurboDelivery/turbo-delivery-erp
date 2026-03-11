import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recouvrementAPI } from '@/features/recouvrements/apis/recouvrement.api';
import { IAccompte, IAccompteParams } from '@/features/recouvrements/types/accompte.types';
import { toast } from 'sonner';

export const accompteQueryOption = (params: IAccompteParams) => ({
  queryKey: ['accomptes', params],
  queryFn: () => recouvrementAPI.obtenirAccomptes(params),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

export const useAccompteQuery = (params: IAccompteParams) => {
  return useQuery(accompteQueryOption(params));
};

export const useAccompteDetailQuery = (id: string) => {
  return useQuery({
    queryKey: ['accompte', id],
    queryFn: () => recouvrementAPI.obtenirAccompte(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAjouterAccompteMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: FormData) => recouvrementAPI.ajouterAccompte(formData),
    onSuccess: () => {
      toast.success('Accompte ajouté avec succès');
      queryClient.invalidateQueries({ queryKey: ['accomptes'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout de l\'acompte: ' + (error.message || 'Erreur inconnue'));
    },
  });
};

export const useModifierAccompteMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => 
      recouvrementAPI.modifierAccompte(id, formData),
    onSuccess: () => {
      toast.success('Accompte modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['accomptes'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la modification de l\'acompte: ' + (error.message || 'Erreur inconnue'));
    },
  });
};

export const useSupprimerAccompteMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => recouvrementAPI.supprimerAccompte(id),
    onSuccess: () => {
      toast.success('Accompte supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['accomptes'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de l\'acompte: ' + (error.message || 'Erreur inconnue'));
    },
  });
};
