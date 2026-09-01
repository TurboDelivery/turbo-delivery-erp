interface MetricRow {
  label: string;
  value: string;
}

interface KPIRow {
  label: string;
  value: string;
  unit?: string;
}

interface FixedCostRow {
  label: string;
  percentage: number;
  amount: string;
}

interface VariableExpenseRow {
  date: string;
  designation: string;
  amount: string;
}

export interface FinancialReportExportParams {
  /**
   * Vrai quand la lecture a ete plafonnee et que la vue est PARTIELLE.
   *
   * <p>Optionnels pour ne pas casser les appelants existants : absents, le fichier se
   * comporte comme avant. Presents, ils font ecrire une ligne d'avertissement dans le
   * fichier lui-meme — c'est le seul endroit ou le lecteur peut encore l'apprendre, le
   * CSV n'ayant pas l'ecran sous les yeux.</p>
   */
  fixesTronquees?: boolean;
  totalFixes?: number;
  variablesTronquees?: boolean;
  totalVariables?: number;
  metrics: MetricRow[];
  kpis: KPIRow[];
  fixedCosts: FixedCostRow[];
  variableExpenses: VariableExpenseRow[];
  debut?: Date;
  fin?: Date;
}

function fmtDate(d?: Date): string {
  if (!d) return '-';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportFinancialReportCsv(params: FinancialReportExportParams): void {
  const { metrics, kpis, fixedCosts, variableExpenses, debut, fin,
    fixesTronquees, totalFixes, variablesTronquees, totalVariables } = params;
  const rows: string[] = [];

  // En-tête du rapport
  rows.push(`Rapport Financier`);
  rows.push(`Période:,${fmtDate(debut)} - ${fmtDate(fin)}`);
  rows.push(`Date d'export:,${new Date().toLocaleString('fr-FR')}`);
  rows.push('');

  // Section 1 — Vue d'Ensemble
  rows.push('VUE D\'ENSEMBLE');
  rows.push('Libelle,Valeur');
  for (const m of metrics) {
    rows.push(`${escapeCell(m.label)},${escapeCell(m.value)}`);
  }
  rows.push('');

  // Section 2 — Indicateurs Clés
  rows.push('INDICATEURS CLES');
  rows.push('Libelle,Valeur');
  for (const k of kpis) {
    const val = k.unit ? `${k.value} ${k.unit}` : k.value;
    rows.push(`${escapeCell(k.label)},${escapeCell(val)}`);
  }
  rows.push('');

  // Section 3 — Répartition des Charges Fixes
  rows.push('REPARTITION DES CHARGES FIXES');
  // Les pourcentages sont calcules sur les lignes CHARGEES, pas sur l'ensemble de la
  // periode : au-dela du plafond de lecture, ils totalisent 100 % d'un sous-ensemble.
  // A l'ecran une mention le signale ; sans cette ligne, le fichier exporte sortait du
  // batiment en presentant une repartition partielle comme complete.
  if (fixesTronquees) {
    rows.push(`ATTENTION : repartition PARTIELLE — ${fixedCosts.length} charges sur ${totalFixes}. Les pourcentages portent sur les lignes listees.`);
  }
  rows.push('Libelle,Pourcentage,Montant');
  for (const c of fixedCosts) {
    rows.push(`${escapeCell(c.label)},${c.percentage}%,${escapeCell(c.amount)}`);
  }
  rows.push('');

  // Section 4 — Dépenses Variables
  rows.push('DEPENSES VARIABLES DE LA PERIODE');
  if (variablesTronquees) {
    rows.push(`ATTENTION : liste PARTIELLE — ${variableExpenses.length} depenses sur ${totalVariables}.`);
  }
  rows.push('Date,Designation,Montant');
  for (const e of variableExpenses) {
    rows.push(`${escapeCell(e.date)},${escapeCell(e.designation)},${escapeCell(e.amount)}`);
  }

  const csvContent = '\ufeff' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const debutStr = debut ? debut.toISOString().slice(0, 7) : 'debut';
  const finStr = fin ? fin.toISOString().slice(0, 7) : 'fin';
  a.download = `rapport_financier_${debutStr}_${finStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
