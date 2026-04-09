'use client';

import { Card, CardBody, Progress } from '@heroui/react';

interface CreneauStatCardProps {
  label: string;
  sublabel?: string;
  value: number;
  color?: 'success' | 'primary' | 'warning' | 'danger';
}

export function CreneauStatCard({ label, sublabel, value, color = 'primary' }: CreneauStatCardProps) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="flex flex-col gap-3 p-4">
        <span className="text-sm text-default-500">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}%</span>
          {sublabel && <span className="text-xs text-default-400">{sublabel}</span>}
        </div>
        <Progress
          size="md"
          value={value}
          color={color}
          aria-label={label}
          radius="none"
        />
      </CardBody>
    </Card>
  );
}
