'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { TicketPaie } from '@/src/performance/fiche-livreur.action';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

interface Journee {
  cle: string;
  libelle: string;
  tickets: TicketPaie[];
  fraisLivraison: number;
  commission: number;
}

/**
 * Le détail journalier, exigence 2.4 du cahier des charges.
 *
 * <p>« La vue hebdomadaire ne doit plus se limiter à un total de tickets par semaine :
 * chaque jour doit être cliquable et ouvrir le détail de la journée, à savoir la liste des
 * courses réalisées ce jour-là, avec pour chacune l'heure, la référence et le montant. »</p>
 *
 * <h3>Un volet qui se déplie, pas un autre écran</h3>
 * <p>Le cahier des charges le demande explicitement : « ce détail doit rester consultable
 * SANS QUITTER la fiche du livreur, pour permettre un contrôle course par course sans devoir
 * ressortir vers un autre module ». Le jour se déplie sous sa propre ligne.</p>
 *
 * <h3>D'où viennent les courses</h3>
 * <p>De la grille de paie, qui les détaille ticket par ticket. C'est la même source que les
 * montants de la fiche : le cumul d'un jour est donc, par construction, la somme des lignes
 * qu'on déplie. Aucun second calcul ne peut en diverger.</p>
 */
export function DetailJournalier({ tickets }: { tickets: TicketPaie[] }) {
  const [ouvert, setOuvert] = useState<string | null>(null);

  if (tickets.length === 0) {
    return (
      <p className="rounded-lg bg-surface-secondary px-4 py-3 text-sm text-muted">
        Aucune course sur cette semaine.
      </p>
    );
  }

  /*
   * Regroupement par JOUR CALENDAIRE de la course. Les tickets arrivent dans l'ordre de la
   * grille ; on les range par jour décroissant, le plus récent d'abord, parce qu'un
   * responsable qui ouvre la fiche cherche d'abord ce qui vient de se passer.
   */
  const parJour = new Map<string, Journee>();

  for (const t of tickets) {
    const d = new Date(t.date);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!parJour.has(cle)) {
      parJour.set(cle, {
        cle,
        libelle: `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`,
        tickets: [],
        fraisLivraison: 0,
        commission: 0,
      });
    }

    const j = parJour.get(cle)!;
    j.tickets.push(t);
    j.fraisLivraison += t.fraisLivraison ?? 0;
    j.commission += t.commission ?? 0;
  }

  const journees = Array.from(parJour.values()).sort((a, b) => b.cle.localeCompare(a.cle));

  const heure = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ul className="divide-y divide-default-200 rounded-large border border-default-200">
      {journees.map((j) => {
        const estOuvert = ouvert === j.cle;

        return (
          <li key={j.cle}>
            <button
              aria-expanded={estOuvert}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => setOuvert(estOuvert ? null : j.cle)}
              type="button"
            >
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  'size-4 shrink-0 text-default-400 transition-transform',
                  estOuvert && 'rotate-90',
                )}
              />
              <span className="flex-1 text-sm font-medium capitalize text-foreground">
                {j.libelle}
              </span>
              <span className="text-sm tabular-nums text-muted">
                {formatNumber(j.tickets.length)} course{j.tickets.length > 1 ? 's' : ''}
              </span>
              <span className="w-28 text-right text-sm font-semibold tabular-nums text-foreground">
                {formatMontant(j.commission)}
              </span>
            </button>

            {estOuvert && (
              <div className="overflow-x-auto border-t border-default-200 bg-surface-secondary px-4 py-3">
                <table className="w-full min-w-[34rem] text-xs">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-default-500">
                      <th className="pb-2 pr-3 font-medium" scope="col">Heure</th>
                      <th className="pb-2 pr-3 font-medium" scope="col">Référence</th>
                      <th className="pb-2 pr-3 font-medium" scope="col">Partenaire</th>
                      <th className="pb-2 pr-3 text-right font-medium" scope="col">Frais</th>
                      <th className="pb-2 text-right font-medium" scope="col">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-200">
                    {j.tickets.map((t) => (
                      <tr key={t.ref}>
                        <td className="py-1.5 pr-3 tabular-nums text-muted">{heure(t.date)}</td>
                        <td className="py-1.5 pr-3 font-mono text-foreground">{t.ref}</td>
                        <td className="max-w-[14rem] truncate py-1.5 pr-3 text-muted" title={t.partenaire}>
                          {t.partenaire}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums text-muted">
                          {formatMontant(t.fraisLivraison)}
                        </td>
                        <td className="py-1.5 text-right font-medium tabular-nums text-foreground">
                          {formatMontant(t.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Le cumul du jour, sous les lignes qui le composent : il se verifie a l'oeil. */}
                  <tfoot>
                    <tr className="border-t border-default-300 font-semibold text-foreground">
                      <td className="pt-2" colSpan={3}>
                        Cumul du jour
                      </td>
                      <td className="pt-2 pr-3 text-right tabular-nums">
                        {formatMontant(j.fraisLivraison)}
                      </td>
                      <td className="pt-2 text-right tabular-nums">{formatMontant(j.commission)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
