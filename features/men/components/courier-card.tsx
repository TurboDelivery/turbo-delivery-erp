'use client';

import { Card, Chip, Separator } from '@heroui-v3/react';
import { Mail, MapPin, Phone } from 'lucide-react';
import React from 'react';

import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';

import { AvatarCell } from './avatar-cell';
import { StatusChip } from './status-chip';
import { TurboyActionMenu } from './turboy-action-menu';

/**
 * La fiche d'un coursier, en vue grille.
 *
 * <p>Le type de contrat perd sa couleur : c'est une étiquette de catégorie, pas un état.
 * Sur cette carte, la couleur est réservée à l'état du compte — actif, en attente,
 * inactif — qui est la seule chose qui appelle un geste.</p>
 */
export function CourierCard({ turboy }: { turboy: ITurboy }) {
  const salaire = turboy.salaire ? `${turboy.salaire.toLocaleString('fr-FR')} Fcfa` : '-- Fcfa';
  // V54 (2026-05-29) — Helper centralisé : libellé cohérent pour les 3 types
  // (INDEPENDANT, JOURNALIER, SUPERVISEUR_LIVREUR).
  const typeDisplay = getTurboyTypeDisplay(turboy.typeLivreur);

  return (
    <Card>
      <Card.Content className="gap-3">
        <div className="flex items-center gap-3">
          <AvatarCell size="lg" turboy={turboy} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-semibold leading-tight text-foreground">
              {turboy.prenoms} {turboy.nom}
            </span>
            <Chip className="w-fit" size="sm" variant="soft">
              <Chip.Label>{typeDisplay.label}</Chip.Label>
            </Chip>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Mail aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{turboy.email ?? '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone aria-hidden="true" className="size-3.5 shrink-0" />
            <span>{turboy.telephone ?? '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{turboy.habitation ?? '-'}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <StatusChip status={turboy.status} />
          <span className="text-xs tabular-nums text-muted">{salaire}</span>
          <TurboyActionMenu turboy={turboy} />
        </div>
      </Card.Content>
    </Card>
  );
}
