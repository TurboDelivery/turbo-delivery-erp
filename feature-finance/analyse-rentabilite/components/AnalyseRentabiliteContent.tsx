'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardBody } from '@heroui/react';
import { Button } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import RevenueExpenseChart from './RevenueExpenseChart';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useGlobalStats } from '@/feature-finance/dashboard/queries/global-stats.query';
import { useDepenseSummaryQuery } from '@/feature-finance/depenses/queries/depense-summary.query';
import { useChargesFixesQuery } from '@/feature-finance/charges/queries/charges-fixes.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function AnalyseRentabiliteContent() {
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

  // Récupérer les données des API
  const { data: globalStats, isLoading: isLoadingGlobal } = useGlobalStats({
    debut: filters.debut,
    fin: filters.fin,
  });

  const { data: depenseSummary, isLoading: isLoadingDepenses } = useDepenseSummaryQuery({
    debut: filters.debut,
    fin: filters.fin,
  });

  const { data: chargesFixesData, isLoading: isLoadingChargesFixes } = useChargesFixesQuery({
    size: 100,
  });

  // Calculer les statistiques
  const stats = useMemo(() => {
    const chiffreAffaires = globalStats?.chiffreAffaire ?? 0;
    const totalRecurrentes = depenseSummary?.totalRecurrentes ?? 0;
    const totalNonRecurrentes = depenseSummary?.totalNonRecurrentes ?? 0;
    const totalDepenses = globalStats?.depenses ?? 0;
    
    const totalFixes = chargesFixesData?.content?.reduce((sum, c) => sum + (c.montant ?? 0), 0) ?? 0;
    const totalVariables = depenseSummary?.totalNonRecurrentes ?? 0;
    
    const marge = chiffreAffaires - totalDepenses;
    const tauxMarge = chiffreAffaires > 0 ? (marge / chiffreAffaires) * 100 : 0;
    const isDeficit = marge < 0;

    return {
      chiffreAffaires,
      totalDepenses,
      marge,
      tauxMarge,
      isDeficit,
      totalRecurrentes,
      totalNonRecurrentes,
      totalFixes,
      totalVariables,
      formattedChiffreAffaires: formatCFA(chiffreAffaires),
      formattedTotalDepenses: formatCFA(totalDepenses),
      formattedMarge: formatCFA(marge),
      formattedRecurrentes: formatCFA(totalRecurrentes),
      formattedNonRecurrentes: formatCFA(totalNonRecurrentes),
      formattedTotalFixes: formatCFA(totalFixes),
      formattedTotalVariables: formatCFA(totalVariables),
    };
  }, [globalStats, depenseSummary, chargesFixesData]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="light" 
            size="sm" 
            startContent={<ArrowLeft className="w-5 h-5" />}
            className="p-0 min-w-0"
          />
          <div>
            <h1 className="text-xl font-semibold text-red-500">
              Analyse de Rentabilité
            </h1>
            <p className="text-sm text-gray-500">
              Visualisez vos performances financières en temps réel
            </p>
          </div>
        </div>

        <DateFilterInput 
          filters={filters} 
          handleDateChange={handleDateChange}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Chiffre d'Affaires</p>
            <h2 className="text-lg font-semibold">
              {isLoadingGlobal ? 'Chargement...' : stats.formattedChiffreAffaires}
            </h2>
          </CardBody>
        </Card>

        <Card className="bg-orange-50">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Total Dépenses</p>
            <h2 className="text-lg font-semibold">
              {isLoadingDepenses ? 'Chargement...' : stats.formattedTotalDepenses}
            </h2>
          </CardBody>
        </Card>

        <Card className="bg-green-50">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Marge Actuelle</p>
            <h2 className={`text-lg font-semibold ${stats.isDeficit ? 'text-red-600' : 'text-green-600'}`}>
              {isLoadingGlobal || isLoadingDepenses ? 'Chargement...' : stats.formattedMarge}
            </h2>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Taux de Marge</p>
            <h2 className="text-lg font-semibold">
              {isLoadingGlobal || isLoadingDepenses ? 'Chargement...' : `${stats.tauxMarge.toFixed(1)}%`}
            </h2>
          </CardBody>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <Card>
          <CardBody className="p-0">
            <RevenueExpenseChart debut={filters.debut} fin={filters.fin} />
          </CardBody>
        </Card>

        {/* Expenses */}
        <Card>
          <CardBody className="p-4">
            <h3 className="text-sm font-semibold mb-4">
              Détail des Dépenses
            </h3>

            <ul className="space-y-2 text-sm">
              {chargesFixesData?.content?.map((charge) => (
                <li key={charge.id} className="flex justify-between">
                  <span>{charge.designation}</span>
                  <span>{formatCFA(charge.montant)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t mt-4 pt-4 text-sm">
              <div className="flex justify-between font-semibold text-red-500">
                <span>TOTAL</span>
                <span>{isLoadingGlobal ? 'Chargement...' : stats.formattedTotalDepenses}</span>
              </div>

              <div className="mt-3 flex justify-between text-blue-500">
                <span>Charges Fixes</span>
                <span>{isLoadingChargesFixes ? 'Chargement...' : stats.formattedTotalFixes}</span>
              </div>

              <div className="flex justify-between text-purple-500">
                <span>Dépenses Variables</span>
                <span>{isLoadingDepenses ? 'Chargement...' : stats.formattedTotalVariables}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-6 text-sm text-gray-500">
        <span>
          Période Analysée : {filters.debut ? new Date(filters.debut).toLocaleDateString('fr-FR') : '...'} 
          au {filters.fin ? new Date(filters.fin).toLocaleDateString('fr-FR') : '...'}
        </span>
        <span className={`font-medium ${stats.isDeficit ? 'text-red-600' : 'text-green-600'}`}>
          {stats.isDeficit ? '✗ Déficit' : '✓ Rentable'}
        </span>
      </div>
    </div>
  );
}
