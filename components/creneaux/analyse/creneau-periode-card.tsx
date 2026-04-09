'use client';

import { Card, CardBody, Divider } from '@heroui/react';
import { TrendingUp } from 'lucide-react';

interface CreneauPeriodeCardProps {
  label: string;
  taux: number;
  absences: number;
  justifiees: number;
  variant: 'matin' | 'soir';
}

export function CreneauPeriodeCard({ label, taux, absences, justifiees, variant }: CreneauPeriodeCardProps) {
  const isMatin = variant === 'matin';
  const borderColor = isMatin ? 'border-l-blue-500' : 'border-l-purple-500';
  const textColor = isMatin ? 'text-blue-600' : 'text-purple-600';
  const iconBg = isMatin ? 'bg-blue-500' : 'bg-purple-500';

  return (
    <Card shadow="none" className={`flex-1 border border-default-200 border-l-4 ${borderColor}`}>
      <CardBody className="gap-3 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-default-700">{label}</p>
          <div className={`flex size-9 items-center justify-center rounded-full ${iconBg}`}>
            <TrendingUp className="size-4 text-white" />
          </div>
        </div>
        <div>
          <p className={`text-4xl font-bold ${textColor}`}>{taux}%</p>
          <p className={`text-sm ${textColor}`}>Taux de presence</p>
        </div>
        <Divider />
        <div className="flex justify-between">
          <div>
            <p className={`text-2xl font-bold ${textColor}`}>{absences}</p>
            <p className={`text-xs ${textColor}`}>Absences totales</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${textColor}`}>{justifiees}</p>
            <p className={`text-xs ${textColor}`}>Justifiees</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
