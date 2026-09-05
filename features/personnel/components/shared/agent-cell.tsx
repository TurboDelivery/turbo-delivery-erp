'use client';

import { Avatar } from '@heroui-v3/react';
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
  const contenuNom = <span className="text-sm font-semibold text-foreground">{nom ?? '—'}</span>;

  return (
    <div className="flex items-center gap-3">
      {/* C'etait un rond dessine a la main en `bg-default-100` : la bibliotheque a un avatar. */}
      <Avatar size="sm">
        <Avatar.Fallback>{initiales(nom)}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {employeId ? (
            <Link href={`/personnel/${employeId}`} className="hover:underline">
              {contenuNom}
            </Link>
          ) : (
            contenuNom
          )}
          {matricule ? <span className="font-mono text-xs text-muted">{matricule}</span> : null}
        </div>
        <div className="truncate text-xs text-muted">
          {sousTitre && sousTitre.trim() ? sousTitre : 'Poste non renseigné'}
          {mention ? <span> · {mention}</span> : null}
        </div>
      </div>
    </div>
  );
}
