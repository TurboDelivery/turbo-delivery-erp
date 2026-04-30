'use client';

import { Timer } from 'lucide-react';

interface Props {
  pendingCount: number;
}

export default function RegularisationPageHeader({ pendingCount }: Props) {
  return (
    <div className="relative rounded-xl bg-red-500 px-8 py-6 text-white overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-100 mb-1">
        Vérification B — Circuit anti-fraude
      </p>
      <h1 className="text-2xl font-bold">Régularisation des tickets en retard</h1>
      <p className="mt-1 text-sm text-red-100">Approbation spéciale pour les tickets saisis hors créneau.</p>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <Timer className="h-6 w-6 text-white" />
        </div>
        <span className="text-[10px] font-medium text-red-100 uppercase tracking-wide">En attente</span>
        <span className="text-2xl font-extrabold leading-none">{pendingCount}</span>
      </div>
    </div>
  );
}
