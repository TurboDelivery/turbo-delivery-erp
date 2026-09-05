'use client';

import { Button, Tooltip } from '@heroui-v3/react';
import { Check, Copy } from 'lucide-react';
import React from 'react';

/**
 * Une valeur qu'on lit et qu'on recopie : une URL, une clé d'API, un identifiant.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>C'était le `Snippet` de la v2, qui n'a pas d'équivalent en v3. Il faisait deux
 * choses : afficher la valeur en police à chasse fixe, et la copier en un clic. Les deux
 * sont refaites ici avec les composants de la bibliothèque, plus un retour visible — sans
 * confirmation, on ne sait pas si le clic a pris, et on recopie à la main « au cas où ».</p>
 */
export function ChampCopiable({
  className,
  masquable,
  valeur,
}: {
  className?: string;
  /** Vrai pour un secret : la valeur est masquée tant qu'on ne la révèle pas. */
  masquable?: boolean;
  valeur: string;
}) {
  const [copie, setCopie] = React.useState(false);
  const [revele, setRevele] = React.useState(!masquable);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      // Le presse-papiers peut être refusé (contexte non sécurisé) : la valeur reste
      // lisible et sélectionnable à la main, on ne prétend pas avoir copié.
    }
  };

  return (
    <div
      className={[
        'flex items-center gap-2 rounded-lg border border-separator bg-surface-secondary px-3 py-2',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="min-w-0 flex-1 font-mono text-xs break-all text-foreground">
        {revele ? valeur : '•'.repeat(Math.min(valeur.length, 32))}
      </span>
      {masquable && (
        <Button onPress={() => setRevele((v) => !v)} size="sm" variant="ghost">
          {revele ? 'Masquer' : 'Afficher'}
        </Button>
      )}
      <Tooltip>
        <Button aria-label="Copier" isIconOnly onPress={copier} size="sm" variant="ghost">
          {copie ? (
            <Check aria-hidden="true" className="size-4 text-success" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
        </Button>
        <Tooltip.Content>{copie ? 'Copié' : 'Copier'}</Tooltip.Content>
      </Tooltip>
    </div>
  );
}
