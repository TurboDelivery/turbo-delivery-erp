'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import { Receipt, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export default function ChargesHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
          <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Charges
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi et gestion de toutes les charges de l'entreprise
          </p>
        </div>
      </div>
      
      {/* Cartes de résumé rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Charges</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2,450,000 FCFA</p>
                <p className="text-xs text-blue-600">Ce mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,850,000 FCFA</p>
                <p className="text-xs text-green-600">75.5%</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">600,000 FCFA</p>
                <p className="text-xs text-orange-600">24.5%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Retard</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0 FCFA</p>
                <p className="text-xs text-purple-600">Aucune</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
