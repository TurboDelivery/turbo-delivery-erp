// Export du tableau de bord Finances : un vrai fichier .xlsx (SheetJS) et un PDF
// mis en page (document HTML isolé imprimé dans une nouvelle fenêtre — donc SANS
// le shell de l'app : plus de sidebar/menu dans le PDF). Même mécanique que
// l'export de la page Tickets.

import * as XLSX from 'xlsx';
import { autoFitColumns } from '@/features/tickets/utils/export.utils';
import { FinanceStatut, IFinanceItem, fmtFcfa } from './finances-hub.utils';

export interface FinancesExportMeta {
  monthLabel: string;
  jours: number;
  nbJours: number;
  ca: number;
  dep: number;
  profit: number;
  marge: boolean;
  bapTotal: number;
}

const STATUT_LABEL: Record<FinanceStatut, string> = {
  pending: 'En attente',
  vise: 'Visé DGA',
  approuve: 'Approuvé DG',
  paye: 'Payé',
  rejete: 'Rejeté',
};

const typeLabel = (t: IFinanceItem['type']) => (t === 'fixe' ? 'Charge fixe' : 'Dépense variable');

/** Échappe le HTML pour éviter qu'une désignation avec & < > " ne casse le template PDF. */
const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Génère un classeur .xlsx (2 feuilles : Synthèse + Dépenses). Renvoie un ArrayBuffer. */
export function generateFinancesXlsx(items: IFinanceItem[], meta: FinancesExportMeta) {
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Synthèse (KPI). Montants en nombres bruts → sommables dans Excel.
  const synthese = [
    { Indicateur: 'Période', Valeur: meta.monthLabel },
    { Indicateur: "Date d'arrêté", Valeur: `J${meta.jours} / ${meta.nbJours}` },
    { Indicateur: 'CA cumulé (FCFA)', Valeur: Math.round(meta.ca) },
    { Indicateur: 'Dépenses cumulées (FCFA)', Valeur: Math.round(meta.dep) },
    { Indicateur: `${meta.marge ? 'Marge' : 'Déficit'} (FCFA)`, Valeur: Math.round(meta.profit) },
    { Indicateur: 'Bon à payer (FCFA)', Valeur: Math.round(meta.bapTotal) },
    { Indicateur: 'Exporté le', Valeur: new Date().toLocaleString('fr-FR') },
  ];
  const wsSynthese = XLSX.utils.json_to_sheet(synthese);
  wsSynthese['!cols'] = autoFitColumns(synthese);
  XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse');

  // Feuille 2 — Dépenses (le tableau).
  const rows = items.map((i) => ({
    'Désignation': i.designation,
    'Type': typeLabel(i.type),
    'Catégorie': i.categorie,
    'Montant (FCFA)': Math.round(i.montant),
    'Échéance': i.echeance,
    'Statut': STATUT_LABEL[i.statut],
    'Source': i.src,
    'Pièce': i.justif ? 'Oui' : 'Non',
  }));
  const wsRows = XLSX.utils.json_to_sheet(rows);
  wsRows['!cols'] = autoFitColumns(rows);
  XLSX.utils.book_append_sheet(wb, wsRows, 'Dépenses');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/** Génère un document HTML autonome (en-tête + KPI + tableau) pour impression/PDF. */
export function generateFinancesPdf(items: IFinanceItem[], meta: FinancesExportMeta): string {
  const total = items.reduce((s, i) => s + (i.montant || 0), 0);
  const rows = items
    .map(
      (i) => `<tr>
        <td>${esc(i.designation)}</td>
        <td>${typeLabel(i.type)}</td>
        <td>${esc(i.categorie)}</td>
        <td class="num">${esc(fmtFcfa(i.montant))}</td>
        <td>${esc(i.echeance)}</td>
        <td>${STATUT_LABEL[i.statut]}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Finances — Dépenses & Décaissement</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; padding: 28px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ef4444; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 20px; font-weight: 800; color: #ef4444; line-height: 1.1; }
    .brand small { display: block; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: .04em; }
    .meta { text-align: right; font-size: 12px; color: #6b7280; }
    .meta strong { color: #1f2937; }
    .kpis { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .kpi { flex: 1; min-width: 150px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; }
    .kpi .l { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    .kpi .v { font-size: 17px; font-weight: 700; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .kpi.good { background: #ecfdf5; border-color: #a7f3d0; } .kpi.good .v { color: #047857; }
    .kpi.bad { background: #fef2f2; border-color: #fecaca; } .kpi.bad .v { color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #fff7ed; color: #9a3412; text-align: left; padding: 9px 10px; border: 1px solid #fed7aa; }
    td { padding: 8px 10px; border: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #fafafa; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight: 700; border-top: 2px solid #e5e7eb; background: #fff; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="head">
    <div class="brand">TURBO DELIVERY<small>Management Platform</small></div>
    <div class="meta">
      <div><strong>Finances — Dépenses &amp; Décaissement</strong></div>
      <div>Période : ${esc(meta.monthLabel)} · J${meta.jours}/${meta.nbJours}</div>
      <div>Exporté le ${new Date().toLocaleString('fr-FR')}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="l">CA cumulé</div><div class="v">${esc(fmtFcfa(meta.ca))}</div></div>
    <div class="kpi"><div class="l">Dépenses cumulées</div><div class="v">${esc(fmtFcfa(meta.dep))}</div></div>
    <div class="kpi ${meta.marge ? 'good' : 'bad'}"><div class="l">${meta.marge ? 'Marge actuelle' : 'Déficit actuel'}</div><div class="v">${meta.profit >= 0 ? '+' : ''}${esc(fmtFcfa(meta.profit))}</div></div>
    <div class="kpi"><div class="l">Bon à payer</div><div class="v">${esc(fmtFcfa(meta.bapTotal))}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th>Type</th>
        <th>Catégorie</th>
        <th class="num">Montant</th>
        <th>Échéance</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:24px">Aucune dépense.</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total (${items.length} ligne${items.length > 1 ? 's' : ''})</td>
        <td class="num">${esc(fmtFcfa(total))}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}
