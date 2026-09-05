'use client';

import { Avatar } from '@heroui-v3/react';
import React from 'react';

import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { cn } from '@/lib/utils';
import { createUrlFile } from '@/utils/createUrlFile';

function getInitials(prenoms: string, nom: string): string {
  return `${prenoms?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase();
}

/**
 * La photo d'un coursier, ou ses initiales.
 *
 * <p>Les initiales étaient peintes dans une palette de huit hexadécimaux tirés au hasard
 * de l'identifiant : `#F97316`, `#8B5CF6`, `#EC4899`… Huit teintes qui ne disent rien,
 * sur un écran où la couleur doit dire l'état du compte et le type de contrat. Elles
 * étaient de surcroît écrites en dur, donc indifférentes au thème sombre. Elles passent
 * au gris neutre du thème, comme sur l'écran de la file d'attente, pour la même
 * raison.</p>
 */
export function AvatarCell({ turboy, size = 'sm' }: { turboy: ITurboy; size?: 'lg' | 'sm' }) {
  const url = turboy.avatarUrl ? createUrlFile(turboy.avatarUrl, 'backend') : '';
  return (
    <Avatar className={cn('shrink-0', size === 'lg' ? 'size-11 text-sm' : 'size-9 text-xs')}>
      {url && <Avatar.Image alt={`${turboy.prenoms} ${turboy.nom}`} src={url} />}
      <Avatar.Fallback>{getInitials(turboy.prenoms, turboy.nom)}</Avatar.Fallback>
    </Avatar>
  );
}
