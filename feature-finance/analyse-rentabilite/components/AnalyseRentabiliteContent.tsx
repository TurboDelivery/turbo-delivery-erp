'use client';

import React, { useState } from 'react';
import { Card, CardBody } from '@heroui/react';
import { Button } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import RevenueExpenseChart from './RevenueExpenseChart';
import DateFilterInput from '@/components/finance/date-filter-input';

export default function AnalyseRentabiliteContent() {
  const [filters, setFilters] = useState({
    debut: undefined as Date | undefined,
    fin: undefined as Date | undefined,
  });

  const handleDateChange = (value: any) => {
    setFilters({
      debut: value?.from,
      fin: value?.to,
    });
  };

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

        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-100">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Chiffre d'Affaires</p>
            <h2 className="text-lg font-semibold">850 000 FCFA</h2>
          </CardBody>
        </Card>

        <Card className="bg-orange-50">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Total Dépenses</p>
            <h2 className="text-lg font-semibold">562 532 FCFA</h2>
          </CardBody>
        </Card>

        <Card className="bg-green-50">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Marge Actuelle</p>
            <h2 className="text-lg font-semibold text-green-600">
              287 468 FCFA
            </h2>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Taux de Marge</p>
            <h2 className="text-lg font-semibold">33.8%</h2>
          </CardBody>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <Card>
          <CardBody className="p-0">
            <RevenueExpenseChart />
          </CardBody>
        </Card>

        {/* Expenses */}
        <Card>
          <CardBody className="p-4">
            <h3 className="text-sm font-semibold mb-4">
              Détail des Dépenses
            </h3>

            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Loyer Bureau</span>
                <span>120 968 FCFA</span>
              </li>
              <li className="flex justify-between">
                <span>Internet & Téléphone</span>
                <span>20 161 FCFA</span>
              </li>
              <li className="flex justify-between">
                <span>Salaires</span>
                <span>362 903 FCFA</span>
              </li>
              <li className="flex justify-between">
                <span>Maintenance Véhicule</span>
                <span>35 000 FCFA</span>
              </li>
              <li className="flex justify-between">
                <span>Fournitures Bureau</span>
                <span>8 500 FCFA</span>
              </li>
              <li className="flex justify-between">
                <span>Essence Livraison</span>
                <span>15 000 FCFA</span>
              </li>
            </ul>

            <div className="border-t mt-4 pt-4 text-sm">
              <div className="flex justify-between font-semibold text-red-500">
                <span>TOTAL</span>
                <span>562 532 FCFA</span>
              </div>

              <div className="mt-3 flex justify-between text-blue-500">
                <span>Charges Fixes</span>
                <span>504 032 FCFA</span>
              </div>

              <div className="flex justify-between text-purple-500">
                <span>Dépenses Variables</span>
                <span>58 500 FCFA</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-6 text-sm text-gray-500">
        <span>Période Analysée : 01/03/2026 au 25/03/2026</span>
        <span className="text-green-600 font-medium">✓ Rentable</span>
      </div>
    </div>
  );
}
