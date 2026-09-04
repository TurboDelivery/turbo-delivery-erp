'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ChargeTypeFilter } from '../hooks/use-paiements-table';
import { chargeFixeKeyQuery } from '@/features/charges/queries/index.query';
import { chargeVariableKeyQuery } from '@/features/charges/queries/index-charge-variable.query';

const DECAISSER_ENDPOINT: Record<ChargeTypeFilter, string> = {
  fixe: '/erp/charges-fixes',
  variable: '/erp/charges-variables',
};

export const useDecaisserMutation = (chargeType: ChargeTypeFilter, fin?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    /*
     * UN DECAISSEMENT PARTIEL ETAIT RAPPORTE COMME UN ECHEC TOTAL.
     *
     * <p>`Promise.all` rejette au PREMIER echec. Les N-1 autres requetes, deja parties,
     * aboutissaient quand meme : des charges etaient bel et bien payees. Mais la mutation
     * partait dans `onError`, donc ni invalidation, ni rafraichissement, ni message de
     * reussite — seulement « Erreur lors du decaissement ».</p>
     *
     * <p>L'operateur voyait un echec, recliquait sur la meme selection, et redecaissait
     * ce qui l'avait deja ete. Sur une chaine qui sort de l'argent, c'est un double
     * paiement.</p>
     *
     * <p>`allSettled` attend TOUT le monde, on compte, et on le dit. Le cache est
     * rafraichi dans les deux cas : meme sur echec partiel, la liste doit refleter ce qui
     * est reellement paye.</p>
     */
    mutationFn: async (ids: string[]) => {
      const base = DECAISSER_ENDPOINT[chargeType];
      const data = chargeType === 'fixe' && fin ? { date: fin } : undefined;
      const resultats = await Promise.allSettled(
        ids.map((id) =>
          api.request({ endpoint: `${base}/${id}/payer`, method: 'PATCH', data }),
        ),
      );
      const echoues = ids.filter((_, i) => resultats[i].status === 'rejected');
      return { total: ids.length, reussis: ids.length - echoues.length, echoues };
    },
    onSettled: async () => {
      // Meme sur echec partiel : ce qui est paye doit apparaitre comme paye.
      const key = chargeType === 'fixe' ? chargeFixeKeyQuery() : chargeVariableKeyQuery();
      await queryClient.invalidateQueries({ queryKey: key, exact: false });
      await queryClient.refetchQueries({ queryKey: key, type: 'active' });
    },
    onSuccess: ({ total, reussis, echoues }) => {
      if (echoues.length === 0) {
        toast.success(`${reussis > 1 ? 'Charges décaissées' : 'Charge décaissée'} avec succès`);
        return;
      }
      if (reussis === 0) {
        toast.error(`Aucune des ${total} charges n'a pu être décaissée.`);
        return;
      }
      toast.warning(`${reussis} décaissée${reussis > 1 ? 's' : ''}, ${echoues.length} en échec.`, {
        description: 'Les charges en échec restent à décaisser ; les autres ne sont plus à reprendre.',
      });
    },
    onError: (error) => {
      toast.error('Erreur lors du décaissement', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

