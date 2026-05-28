import * as XLSX from 'xlsx';
import {
  IGrillePaiementCreneau,
  IGrillePaiementLigne,
  TypeLivreur,
} from '../types/grille-paiement.type';

/**
 * V54 (2026-05) — Export Excel décomposé par type de collaborateur.
 *
 * <p>Avant : un seul onglet "Grille de paiement" avec un net à payer
 * agrégé, qui ne distinguait pas les Indépendants des Journaliers et
 * Superviseurs. Le Comptable était obligé de re-trier à la main et la
 * comptabilité confondait régulièrement les 3 populations.</p>
 *
 * <p>Maintenant :
 * <ul>
 *   <li>Onglet 1 "Grille de paiement" : lignes triées par type
 *       (Indépendants → Journaliers → Superviseurs → À catégoriser), avec
 *       2 colonnes ajoutées (Type, Inclus dans paie) et des lignes de
 *       sous-totaux entre chaque groupe.</li>
 *   <li>Onglet 2 "Récapitulatif" : décomposition explicite du Total Net
 *       vérifié (tous) vs. Total à payer (Indépendants inclus) avec
 *       compteurs par type.</li>
 * </ul>
 * </p>
 */

/** Ordre métier des groupes dans l'onglet 1 — Indépendants en tête car
 *  c'est la seule population payée via cet export. */
const TYPE_ORDER: ReadonlyArray<TypeLivreur | null> = [
  'INDEPENDANT',
  'JOURNALIER',
  'SUPERVISEUR',
  null, // "À catégoriser" en dernier — action RH requise.
];

function typeLabel(type: TypeLivreur | null | undefined): string {
  switch (type) {
    case 'INDEPENDANT':
      return 'Indépendant';
    case 'JOURNALIER':
      return 'Journalier';
    case 'SUPERVISEUR':
      return 'Superviseur';
    default:
      return 'À catégoriser';
  }
}

/** Inclusion effective — même règle que le backend / la table UI. */
function effectiveInclusion(l: IGrillePaiementLigne): boolean {
  if (l.inclusDansPaie !== null && l.inclusDansPaie !== undefined) {
    return l.inclusDansPaie;
  }
  return l.typeLivreur === 'INDEPENDANT';
}

/** Auto-fit naïf : prend le max(longueur clé, longueur valeurs) capé à 40. */
function autoFitColumns(rows: ReadonlyArray<ReadonlyArray<unknown>>): { wch: number }[] {
  if (rows.length === 0) return [];
  const widths: number[] = rows[0].map(() => 0);
  rows.forEach((row) => {
    row.forEach((cell, idx) => {
      const len = String(cell ?? '').length;
      if (len > (widths[idx] ?? 0)) widths[idx] = len;
    });
  });
  return widths.map((w) => ({ wch: Math.min(w + 2, 40) }));
}

interface SousTotal {
  type: TypeLivreur | null;
  nbLivreurs: number;
  nbTickets: number;
  brut: number;
  net: number;
}

