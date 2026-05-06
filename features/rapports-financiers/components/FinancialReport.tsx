'use client';

import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useState, useMemo } from 'react';
import { endOfMonth, startOfMonth, format } from 'date-fns';
import { useRapportFinancier } from '@/features/finance-dashboard/queries/global-stats.query';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { exportFinancialReportCsv } from '@/features/rapports-financiers/utils/financial-report-export.utils';
import { exportFinancialReportPdf } from '@/features/rapports-financiers/utils/financial-report-pdf.utils';

interface RapportFinancierResponse {
  chiffreAffaire: number;
  depensesFixes: number;
  depensesVariables: number;
  totalDepenses: number;
  benefice: number;
  tauxMarge: number;
  coutJournalierMoyen: number;
  caJournalierMoyen: number;
}

interface FinancialMetric {
  label: string;
  value: string;
  highlight?: 'success' | 'warning';
}

interface KPI {
  label: string;
  value: string;
  unit?: string;
}

interface FixedCost {
  label: string;
  percentage: number;
  amount: string;
}

interface VariableExpense {
  date: string;
  designation: string;
  amount: string;
}

export default function FinancialReport() {
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      debut: startOfMonth(now),
      fin: endOfMonth(now),
    };
  });

  const handleDateChange = (value: any) => {
    setFilters({
      debut: value?.from,
      fin: value?.to,
    });
  };

  // Récupérer les données de l'API avec le hook useRapportFinancier
  const { data: rapportData, isLoading } = useRapportFinancier({
    debut: filters.debut,
    fin: filters.fin,
  }) as { data: RapportFinancierResponse | undefined; isLoading: boolean };

  // Récupérer les charges fixes
  const { data: chargesFixesData, isLoading: isLoadingChargesFixes } = useChargesFixesQuery({
    size: 100,
  });

  // Calculs dynamiques basés sur les données du rapport financier
  const metrics = useMemo(() => {
    if (!rapportData) {
      return [
        { label: "Chiffre d'Affaires", value: '0 FCFA' },
        { label: 'Dépenses Fixes', value: '0 FCFA' },
        { label: 'Dépenses Variables', value: '0 FCFA' },
        { label: 'Total Dépenses', value: '0 FCFA', highlight: 'warning' as const },
        { label: 'Bénéfice', value: '0 FCFA', highlight: 'success' as const },
      ];
    }

    // Utiliser la structure exacte de l'API
    const chiffreAffaire = rapportData.chiffreAffaire || 0;
    const depensesFixes = rapportData.depensesFixes || 0;
    const depensesVariables = rapportData.depensesVariables || 0;
    const totalDepenses = rapportData.totalDepenses || 0;
    const benefice = rapportData.benefice || 0;
    
    return [
      { label: "Chiffre d'Affaires", value: formatCFA(chiffreAffaire) },
      { label: 'Dépenses Fixes', value: formatCFA(depensesFixes) },
      { label: 'Dépenses Variables', value: formatCFA(depensesVariables) },
      { label: 'Total Dépenses', value: formatCFA(totalDepenses), highlight: 'warning' as const },
      { label: 'Bénéfice', value: formatCFA(benefice), highlight: 'success' as const },
    ];
  }, [rapportData]);

  const kpis = useMemo(() => {
    if (!rapportData) {
      return [
        { label: 'Taux de Marge', value: '0.00%' },
        { label: 'Coût Journalier Moyen', value: '0', unit: 'FCFA' },
        { label: 'CA Journalier Moyen', value: '0', unit: 'FCFA' },
      ];
    }

    // Utiliser les valeurs directement de l'API
    const tauxMarge = rapportData.tauxMarge || 0;
    const coutJournalierMoyen = rapportData.coutJournalierMoyen || 0;
    const caJournalierMoyen = rapportData.caJournalierMoyen || 0;
    
    return [
      { label: 'Taux de Marge', value: `${tauxMarge.toFixed(2)}%` },
      { label: 'Coût Journalier Moyen', value: Math.round(coutJournalierMoyen).toString(), unit: 'FCFA' },
      { label: 'CA Journalier Moyen', value: Math.round(caJournalierMoyen).toString(), unit: 'FCFA' },
    ];
  }, [rapportData]);

  // Transformer les dépenses fixes en données pour le graphique
  const fixedCosts: FixedCost[] = useMemo(() => {
    const content = chargesFixesData?.content;
    if (!content || content.length === 0) return [];

    const totalFixes = content.reduce((sum, c) => sum + (c.montant || 0), 0);

    return content.map((charge) => ({
      label: charge.designation,
      percentage: totalFixes > 0 ? Math.round((charge.montant / totalFixes) * 100) : 0,
      amount: formatCFA(charge.montant),
    }));
  }, [chargesFixesData]);

  const handleExportCsv = () => {
    exportFinancialReportCsv({
      metrics,
      kpis,
      fixedCosts,
      variableExpenses,
      debut: filters.debut,
      fin: filters.fin,
    });
  };

  const handleExportPdf = async () => {
    await exportFinancialReportPdf({
      metrics,
      kpis,
      fixedCosts,
      variableExpenses,
      debut: filters.debut,
      fin: filters.fin,
    });
  };

  const { data: chargesVariablesData, isLoading: isLoadingVariables } = useChargesVariablesQuery({
    size: 100,
  });

  const variableExpenses: VariableExpense[] = (chargesVariablesData?.content ?? []).map((charge) => {
    const rawDate = charge.dateDecaissement ?? charge.createdAt;
    return {
      date: rawDate ? format(new Date(rawDate), 'dd/MM/yyyy') : '-',
      designation: charge.designation,
      amount: formatCFA(charge.montant),
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Rapports Financiers</h1>
              <p className="text-sm text-gray-500">Consultez et exportez vos rapports mensuels</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              color="primary"
              className="bg-purple-600"
              startContent={<Download className="w-4 h-4" />}
              onPress={handleExportCsv}
            >
              Exporter CSV
            </Button>
            <Button
              color="secondary"
              variant="bordered"
              startContent={<Download className="w-4 h-4" />}
              onPress={handleExportPdf}
            >
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5">

            <DateFilterInput 
              filters={filters} 
              handleDateChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vue d'Ensemble */}
          <Card>
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d'Ensemble</h2>
              <div className="space-y-3">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                      metric.highlight === 'warning'
                        ? 'bg-orange-50'
                        : metric.highlight === 'success'
                        ? 'bg-green-50'
                        : ''
                    }`}
                  >
                    <span className={`text-sm ${metric.highlight ? 'font-medium' : 'text-gray-600'}`}>
                      {metric.label}
                    </span>
                    <span className={`text-sm font-semibold ${
                      metric.highlight === 'warning' ? 'text-orange-700' :
                      metric.highlight === 'success' ? 'text-green-700' :
                      'text-gray-900'
                    }`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Indicateurs Clés */}
          <Card>
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Indicateurs Clés</h2>
              <div className="space-y-3">
                {kpis.map((kpi, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {kpi.value}
                      {kpi.unit && (
                        <span className="text-base font-normal text-gray-600 ml-1">
                          {kpi.unit}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Répartition des Charges Fixes */}
        <Card>
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition des Charges Fixes
            </h2>
            <div className="space-y-4">
              {fixedCosts.map((cost, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{cost.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{cost.percentage}%</span>
                      <span className="text-sm font-medium text-gray-900 w-24 text-right">
                        {cost.amount}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={cost.percentage} 
                    color="primary"
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Dépenses Variables de la Période */}
        <Card>
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Dépenses Variables de la Période
            </h2>
            <Table aria-label="Dépenses variables">
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>DÉSIGNATION</TableColumn>
                <TableColumn className="text-right">MONTANT</TableColumn>
              </TableHeader>
              <TableBody>
                {variableExpenses.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm text-gray-600">
                      {expense.date}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {expense.designation}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 text-right font-medium">
                      {expense.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


