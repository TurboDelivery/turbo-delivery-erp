'use client';

import { ReactNode } from 'react';
import { Chip, Table } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { IEncoursReleve, cycleLabel, formatFcfa } from '@/features/encours';
import { formatPeriodeFacturee, formatPeriodeFactureeEncours } from '@/lib/finance/periode-facturee';

type Cell = { node: ReactNode; cn?: string };
type Line = { key: string; cn?: string; cells: Cell[] };

const STATUT_COLOR: Record<string, 'danger' | 'default' | 'success' | 'warning'> = {
  'En cours': 'default',
  'En retard': 'danger',
  Partiel: 'warning',
  Payé: 'success',
};

/**
 * §5.1 — la periode reellement couverte.
 *
 * Une facture sur plage libre n'a pas de cycle : ses bornes SONT sa periode, et les
 * afficher telles quelles est la seule reponse juste. La reconstruction depuis
 * (annee, mois, cycle) affichait le mois entier pour une facture du 1er au 7 aout,
 * c'est-a-dire une periode que la facture ne couvre pas. Les factures de cycle
 * continuent de passer par le formateur partage, pour que le rendu reste identique a
 * celui de Finance-Recouvrement.
 */
function formatPeriodeLibre(
  debut: string,
  fin: string | null | undefined,
  mode: string | null | undefined,
  cycle: string,
): string {
  const cycleEffectif = mode === 'Plage de dates' ? 'HEBDOMADAIRE' : cycle;
  return formatPeriodeFacturee(cycleEffectif, debut, fin ?? debut);
}

function StatutChip({ statut }: { statut: string }) {
  return (
    <Chip color={STATUT_COLOR[statut] ?? 'default'} size="sm" variant="soft">
      <Chip.Label>{statut}</Chip.Label>
    </Chip>
  );
}

/**
 * Tableau ENCOURS v3 — détail FACTURE PAR FACTURE (§6.1). Cascade Partenaire → Store →
 * factures (mois / quinzaine / semaine), colonnes Total à payer · Acompte · Solde · Statut,
 * sous-total par partenaire, total général. En-tête collant. (Desktop — voir cartes mobile.)
 */
