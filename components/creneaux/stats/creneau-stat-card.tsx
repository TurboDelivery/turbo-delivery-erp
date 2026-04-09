'use client';

import { Card, CardBody, CircularProgress } from '@heroui/react';

interface CreneauStatCardProps {
  label: string;
  sublabel?: string;
  value: number;
  color?: 'success' | 'primary' | 'warning' | 'danger';
}

export function CreneauStatCard({ label, sublabel, value, color = 'primary' }: CreneauStatCardProps) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <CircularProgress
          size="lg"
          value={value}
          color={color}
          showValueLabel
          aria-label={label}
          classNames={{
            value: 'text-sm font-semibold',
          }}
        />
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{value}%</span>
          <span className="text-sm text-default-500">{label}</span>
          {sublabel && <span className="text-xs text-default-400">{sublabel}</span>}
        </div>
      </CardBody>
    </Card>
  );
}
