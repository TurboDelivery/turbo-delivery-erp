'use client';

import CarteStat, { GrilleStats, type TonStat } from '@/components/commons/CarteStat';

import { ISupervisionStats } from '../types';

/**
 * Les quatre compteurs de tête d'écran (`GET /api/erp/supervision/stats`).
 * Ordre et libellés repris de la spec — ce sont les chiffres que la Direction
 * lit en premier.
 *
 * <p>Le bandeau portait sa propre carte, identique au caractère près à celle du module
 * Personnel : même libellé 11 px en capitales, même valeur `text-2xl font-semibold
 * tabular-nums` colorée par jeton, même note. Les deux passent par `CarteStat`.</p>
 */
export function SupervisionKpis({ stats, isLoading }: { stats?: ISupervisionStats; isLoading: boolean }) {
  const compteurs: { libelle: string; valeur: number | undefined; note: string; ton: TonStat }[] = [
    { libelle: 'En ligne', valeur: stats?.enLigne, note: 'sessions actives à cet instant', ton: 'succes' },
    { libelle: 'Actions tracées (24 h)', valeur: stats?.actions24h, note: 'tous modules confondus', ton: 'primaire' },
    { libelle: 'Jamais connectés', valeur: stats?.jamaisConnectes, note: "indicateur d'adoption — à former", ton: 'attention' },
    { libelle: 'Échecs de connexion (24 h)', valeur: stats?.echecs24h, note: 'signal de sécurité', ton: 'danger' },
  ];

  return (
    <GrilleStats colonnes={4}>
      {compteurs.map((c) => (
        <CarteStat
          key={c.libelle}
          libelle={c.libelle}
          valeur={c.valeur ?? 0}
          note={c.note}
          ton={c.ton}
          isLoading={isLoading}
        />
      ))}
    </GrilleStats>
  );
}