export function EncoursTable({ releve }: { releve: IEncoursReleve }) {
  const numCn = 'text-right tabular-nums whitespace-nowrap';
  const cols = [
    { key: 'store', label: 'Store', cn: 'text-left' },
    // « Période facturée » : fusion des anciennes colonnes Période + Facture,
    // formatée selon le cycle du partenaire (logique partagée avec Finance-Recouvrement).
    { key: 'periode', label: 'Période facturée', cn: 'text-left' },
    { key: 'tap', label: 'Total à payer', cn: 'text-right' },
    { key: 'acompte', label: 'Acompte', cn: 'text-right' },
    { key: 'solde', label: 'Solde', cn: 'text-right' },
    { key: 'statut', label: 'Statut', cn: 'text-center' },
  ];

  const empt = (n: number): Cell[] => Array.from({ length: n }, () => ({ node: '' }));
  const lines: Line[] = [];

  (releve.partenaires ?? []).forEach((p, pi) => {
    lines.push({
      key: `g-${pi}`,
      cn: 'bg-surface-secondary',
      cells: [
        {
          node: (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{p.groupe}</span>
              {/* Le cycle est une ETIQUETTE, pas un etat : trois teintes de plus sur un
                  releve ou la couleur doit dire le statut de paiement. */}
              <Chip size="sm" variant="soft">
                <Chip.Label>{cycleLabel(p.cycle)}</Chip.Label>
              </Chip>
            </div>
          ),
        },
        ...empt(5),
      ],
    });

    p.stores.forEach((s, si) => {
      s.factures.forEach((f, fi) => {
        const aVenir = f.statut === 'À venir';
        lines.push({
          key: `g${pi}-s${si}-f${fi}`,
          cn: aVenir ? 'text-muted' : undefined,
          cells: [
            {
              node:
                fi === 0 ? (
                  <span className="flex items-center gap-2 pl-3 font-medium text-foreground">
                    <span className="size-1.5 rounded-full bg-surface-tertiary" />
                    {s.store}
                  </span>
                ) : (
                  ''
                ),
            },
            {
              // §5.1 — « L'affichage doit indiquer clairement la PÉRIODE COUVERTE ».
              // Quand le backend envoie les bornes réelles, on les utilise : la
              // reconstruction depuis (année, mois, cycle) affichait le mois entier pour
              // une facture du 1er au 7 août, c'est-à-dire une période que la facture ne
              // couvre pas. Le repli sur la reconstruction reste pour les lignes
              // « À venir », qui n'ont pas de facture derrière.
              node: f.complement ? (
                // Une periode facturee en frais + commission reste UNE periode : la
                // seconde ligne se presente comme un complement de celle du dessus,
                // sans repeter les dates (arbitrage du 17/08/2026).
                <div className="flex items-center gap-2 pl-6 text-[12px] text-muted">
                  <span>+</span>
                  <span>{f.objet}</span>
                  {f.factureLieeCode ? (
                    <span className="text-muted">liée à {f.factureLieeCode}</span>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="whitespace-nowrap">
                    {f.periodeDebut
                      ? formatPeriodeLibre(f.periodeDebut, f.periodeFin, f.mode, p.cycle)
                      : formatPeriodeFactureeEncours(releve.annee, f.mois, p.cycle, f.libelle)}
                  </span>
                  {f.objet && f.objet !== 'Globale' ? (
                    <span className="text-[11px] text-muted">
                      {f.objet}
                      {f.factureLieeCode ? ` · liée à ${f.factureLieeCode}` : ''}
                    </span>
                  ) : null}
                  {f.mode === 'Plage de dates' ? (
                    <span className="text-[11px] text-muted">
                      Plage de dates{f.origine === 'REPRISE' ? ' · reprise' : ''}
                    </span>
                  ) : null}
                </div>
              ),
              cn: undefined,
            },
            { node: formatFcfa(f.totalAPayer), cn: numCn },
            {
              node: f.acompte ? formatFcfa(f.acompte) : <span className="text-muted">—</span>,
              cn: numCn,
            },
            { node: <span className="font-semibold text-foreground">{formatFcfa(f.solde)}</span>, cn: numCn },
            { node: <StatutChip statut={f.statut} />, cn: 'text-center' },
          ],
        });
      });
    });

    lines.push({
      key: `g${pi}-st`,
      // Un sous-total n'est pas un avertissement : il etait peint en `bg-amber-50/70`
      // avec trois nuances de `text-amber-*`. Il se distingue par la SURFACE, la graisse
      // et un trait qui FERME le bloc du partenaire — sans lui, l'ouverture et la
      // fermeture du bloc portaient exactement la meme bande.
      cn: 'border-t border-separator bg-surface-secondary',
      cells: [
        { node: <span className="font-semibold text-foreground">Sous-total {p.groupe}</span> },
        { node: '' },
        { node: <span className="font-semibold text-foreground">{formatFcfa(p.sousTotalFacture)}</span>, cn: numCn },
        {
          node: (
            <span className="font-medium text-muted">
              {p.deduction ? `- ${formatFcfa(p.deduction)}` : '—'}
            </span>
          ),
          cn: numCn,
        },
        { node: <span className="font-bold text-foreground">{formatFcfa(p.sousTotalReste)}</span>, cn: numCn },
        { node: '' },
      ],
    });
  });

  // 2026-07-27 — la ligne TOTAL n'affiche que les déductions réellement APPLIQUÉES aux
  // groupes du relevé courant (Σ partenaires[].deduction, déjà soustraites de totalReste).
  // totalDeductions = registre ANNUEL (dont des groupes absents : AGHA, CHICKEN NATION…)
  // → l'afficher ici rendait la ligne arithmétiquement fausse (facture − déductions ≠ reste).
  // Le registre annuel complet reste visible dans le « Récapitulatif des déductions ».
  const deductionsAppliquees = releve.partenaires.reduce((s, p) => s + (p.deduction || 0), 0);
  lines.push({
    key: 'total-general',
    cn: 'border-t-2 border-separator bg-surface-tertiary',
    cells: [
      { node: <span className="font-bold text-foreground">TOTAL GÉNÉRAL</span> },
      { node: '' },
      { node: <span className="font-bold text-foreground">{formatFcfa(releve.totalFacture)}</span>, cn: numCn },
      {
        node: (
          <span className="font-semibold text-muted">
            {deductionsAppliquees ? `- ${formatFcfa(deductionsAppliquees)}` : '—'}
          </span>
        ),
        cn: numCn,
      },
      { node: <span className="text-base font-bold text-foreground">{formatFcfa(releve.totalReste)}</span>, cn: numCn },
      { node: '' },
    ],
  });

  return (
    <Table>
      <Table.ScrollContainer className="max-h-[64vh] overflow-y-auto">
        <Table.Content
          aria-label="Relevé des restes à payer — détail factures"
          className="min-w-[52rem]"
        >
          <Table.Header>
            {cols.map((c) => (
              <Table.Column
                className={cn('sticky top-0 z-20 bg-surface-secondary', c.cn)}
                id={c.key}
                isRowHeader={c.key === 'store'}
                key={c.key}
              >
                {c.label}
              </Table.Column>
            ))}
          </Table.Header>

          <Table.Body
            renderEmptyState={() => (
              <p className="py-8 text-center text-sm text-muted">
                Aucun reste à payer pour cette sélection.
              </p>
            )}
          >
            {lines.map((l) => (
              <Table.Row id={l.key} key={l.key}>
                {l.cells.map((cell, i) => (
                  <Table.Cell className={cn(l.cn, cell.cn)} key={cols[i].key}>
                    {cell.node}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
