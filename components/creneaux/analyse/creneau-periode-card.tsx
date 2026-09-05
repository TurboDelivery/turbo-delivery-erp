'use client';

import { Card, Separator } from '@heroui-v3/react';
import { TrendingUp } from 'lucide-react';

interface CreneauPeriodeCardProps {
  label: string;
  taux: number;
  absences: number;
  justifiees: number;
  /** Conservé pour ne pas toucher les points d'appel ; sans effet sur le rendu. */
  variant?: 'matin' | 'soir';
}

export function CreneauPeriodeCard({ absences, justifiees, label, taux }: CreneauPeriodeCardProps) {
  /*
   * La carte du MATIN etait entierement bleue et celle du SOIR entierement violette :
   * liseré, chiffres, libelles, pastille. Six teintes de palette pour distinguer deux
   * cartes qui portent deja leur titre — « Matin » et « Soir » — cote a cote. Les
   * chiffres reprennent la couleur du texte ; ce qui les distingue, c'est leur taille.
   */
  return (
    <Card className="flex-1">
      <Card.Content className="gap-3 p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-secondary">
            <TrendingUp aria-hidden="true" className="size-4 text-muted" />
          </div>
        </div>
        <div>
          <p className="text-4xl font-bold tabular-nums text-foreground">{taux}%</p>
          <p className="text-sm text-muted">Taux de présence</p>
        </div>
        <Separator />
        <div className="flex justify-between">
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{absences}</p>
            <p className="text-xs text-muted">Absences totales</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-foreground">{justifiees}</p>
            <p className="text-xs text-muted">Justifiées</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