export function generateXlsGrillePaiement(
  grille: IGrillePaiementCreneau,
  lignes: IGrillePaiementLigne[],
): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  // ─── Onglet 1 — Grille de paiement ─────────────────────────────────
  // En-têtes. Les 2 nouvelles colonnes (Type, Inclus dans paie) sont
  // insérées juste après le code Turboy pour rester en évidence.
  const header = [
    'Nom Turboy',
    'Code Turboy',
    'Type',
    'Inclus dans paie',
    'Nb Tickets',
    'Montant Brut',
    'Taux (%)',
    'Bonus',
    'Déductions',
    'Net à payer',
    'N° Wave',
    'Statut',
  ];

  // Regroupement par type, dans l'ordre métier défini par TYPE_ORDER.
  const groupes = new Map<TypeLivreur | null, IGrillePaiementLigne[]>();
  TYPE_ORDER.forEach((t) => groupes.set(t, []));
  lignes.forEach((l) => {
    const key = (l.typeLivreur ?? null) as TypeLivreur | null;
    if (!groupes.has(key)) groupes.set(key, []);
    groupes.get(key)!.push(l);
  });

  const rows: (string | number)[][] = [header];
  const sousTotaux: SousTotal[] = [];
  let totalGeneral = { brut: 0, net: 0, tickets: 0, livreurs: 0 };

  TYPE_ORDER.forEach((type) => {
    const groupe = groupes.get(type) ?? [];
    if (groupe.length === 0) return;

    const st: SousTotal = {
      type,
      nbLivreurs: groupe.length,
      nbTickets: 0,
      brut: 0,
      net: 0,
    };

    groupe.forEach((l) => {
      const included = effectiveInclusion(l);
      rows.push([
        l.turboy.nom,
        l.turboy.code ?? '',
        typeLabel(l.typeLivreur),
        included ? 'Oui' : 'Non',
        l.tickets,
        l.brut,
        l.taux,
        l.bonus ? 'Oui' : 'Non',
        l.deductions,
        l.netAPayer,
        l.numeroWave ?? '',
        l.statut === 'OK' ? 'OK' : 'Wave manquant',
      ]);
      st.nbTickets += l.tickets;
      st.brut += l.brut;
      st.net += l.netAPayer;
    });

    // Ligne de sous-total — colonne A vide, colonne B "SOUS-TOTAL", suivi
    // du type, puis somme tickets / brut / net dans leurs colonnes.
    rows.push([
      '',
      'SOUS-TOTAL',
      typeLabel(type),
      `${st.nbLivreurs} livreur${st.nbLivreurs > 1 ? 's' : ''}`,
      st.nbTickets,
      st.brut,
      '',
      '',
      '',
      st.net,
      '',
      '',
    ]);
    // Ligne vide pour aérer les groupes.
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);

    sousTotaux.push(st);
    totalGeneral.brut += st.brut;
    totalGeneral.net += st.net;
    totalGeneral.tickets += st.nbTickets;
    totalGeneral.livreurs += st.nbLivreurs;
  });

  // Total Net vérifié = somme TOUTES populations (audit comptable).
  rows.push([
    '',
    'TOTAL NET VÉRIFIÉ',
    '(toutes populations)',
    `${totalGeneral.livreurs} livreur${totalGeneral.livreurs > 1 ? 's' : ''}`,
    totalGeneral.tickets,
    totalGeneral.brut,
    '',
    '',
    '',
    totalGeneral.net,
    '',
    '',
  ]);

  // Total à payer = somme Indépendants inclus uniquement.
  const totalAPayer =
    grille.stats.totalAPayer ??
    sousTotaux
      .filter((st) => st.type === 'INDEPENDANT')
      .reduce((acc, st) => acc + st.net, 0);
  const nbIndependants = grille.stats.nbIndependants ?? sousTotaux.find((s) => s.type === 'INDEPENDANT')?.nbLivreurs ?? 0;
  rows.push([
    '',
    'TOTAL À PAYER',
    '(Indépendants inclus)',
    `${nbIndependants} livreur${nbIndependants > 1 ? 's' : ''}`,
    '',
    '',
    '',
    '',
    '',
    totalAPayer,
    '',
    '',
  ]);

  const sheet1 = XLSX.utils.aoa_to_sheet(rows);
  sheet1['!cols'] = autoFitColumns(rows);
  XLSX.utils.book_append_sheet(workbook, sheet1, 'Grille de paiement');

  // ─── Onglet 2 — Récapitulatif ───────────────────────────────────────
  const totalNetVerifie = grille.stats.totalNetVerifie ?? grille.stats.totalNet;
  const recap: (string | number)[][] = [
    [`Créneau ${grille.code}`, ''],
    [
      `Période : ${grille.debut?.split('T')[0] ?? ''} → ${grille.fin?.split('T')[0] ?? ''}`,
      '',
    ],
    ['', ''],
    ['Vue d\'ensemble', ''],
    ['Livreurs', grille.stats.totalLivreurs],
    ['Tickets', grille.stats.totalTickets],
    ['Total Brut (FCFA)', grille.stats.totalBrut],
    ['Wave manquants', grille.stats.waveManquants],
    ['', ''],
    ['Décomposition financière', ''],
    ['Total Net vérifié (FCFA) — tous', totalNetVerifie ?? 0],
    ['Total à payer (FCFA) — Indépendants', totalAPayer ?? 0],
    ['', ''],
    ['Détail par type', 'Nb livreurs'],
    ['Indépendants', grille.stats.nbIndependants ?? 0],
    ['Journaliers (hors paie hebdo)', grille.stats.nbJournaliers ?? 0],
    ['Superviseurs (salariés)', grille.stats.nbSuperviseurs ?? 0],
    ['À catégoriser (RH)', grille.stats.nbACategoriser ?? 0],
    ['', ''],
    ['Détail par type', 'Net (FCFA)'],
    ['Indépendants', grille.stats.dontIndependants ?? totalAPayer ?? 0],
    ['Journaliers (autre circuit)', grille.stats.dontJournaliers ?? 0],
    ['Superviseurs (salariés)', grille.stats.dontSuperviseurs ?? 0],
    ['À catégoriser (exclus)', grille.stats.dontACategoriser ?? 0],
  ];
  const sheet2 = XLSX.utils.aoa_to_sheet(recap);
  sheet2['!cols'] = [{ wch: 40 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(workbook, sheet2, 'Récapitulatif');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
