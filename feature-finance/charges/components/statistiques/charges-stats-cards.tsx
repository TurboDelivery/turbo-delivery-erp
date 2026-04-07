'use client';

import { Activity, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { useChargesFixesStatsQuery } from '../../queries/charges-fixes.query';
import { IChargeStats } from '../../types/charge-fixe.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

const emptyStats: IChargeStats = {
  totalMensuel: 0,
  chargesFixesAuProrata: 0,
  chargesActives: 0,
  sommeDepensesVariables: 0,
  nombreDepensesVariables: 0,
  totalChargesADate: 0,
  pointMortDuJour: 0,
  pointMortQuotidien: 0,
};

export default function ChargesStatsCards() {
  const { data } = useChargesFixesStatsQuery();
  const stats = data ?? emptyStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Wallet size={24} />
            </div>
            <span className="text-blue-100 text-sm font-medium">Total Charges Mensuelles</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatCFA(stats.totalMensuel)}</p>
          <p className="text-blue-100 text-xs">Toutes charges confondues</p>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-lg">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <span className="text-orange-100 text-sm font-medium">Point Mort Quotidien</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatCFA(stats.pointMortQuotidien)}</p>
          <p className="text-orange-100 text-xs">Coût par jour (Total ÷ 30)</p>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Activity size={24} />
            </div>
            <span className="text-green-100 text-sm font-medium">Charges Actives</span>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.chargesActives}</p>
          <p className="text-green-100 text-xs">Lignes configurées</p>
        </CardBody>
      </Card>
    </div>
  );
}

