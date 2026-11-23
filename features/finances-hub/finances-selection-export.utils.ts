// L'export de la SÉLECTION (maquette, planches 1 et 3) : ce que les filtres laissent voir,
// toutes pages confondues, rejetées exclues. Un Excel et un vrai PDF A4 paysage.
//
// ⚠ Il part des MÊMES lignes et du MÊME calcul (`statsSelection`) que les cartes et le pied
// du tableau. Un export qui referait sa somme de son côté finirait par annoncer un autre
// total que l'écran, et c'est le fichier qu'on croirait.

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { autoFitColumns } from '@/features/tickets/utils/export.utils';

import { FinanceStatut, IFinanceItem, IStatsSelection, statsSelection, STATUTS_FINANCE } from './finances-hub.utils';

export interface ContexteExportSelection {
  /** Les catégories filtrées, par leur NOM. Vide = toutes. */
  categories: string[];
  /** « 2026-08 ». */
  moisCle: string;
  /** « août 2026 ». */
  moisLibelle: string;
  /** L'onglet : Toutes, Charges fixes, Dépenses variables, Bon à payer. */
  typeLibelle: string;
  statuts: FinanceStatut[];
  recherche: string;
  /** Qui exporte, et à quel titre : le fichier circule, il doit dire d'où il vient. */
  auteur: string;
  maintenant: Date;
}

const LIBELLE_STATUT: Record<FinanceStatut, string> = Object.fromEntries(
  STATUTS_FINANCE.map((s) => [s.cle, s.libelle]),
) as Record<FinanceStatut, string>;

const deux = (n: number) => String(n).padStart(2, '0');

/**
 * Depenses_<CATEGORIE|MULTI|TOUTES>_<AAAA-MM>_<AAAAMMJJ-HHmm> (maquette).
 *
 * <p>Le nom dit ce que le fichier contient : une catégorie, plusieurs, ou toutes. Deux
 * exports faits dans la même minute sur deux filtres ne s'écrasent donc pas, et un fichier
 * retrouvé dans un dossier de téléchargements se comprend sans l'ouvrir.</p>
 */
export function nomFichierSelection(ctx: Pick<ContexteExportSelection, 'categories' | 'maintenant' | 'moisCle'>): string {
  const partie =
    ctx.categories.length === 0
      ? 'TOUTES'
      : ctx.categories.length > 1
        ? 'MULTI'
        : ctx.categories[0]
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
  const d = ctx.maintenant;
  const horodatage = `${d.getFullYear()}${deux(d.getMonth() + 1)}${deux(d.getDate())}-${deux(d.getHours())}${deux(d.getMinutes())}`;
  return `Depenses_${partie}_${ctx.moisCle}_${horodatage}`;
}

/** La ligne des filtres appliqués, telle qu'elle ouvre le PDF et la synthèse Excel. */
export function ligneFiltres(ctx: ContexteExportSelection): string {
  const tousSaufRejete = ctx.statuts.length === 4 && !ctx.statuts.includes('rejete');
  const statuts =
    ctx.statuts.length === STATUTS_FINANCE.length
      ? 'tous'
      : tousSaufRejete
        ? 'tous sauf rejeté'
        : ctx.statuts.map((s) => LIBELLE_STATUT[s]).join(', ') || 'aucun';
  return [
    `Période : ${ctx.moisLibelle}`,
    `Type : ${ctx.typeLibelle.toLowerCase()}`,
    `Catégorie : ${ctx.categories.length ? ctx.categories.join(' + ') : 'toutes'}`,
    `Statuts : ${statuts}`,
    `Recherche : ${ctx.recherche.trim() || 'aucune'}`,
  ].join(' · ');
}

/** Les lignes EXPORTÉES : la sélection moins les rejetées, qui n'entrent dans aucun total. */
export const lignesExportees = (selection: IFinanceItem[]) => selection.filter((i) => i.statut !== 'rejete');

const typeLibelle = (t: IFinanceItem['type']) => (t === 'fixe' ? 'Fixe' : 'Variable');
/** Visa et accord se LISENT sur le statut : visée dès « Visé DGA », accordée dès « Approuvé DG ». */
const visaDga = (s: FinanceStatut) => (s === 'vise' || s === 'approuve' || s === 'paye' ? 'Oui' : '—');
const accordDg = (s: FinanceStatut) => (s === 'approuve' || s === 'paye' ? 'Oui' : '—');

