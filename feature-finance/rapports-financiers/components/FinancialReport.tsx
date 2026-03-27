'use client';

import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';

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
  const metrics: FinancialMetric[] = [
    { label: "Chiffre d'Affaires", value: '850 000 FCFA' },
    { label: 'Charges Fixes (Prorata)', value: '504 032 FCFA' },
    { label: 'Dépenses Variables', value: '58 500 FCFA' },
    { label: 'Total Dépenses', value: '562 532 FCFA', highlight: 'warning' },
    { label: 'Bénéfice', value: '287 468 FCFA', highlight: 'success' },
  ];

  const kpis: KPI[] = [
    { label: 'Taux de Marge', value: '33.82%' },
    { label: 'Coût Journalier Moyen', value: '23 439', unit: 'FCFA' },
    { label: 'CA Journalier Moyen', value: '35 417', unit: 'FCFA' },
  ];

  const fixedCosts: FixedCost[] = [
    { label: 'Loyer Bureau', percentage: 24, amount: '150 000 FCFA' },
    { label: 'Internet & Téléphonie', percentage: 4, amount: '25 000 FCFA' },
    { label: 'Salaires', percentage: 72, amount: '450 000 FCFA' },
  ];

  const variableExpenses: VariableExpense[] = [
    { date: '20/03/2026', designation: 'Maintenance Véhicule', amount: '35 000 FCFA' },
    { date: '18/03/2026', designation: 'Fournitures Bureau', amount: '8 500 FCFA' },
  ];

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

          <Button 
            color="primary"
            className="bg-purple-600"
            startContent={<Download className="w-4 h-4" />}
          >
            Exporter CSV
          </Button>
        </div>

        {/* Period Selector */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600">Période</span>
            <span className="text-sm font-medium text-gray-900">01/03/2026 - 25/03/2026</span>
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
