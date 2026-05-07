import { getCreneauxListApi } from '@/features/creneaux/apis/creneau.api';
import type { StatutCreneau } from '../types/historique-creneaux.type';

function mapStatut(apiStatut: string): StatutCreneau {
  switch (apiStatut?.toUpperCase()) {
    case 'SOLDE':
    case 'PAIEMENT_EN_COURS':
      return 'paye';
    case 'REJETE':
      return 'rejete';
    case 'VALIDE_DGA':
      return 'valide_v1';
    case 'APPROUVE_DG':
      return 'verrouille_v2';
    case 'REGULARISATION':
      return 'regularisation';
    default:
      return 'soumis';
  }
}

export async function getHistoriqueCreneauxApi(params?: { page?: number; size?: number }) {
  const data = await getCreneauxListApi({ page: params?.page ?? 0, size: params?.size ?? 20 });
  if (!data) return null;

  return {
    items: data.content.map((c) => ({
      id: c.id,
      code: c.label,
      periodeDebut: c.dateDebut,
      periodeFin: c.dateFin,
      // TODO: champs manquants — voir spec backend
      livreurs: 0,
      tickets: c.nbTicketsPending,
      netFcfa: 0,
      soumisLe: '',
      soumisParNom: '',
      statut: mapStatut(c.statut),
      commentaire: undefined,
    })),
    totalElements: data.totalElements,
  };
}
