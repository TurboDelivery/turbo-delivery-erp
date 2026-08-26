import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';

import type { IHistoriqueCreneauxStats } from '../types/historique-creneaux.type';

interface Props {
  stats: IHistoriqueCreneauxStats;
}

/**
 * Bandeau de tete de l'historique des creneaux.
 *
 * <p>Il portait quatre fois le meme bloc, dont les couleurs etaient ecrites en classes de
 * palette brutes (gray/green/amber/red). Elles passent par les tons de `CarteStat` pour
 * que le retour du mode sombre ne demande aucune retouche ici.</p>
 */
export default function HistoriqueCreneauxStats({ stats }: Props) {
  return (
    <GrilleStats colonnes={4}>
      <CarteStat libelle="Créneaux au total" valeur={stats.total} />
      <CarteStat libelle="Créneaux payés" valeur={stats.payes} ton="succes" />
      <CarteStat libelle="En régularisation" valeur={stats.enRegularisation} ton="attention" />
      <CarteStat libelle="Rejets" valeur={stats.rejets} ton="danger" />
    </GrilleStats>
  );
}
