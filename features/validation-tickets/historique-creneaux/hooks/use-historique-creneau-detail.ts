'use client';

import { useMemo } from 'react';
import { useGrillePaiementQuery } from '@/features/validation-tickets/grille-de-paiement/queries/grille-paiement.query';
import type {
  ICreneauDetail,
  ICreneauDetailLivreur,
  ICreneauTimelineEvent,
  StatutLivreurDetail,
} from '../types/historique-creneaux.type';

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

function mapStatutLigne(statut: string): StatutLivreurDetail {
  if (statut === 'OK') return 'OK';
  return 'ATTENTE';
}

// TODO: remplacer par la timeline réelle quand l'endpoint backend est disponible
const MOCK_TIMELINE: ICreneauTimelineEvent[] = [
  { id: '1', titre: 'Créneau créé automatiquement', date: '—', acteurNom: 'Système', acteurRole: 'Workflow', type: 'creation' },
  { id: '2', titre: 'Soumis pour vérification V1',  date: '—', acteurNom: '—',       acteurRole: 'Saisie',    type: 'soumission' },
];

export default function useHistoriqueCreneauDetail(id: string) {
  const { data: grille, isLoading } = useGrillePaiementQuery({ creneauId: id, page: 0, size: 100 });

  const detail: ICreneauDetail | null = useMemo(() => {
    if (!grille) return null;

    const livreurs: ICreneauDetailLivreur[] = grille.lignes.content.map((l) => ({
      id: l.id ?? '',
      nom: l.turboy.nom,
      code: l.turboy.code ?? '',
      tickets: l.tickets,
      brut: l.brut,
      taux: l.taux,
      net: l.netAPayer,
      statut: mapStatutLigne(l.statut ?? 'WAVE_MANQUANT'),
    }));

    return {
      id: grille.id,
      code: grille.code,
      periodeDebut: formatDate(grille.debut),
      periodeFin: formatDate(grille.fin),
      statut: 'EN_ATTENTE' as const,  // TODO: depuis API enrichie (lotStatut)
      soumisLe: '',      // TODO: depuis LotTable.soumisAt
      soumisParNom: '',  // TODO: depuis LotTable.soumisPar résolu
      derniereAction: '',
      motifRegularisation: undefined,
      kpi: {
        livreurs: grille.stats.totalLivreurs,
        tickets: grille.stats.totalTickets,
        totalBrut: grille.stats.totalBrut,
        totalNet: grille.stats.totalNet,
      },
      livreurs,
      timeline: MOCK_TIMELINE,
    };
  }, [grille]);

  return { detail, isLoading };
}
