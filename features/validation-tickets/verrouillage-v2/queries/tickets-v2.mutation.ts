'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvalidateTicketsV2Query } from './index.query';
import { validerV1Ticket, validerV2Ticket, validerV2EnMasseTicket, rejeterTicketPourFraude } from '@/src/actions/bon-commande.action';

/**
 * Le backend refuse en 409 une validation dont l'étape est déjà franchie :
 * « V1 impossible (statut=V1_VALIDE) — attendu AUTHENTIFIE ».
 *
 * <p>Ce n'est pas une erreur du point de vue de l'opérateur : l'état qu'il demandait est
 * atteint. Le lui montrer en rouge lui fait croire que sa validation a échoué alors qu'elle a
 * réussi — il reclique, obtient un nouveau refus, et voit finalement le ticket validé « au
 * bout d'un moment ». C'est le symptôme remonté en production le 2026-08-03.</p>
 *
 * <p>La reconnaissance est <b>volontairement étroite</b> : seuls les statuts qui prouvent que
 * l'étape est franchie sont absorbés. Un ticket REJETE_FRAUDE doit continuer à faire échouer
 * bruyamment la validation — l'avaler en silence masquerait une fraude signalée.</p>
 */
function etapeDejaFranchie(message: string, etape: 'V1' | 'V2'): boolean {
  const statut = /statut\s*=\s*([A-Z0-9_]+)/i.exec(message)?.[1]?.toUpperCase();
  if (!statut) {
    return false;
  }
  // Valider V1 sur un ticket déjà V2 : l'étape V1 est franchie depuis longtemps.
  return etape === 'V1'
    ? statut === 'V1_VALIDE' || statut === 'V2_VALIDE'
    : statut === 'V2_VALIDE';
}

type Issue = 'valide' | 'deja-valide';

/**
 * `enLot` vaut vrai quand l'appel fait partie d'un « Tout valider ». La mutation n'affiche
 * alors aucun message et ne rafraîchit pas la liste : l'appelant le fera une seule fois à la
 * fin.
 *
 * <p>Rafraîchir après CHAQUE ticket relançait la requête paginée à chaque tour de boucle ; les
 * tickets validés quittant la liste, les pages se décalaient sous la boucle et un même ticket
 * revenait deux fois — d'où les couples 204 puis 409 observés à une seconde d'intervalle en
 * production. Sans compter un message de succès par ticket, soit quarante bulles pour un lot
 * de quarante.</p>
 */
export const useValiderV1Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation<Issue, Error, { ticketId: string; enLot?: boolean }>({
    mutationFn: async ({ ticketId }) => {
      const result = await validerV1Ticket(ticketId);
      if (result.success) {
        return 'valide';
      }
      const message = String(result.error ?? '');
      if (etapeDejaFranchie(message, 'V1')) {
        return 'deja-valide';
      }
      throw new Error(message || 'Erreur inconnue');
    },
    onSuccess: (issue, variables) => {
      if (variables?.enLot) {
        return;
      }
      if (issue === 'deja-valide') {
        toast.info('Ce ticket était déjà validé V1.');
      } else {
        toast.success('Ticket validé V1.');
      }
    },
    onError: (error, variables) => {
      if (variables?.enLot) {
        return;
      }
      toast.error('Erreur lors de la validation V1', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
    onSettled: async (_issue, _erreur, variables) => {
      if (!variables?.enLot) {
        await invalidate();
      }
    },
  });
};

export const useValiderV2Mutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation<Issue, Error, { ticketId: string; enLot?: boolean }>({
    mutationFn: async ({ ticketId }) => {
      const result = await validerV2Ticket(ticketId);
      if (result.success) {
        return 'valide';
      }
      const message = String(result.error ?? '');
      if (etapeDejaFranchie(message, 'V2')) {
        return 'deja-valide';
      }
      throw new Error(message || 'Erreur inconnue');
    },
    onSuccess: (issue, variables) => {
      if (variables?.enLot) {
        return;
      }
      if (issue === 'deja-valide') {
        toast.info('Ce ticket était déjà validé V2.');
      } else {
        toast.success('Ticket validé V2.');
      }
    },
    onError: (error, variables) => {
      if (variables?.enLot) {
        return;
      }
      toast.error('Erreur lors de la validation V2', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
    onSettled: async (_issue, _erreur, variables) => {
      if (!variables?.enLot) {
        await invalidate();
      }
    },
  });
};

export const useValiderV2EnMasseMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async () => {
      const result = await validerV2EnMasseTicket();
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Tous les tickets ont été validés V2.');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation V2 en masse', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useRejeterV2FraudeMutation = () => {
  const invalidate = useInvalidateTicketsV2Query();

  return useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const result = await rejeterTicketPourFraude(id, motif);
      if (!result.success) throw new Error(result.error as string);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Ticket rejeté pour fraude.');
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
