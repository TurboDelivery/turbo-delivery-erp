'use client';

import { ShieldAlert, Timer } from 'lucide-react';
import { Chip } from '@heroui-v3/react';
import { cn } from '@/lib/utils';

interface Props {
  pendingCount: number;
}

/*
 * L'en-tete etait un aplat rouge pleine largeur ecrit en `bg-red-500` / `text-red-100`,
 * sans variante sombre : il restait eclatant des que l'operateur basculait le theme, et
 * le medaillon de l'icone, peint en `bg-surface/20`, s'y retournait en tache sombre sur
 * du rouge. Le rouge de marque est par ailleurs reserve a ce qui appelle une action,
 * decision deja prise sur Verrouillage V2, et cet en-tete ne fait qu'informer. Le circuit
 * de controle est desormais dit par la puce, seule a garder la teinte d'alerte ; le titre
 * revient au gabarit des autres pages du module.
 */
export default function RegularisationPageHeader({ pendingCount }: Props) {
  const resteDesTickets = pendingCount > 0;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <Chip color="danger" size="sm" variant="soft">
          <ShieldAlert aria-hidden="true" className="size-3" />
          <Chip.Label>Vérification B — Circuit anti-fraude</Chip.Label>
        </Chip>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Régularisation des tickets en retard</h1>
        <p className="mt-1 text-sm text-muted">Approbation spéciale pour les tickets saisis hors créneau.</p>
      </div>

      {/* Le compteur est le chiffre que l'operateur vient chercher en ouvrant l'ecran :
          chasse tabulaire pour qu'il ne danse pas d'un rafraichissement a l'autre. Il ne
          prend la teinte d'alerte que s'il reste des tickets, sinon une pile vide
          s'annoncerait en rouge comme un probleme. */}
      <div className="flex shrink-0 items-center gap-3">
        <Timer
          aria-hidden="true"
          className={cn('size-6', resteDesTickets ? 'text-danger-soft-foreground' : 'text-muted')}
        />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">En attente</p>
          <p
            className={cn(
              'text-2xl font-extrabold leading-none tabular-nums',
              resteDesTickets ? 'text-danger-soft-foreground' : 'text-foreground',
            )}
          >
            {pendingCount}
          </p>
        </div>
      </div>
    </div>
  );
}
