import { Chip, type ChipProps } from '@heroui-v3/react';

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import type { ICreneauDetailLivreur, StatutLivreurDetail } from '../types/historique-creneaux.type';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

/**
 * Les trois etats d'un livreur dans le lot, rendus par `Chip`.
 *
 * <p>Les pastilles etaient des `span` habilles a la main en `bg-green-100 text-green-700`
 * et `bg-red-100 text-red-600`, sans variante sombre. Depuis que la bascule de theme est
 * dans l'en-tete, le comptable qui travaillait en sombre lisait du vert pastel sur fond
 * sombre : le statut devenait illisible sur la colonne meme qui dit si la ligne part en
 * paiement ou non.</p>
 *
 * <p>Ici, contrairement au statut de ticket qui compte SIX crans, l'echelle semantique de
 * la v3 suffit exactement : succes, danger, neutre. Aucune couleur n'a donc a etre ecrite
 * a la main, et les deux themes sont couverts par le composant.</p>
 */
const STATUT_CHIP: Record<StatutLivreurDetail, { label: string; couleur: ChipProps['color'] }> = {
  OK:      { label: 'OK',      couleur: 'success' },
  REJETE:  { label: 'Rejeté',  couleur: 'danger' },
  ATTENTE: { label: 'Attente', couleur: 'default' },
};

interface Props {
  livreurs: ICreneauDetailLivreur[];
  /**
   * Totaux SERVEUR (`grille.stats`), pas des sommes recalculees sur `livreurs`.
   *
   * <p>La requete est plafonnee a 100 lignes et cet ecran ne pagine pas. Recompter sur
   * le tableau recu donnait donc « 100 livreurs » dans cet en-tete, a quelques pixels
   * d'une carte KPI qui affichait, elle, le vrai total serveur — deux chiffres
   * contradictoires sur le meme ecran, le second fige a 100 des que le creneau
   * depassait 100 livreurs. Le creneau etant HEBDOMADAIRE et le parc comptant environ
   * 190 livreurs, le depassement est le cas normal, pas l'exception.</p>
   */
  totalLivreurs: number;
  totalTickets: number;
}

export default function HistoriqueCreneauDetailLivreurs({ livreurs, totalLivreurs, totalTickets }: Props) {
  // Les lignes 101 et suivantes ne sont pas rendues et rien ne le signalait. On le dit,
  // sur la formulation deja employee par orientation-fonds-view.tsx.
  const tronque = livreurs.length < totalLivreurs;

  return (
    <div className="rounded-xl border border-separator bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-separator">
        <h2 className="text-sm font-semibold text-foreground">Détail livreurs</h2>
        <p className="text-xs text-muted mt-0.5">
          {totalLivreurs} livreurs · {totalTickets} tickets
          {tronque && (
            <span className="ml-2 text-muted">{livreurs.length} affichés</span>
          )}
        </p>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <Table
        aria-label="Détail livreurs"
        removeWrapper
        classNames={{
          base: 'hidden md:block',
          th: 'bg-surface-secondary text-[10px] font-bold uppercase tracking-wide text-muted py-3 px-4',
          td: 'py-3 px-4 border-b border-separator',
          tr: 'hover:bg-surface-secondary/50 transition-colors',
        }}
      >
        <TableHeader>
          <TableColumn>Turboy</TableColumn>
          {/*
            Quatre colonnes de chiffres qui se comparent d'une ligne a l'autre : elles
            s'alignent a droite en chasse tabulaire, sinon « 1 250 » et « 980 » ne se
            lisent qu'en comptant les caracteres.
          */}
          <TableColumn align="end">Tickets</TableColumn>
          <TableColumn align="end">Brut</TableColumn>
          <TableColumn align="end">Taux</TableColumn>
          <TableColumn align="end">Net</TableColumn>
          <TableColumn>Statut</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Aucun livreur">
          {livreurs.map((l) => {
            const chip = STATUT_CHIP[l.statut];
            return (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{l.nom}</span>
                    <span className="text-[11px] text-muted">{l.code}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums text-foreground">{l.tickets}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums text-foreground">{fmt(l.brut)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums text-foreground">{l.taux}%</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold tabular-nums text-success-soft-foreground">{fmt(l.net)}</span>
                </TableCell>
                <TableCell>
                  <Chip color={chip.couleur} size="sm" variant="soft">
                    {chip.label}
                  </Chip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {livreurs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucun livreur</p>
        ) : (
          livreurs.map((l) => {
            const chip = STATUT_CHIP[l.statut];
            return (
              <div key={l.id} className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{l.nom}</p>
                    <p className="text-[11px] text-muted">{l.code}</p>
                  </div>
                  <Chip className="shrink-0" color={chip.couleur} size="sm" variant="soft">
                    {chip.label}
                  </Chip>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Tickets</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{l.tickets}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Brut</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{fmt(l.brut)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Taux</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{l.taux}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Net</span>
                  <span className="text-right text-sm font-semibold tabular-nums text-success-soft-foreground">{fmt(l.net)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
