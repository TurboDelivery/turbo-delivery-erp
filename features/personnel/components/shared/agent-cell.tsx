'use client';

import Link from 'next/link';

import { initiales } from '@/features/personnel/utils/personnel-historisation.utils';

interface AgentCellProps {
  nom: string | null;
  matricule?: string | null;
  sousTitre?: string | null;
  /** Quand il est fourni, le nom devient un lien vers la fiche agent. */
  employeId?: string | null;
  /** Mention discrète en fin de sous-titre (ex. « sorti de l'effectif »). */
  mention?: string | null;
}

/** Identité d'un agent : initiales, nom, matricule, poste et agence — même rendu partout. */
export function AgentCell({ nom, matricule, sousTitre, employeId, mention }: AgentCellProps) {
  const contenuNom = (
    <span className="text-sm font-semibold text-default-800">{nom ?? '—'}</span>
  );

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-default-100 text-[11px] font-semibold text-default-600">
        {initiales(nom)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {employeId ? (
            <Link href={`/personnel/${employeId}`} className="hover:underline">
              {contenuNom}
            </Link>
          ) : (
            contenuNom
          )}
          {matricule ? <span className="font-mono text-[11px] text-default-400">{matricule}</span> : null}
        </div>
        <div className="truncate text-xs text-default-400">
          {sousTitre && sousTitre.trim() ? sousTitre : 'Poste non renseigné'}
          {mention ? <span className="text-default-400"> · {mention}</span> : null}
        </div>
      </div>
    </div>
  );
}