/** Excel : une feuille de synthèse et le détail, montants en NOMBRES pour rester sommables. */
export function genererSelectionXlsx(selection: IFinanceItem[], ctx: ContexteExportSelection): ArrayBuffer {
  const lignes = lignesExportees(selection);
  const st = statsSelection(lignes);
  const wb = XLSX.utils.book_new();

  const synthese = [
    { Indicateur: 'Filtres', Valeur: ligneFiltres(ctx) },
    { Indicateur: 'Total cumulé (FCFA)', Valeur: Math.round(st.total) },
    { Indicateur: "Nombre d'opérations", Valeur: st.n },
    { Indicateur: 'Montant moyen (FCFA)', Valeur: Math.round(st.moyenne) },
    { Indicateur: 'Montant minimum (FCFA)', Valeur: Math.round(st.min) },
    { Indicateur: 'Montant maximum (FCFA)', Valeur: Math.round(st.max) },
    { Indicateur: 'Payé (FCFA)', Valeur: Math.round(st.paye) },
    { Indicateur: 'Opérations payées', Valeur: st.nbPayees },
    { Indicateur: 'Reste à payer (FCFA)', Valeur: Math.round(st.reste) },
    { Indicateur: 'Opérations restant à payer', Valeur: st.nbReste },
    { Indicateur: 'Généré par', Valeur: ctx.auteur },
    { Indicateur: 'Généré le', Valeur: ctx.maintenant.toLocaleString('fr-FR') },
    { Indicateur: 'Note', Valeur: 'Les opérations rejetées ne sont pas exportées : elles n’entrent dans aucun total.' },
  ];
  const ws1 = XLSX.utils.json_to_sheet(synthese);
  ws1['!cols'] = autoFitColumns(synthese);
  XLSX.utils.book_append_sheet(wb, ws1, 'Synthèse');

  const detail = lignes.map((i, rang) => ({
    'N°': rang + 1,
    'Échéance': i.echeance,
    'Désignation': i.designation,
    'Catégorie': i.categorie,
    'Type': typeLibelle(i.type),
    'Montant (FCFA)': Math.round(i.montant),
    'Statut': LIBELLE_STATUT[i.statut],
    'Visa DGA': visaDga(i.statut),
    'Accord DG': accordDg(i.statut),
    'Source': i.src,
    'Pièce': i.justif ? 'Oui' : 'Non',
  }));
  const ws2 = XLSX.utils.json_to_sheet(detail);
  ws2['!cols'] = autoFitColumns(detail);
  XLSX.utils.book_append_sheet(wb, ws2, 'Détail');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

// ── PDF ────────────────────────────────────────────────────────────────────────

/*
 * ⚠ jsPDF écrit en WinAnsi : `toLocaleString('fr-FR')` sépare les milliers par une espace
 * fine insécable (U+202F) que cette police n'a pas, et « 20 000 » sortait « 20/000 ». Tout
 * ce qui part dans le PDF passe par ces deux fonctions.
 */
const nombre = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ');
const fcfa = (n: number) => `${nombre(n)} FCFA`;
const winAnsi = (t: string) =>
  t.replace(/[  ]/g, ' ').replace(/−/g, '-').replace(/[‐-―]/g, '-').replace(/[’‘]/g, "'").replace(/›/g, '>');

/** Les colonnes du tableau PDF, largeurs en mm (A4 paysage : 297 − 2 × 12 de marge = 273). */
const COLONNES: { titre: string; w: number; droite?: boolean; valeur: (i: IFinanceItem, rang: number) => string }[] = [
  { titre: 'N°', valeur: (_i, r) => String(r + 1), w: 11 },
  { titre: 'ÉCHÉANCE', valeur: (i) => i.echeance, w: 24 },
  { titre: 'DÉSIGNATION', valeur: (i) => i.designation, w: 72 },
  { titre: 'CATÉGORIE', valeur: (i) => i.categorie, w: 54 },
  { titre: 'TYPE', valeur: (i) => typeLibelle(i.type), w: 20 },
  { droite: true, titre: 'MONTANT', valeur: (i) => fcfa(i.montant), w: 32 },
  { titre: 'STATUT', valeur: (i) => LIBELLE_STATUT[i.statut], w: 26 },
  { titre: 'VISA DGA', valeur: (i) => visaDga(i.statut), w: 17 },
  { titre: 'ACCORD DG', valeur: (i) => accordDg(i.statut), w: 17 },
];

/**
 * Le PDF « État des dépenses », A4 paysage (maquette, planche 3).
 *
 * <p>⚠ Deux colonnes de la maquette ne sont PAS produites : « Payée le » et « Compte ». Le
 * serveur ne transmet ni la date de décaissement ni le compte débité pour ces lignes ;
 * écrire une date supposée ou « Caisse physique » partout serait inventer une pièce
 * comptable. Elles viendront quand la donnée existera.</p>
 */
export function genererSelectionPdf(selection: IFinanceItem[], ctx: ContexteExportSelection): jsPDF {
  const lignes = lignesExportees(selection);
  const st: IStatsSelection = statsSelection(lignes);
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' });
  const L = 297;
  const H = 210;
  const M = 12;
  const nomFichier = `${nomFichierSelection(ctx)}.pdf`;
  const ecrire = (t: string, x: number, y: number, options?: { align?: 'right' }) => doc.text(winAnsi(t), x, y, options);

  const enTete = () => {
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(255, 26, 0);
    ecrire('TURBO DELIVERY', M, 14);
    doc.setFontSize(15).setTextColor(24, 24, 27);
    ecrire('État des dépenses', M, 21);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(113, 113, 122);
    const filtres = doc.splitTextToSize(winAnsi(ligneFiltres(ctx)), 190) as string[];
    doc.text(filtres, M, 26);
    const d = ctx.maintenant;
    ecrire(`Généré par ${ctx.auteur}`, L - M, 14, { align: 'right' });
    ecrire(`le ${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()} à ${deux(d.getHours())}:${deux(d.getMinutes())}`, L - M, 18, { align: 'right' });
    ecrire(nomFichier, L - M, 22, { align: 'right' });
    doc.setDrawColor(228, 228, 231).line(M, 30 + (filtres.length - 1) * 3.5, L - M, 30 + (filtres.length - 1) * 3.5);
    return 34 + (filtres.length - 1) * 3.5;
  };

  const enTeteTableau = (y: number) => {
    doc.setFillColor(244, 244, 245).rect(M, y, L - 2 * M, 7, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(82, 82, 91);
    let x = M;
    for (const c of COLONNES) {
      ecrire(c.titre, c.droite ? x + c.w - 2 : x + 2, y + 4.7, c.droite ? { align: 'right' } : undefined);
      x += c.w;
    }
    return y + 7;
  };

  let y = enTete();

  // Les cinq cartes de synthèse (maquette).
  const cartes: [string, string, string][] = [
    ['TOTAL CUMULÉ', fcfa(st.total), ''],
    ["NOMBRE D'OPÉRATIONS", String(st.n), ''],
    ['MONTANT MOYEN', fcfa(st.moyenne), `min ${nombre(st.min)} · max ${nombre(st.max)}`],
    ['PAYÉ', fcfa(st.paye), `${st.nbPayees} opération${st.nbPayees > 1 ? 's' : ''}`],
    ['RESTE À PAYER', fcfa(st.reste), `${st.nbReste} opération${st.nbReste > 1 ? 's' : ''}`],
  ];
  const wCarte = (L - 2 * M - 4 * 4) / 5;
  cartes.forEach(([titre, valeur, pied], i) => {
    const x = M + i * (wCarte + 4);
    doc.setDrawColor(228, 228, 231).setFillColor(250, 250, 250).roundedRect(x, y, wCarte, 19, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold').setFontSize(6.5).setTextColor(113, 113, 122);
    ecrire(titre, x + 3, y + 5);
    doc.setFontSize(11).setTextColor(24, 24, 27);
    ecrire(valeur, x + 3, y + 11.5);
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(113, 113, 122);
    if (pied) ecrire(pied, x + 3, y + 16);
  });
  y += 25;

  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(24, 24, 27);
  ecrire('Détail des opérations', M, y);
  y = enTeteTableau(y + 3);

  const hauteurLigne = 6.2;
  lignes.forEach((ligne, rang) => {
    if (y + hauteurLigne > H - 22) {
      doc.addPage();
      y = enTeteTableau(enTete());
    }
    if (rang % 2 === 1) doc.setFillColor(250, 250, 250).rect(M, y, L - 2 * M, hauteurLigne, 'F');
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(24, 24, 27);
    let x = M;
    for (const c of COLONNES) {
      // Une désignation trop longue est COUPÉE à la largeur de sa colonne, jamais laissée
      // déborder sur la suivante : un montant recouvert de texte est illisible.
      const brut = winAnsi(c.valeur(ligne, rang));
      const texte = (doc.splitTextToSize(brut, c.w - 4) as string[])[0] ?? '';
      ecrire(texte, c.droite ? x + c.w - 2 : x + 2, y + 4.2, c.droite ? { align: 'right' } : undefined);
      x += c.w;
    }
    y += hauteurLigne;
  });

  if (lignes.length === 0) {
    doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(113, 113, 122);
    ecrire('Aucune opération pour ces filtres.', M + 2, y + 5);
    y += 8;
  }

  // Le pied : le total DU TABLEAU, qui doit être celui de la synthèse.
  if (y + 9 > H - 16) {
    doc.addPage();
    y = enTeteTableau(enTete());
  }
  doc.setFillColor(244, 244, 245).rect(M, y, L - 2 * M, 8, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(24, 24, 27);
  ecrire(`TOTAL · ${st.n} opération${st.n > 1 ? 's' : ''} (égal à la synthèse)`, M + 2, y + 5.3);
  const xMontant = M + COLONNES.slice(0, 6).reduce((s, c) => s + c.w, 0) - 2;
  ecrire(fcfa(st.total), xMontant, y + 5.3, { align: 'right' });

  // Pied de page : la pagination se pose à la fin, quand on connaît le nombre de pages.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(113, 113, 122);
    ecrire('ERP TURBO · Finance > Dépenses', M, H - 8);
    ecrire(`Page ${p} / ${pages}`, L - M, H - 8, { align: 'right' });
  }
  return doc;
}
