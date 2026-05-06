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
  const { metrics, kpis, fixedCosts, variableExpenses, debut, fin } = params;
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
  rows.push('Libelle,Pourcentage,Montant');
  for (const c of fixedCosts) {
    rows.push(`${escapeCell(c.label)},${c.percentage}%,${escapeCell(c.amount)}`);
  }
  rows.push('');

  // Section 4 — Dépenses Variables
  rows.push('DEPENSES VARIABLES DE LA PERIODE');
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
