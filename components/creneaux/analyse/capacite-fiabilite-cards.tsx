'use client';

import { Card, CardBody, Chip, Progress } from '@/components/heroui';
import { Calendar, Clock } from 'lucide-react';

interface CapaciteData {
  pourcentage: number;
  inscrits: number;
  total: number;
  tauxConfirmation: number;
}

interface FiabiliteData {
  pourcentage: number;
  gpsConfirme: number;
  total: number;
  absencesJustifiees: number;
}

interface CapaciteFiabiliteCardsProps {
  capacite: CapaciteData;
  fiabilite: FiabiliteData;
}

export function CapaciteFiabiliteCards({ capacite, fiabilite }: CapaciteFiabiliteCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Capacité Prévue */}
      <Card shadow="none" className="border border-default-200">
        <CardBody className="gap-3 p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-bold">Capacite Prevue</h3>
            <Calendar className="size-5 text-default-400" />
          </div>
          <Chip size="sm" classNames={{ base: 'bg-amber-100', content: 'text-amber-700 font-medium text-xs' }}>PREVISIONNEL</Chip>
          <p className="text-4xl font-bold text-primary">{capacite.pourcentage}%</p>
          <Progress value={capacite.pourcentage} color="primary" radius="none" size="md" />
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Turboys inscrits</span>
              <span className="font-semibold">{capacite.inscrits} / {capacite.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Taux de confirmation</span>
              <span className="font-semibold">{capacite.tauxConfirmation}%</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Fiabilité Terrain */}
      <Card shadow="none" className="border border-default-200">
        <CardBody className="gap-3 p-5">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-bold">Fiabilite Terrain</h3>
            <Clock className="size-5 text-default-400" />
          </div>
          <Chip size="sm" classNames={{ base: 'bg-green-100', content: 'text-green-700 font-medium text-xs' }}>REEL</Chip>
          <p className="text-4xl font-bold text-success">{fiabilite.pourcentage}%</p>
          <Progress value={fiabilite.pourcentage} color="success" radius="none" size="md" />
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Presence GPS confirmee</span>
              <span className="font-semibold">{fiabilite.gpsConfirme} / {fiabilite.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Absences justifiees</span>
              <span className="font-semibold">{fiabilite.absencesJustifiees}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
