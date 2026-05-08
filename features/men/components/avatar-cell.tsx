'use client';

import React from 'react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { createUrlFile } from '@/utils/createUrlFile';
import { getInitials } from '@/lib/avatar.utils';

const AVATAR_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B', '#6366F1', '#14B8A6'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}


export function AvatarCell({ turboy, size = 'sm' }: { turboy: ITurboy; size?: 'sm' | 'lg' }) {
  const bg = getAvatarColor(turboy.id);
  const cls = size === 'lg' ? 'w-11 h-11 text-sm font-bold' : 'w-9 h-9 text-xs font-semibold';
  if (turboy.avatarUrl) {
    return (
      <img
        src={createUrlFile(turboy.avatarUrl, 'backend')}
        alt={`${turboy.prenoms} ${turboy.nom}`}
        className={`${cls} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center text-white shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {getInitials(`${turboy.prenoms} ${turboy.nom}`)}
    </div>
  );
}
