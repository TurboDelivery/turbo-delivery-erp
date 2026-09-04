'use client';

import React from 'react';
import { Chip } from '@/components/heroui';
import { Mail, MapPin, Phone } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { AvatarCell } from './avatar-cell';
import { StatusChip } from './status-chip';
import { TurboyActionMenu } from './turboy-action-menu';

export function CourierCard({ turboy }: { turboy: ITurboy }) {
  const salaire = turboy.salaire ? `${turboy.salaire.toLocaleString('fr-FR')} Fcfa` : '-- Fcfa';
  // V54 (2026-05-29) — Helper centralisé : libellé/couleur cohérents pour
  // les 3 types (INDEPENDANT, JOURNALIER, SUPERVISEUR_LIVREUR).
  const typeDisplay = getTurboyTypeDisplay(turboy.typeLivreur);
  return (
    <div className="bg-surface border border-separator rounded-xl p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <AvatarCell turboy={turboy} size="lg" />
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm leading-tight">
            {turboy.prenoms} {turboy.nom}
          </span>
          <div className="mt-1">
            <Chip color={typeDisplay.chipColor} size="sm" variant="flat">
              {typeDisplay.label}
            </Chip>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="truncate">{turboy.email ?? '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
          <span>{turboy.telephone ?? '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="truncate">{turboy.habitation ?? '-'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-separator">
        <StatusChip status={turboy.status} />
        <span className="text-xs text-muted font-mono">{salaire}</span>
      </div>
      <div className="flex items-center justify-end pt-1 border-t border-separator">
        <TurboyActionMenu turboy={turboy} />
      </div>
    </div>
  );
}
