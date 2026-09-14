'use client';

import { Avatar } from '@heroui-v3/react';
import React from 'react';

import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { cn } from '@/lib/utils';
import { createUrlFile } from '@/utils/createUrlFile';

/**
 * Les initiales, MEME SANS NOM.
 *
 * <p>Elle recevait deux `string` non nullables et s'en sortait deja par des `?.` — mais le
 * TYPE, lui, promettait des chaines. 12 livreurs sur 191 ont nom ET prenoms nuls (mesure du
 * 14/09/2026, tous independants) : la fonction rendait alors une chaine VIDE, et l'avatar
 * n'affichait rien du tout. Un point d'interrogation dit « ce coursier n'a pas de nom », le
 * vide ne dit rien.</p>
 */
function getInitials(prenoms: string | null, nom: string | null): string {
  const initiales = `${prenoms?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase();
  return initiales || '?';
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

  /*
   * Les parties NULLES sont ecartees avant la jointure : sans cela le texte alternatif de
   * l'image valait « null null », lisible par un lecteur d'ecran.
   */
  const nomComplet = [turboy.prenoms, turboy.nom].filter(Boolean).join(' ');

  return (
    <Avatar className={cn('shrink-0', size === 'lg' ? 'size-11 text-sm' : 'size-9 text-xs')}>
      {url && <Avatar.Image alt={nomComplet || 'Coursier sans nom'} src={url} />}
      <Avatar.Fallback>{getInitials(turboy.prenoms, turboy.nom)}</Avatar.Fallback>
    </Avatar>
  );
}
