'use client';

/*
 * La file d'attente de la regularisation, en HeroUI V3.
 *
 * <h3>Ce qui n'allait pas</h3>
 * <ul>
 *   <li>Le cadre du panneau etait une `div` habillee a la main (`rounded-xl border
 *       border-separator bg-surface`) : des valeurs de theme recopiees a cote du theme,
 *       qui derivent des que celui-ci bouge, et l'ecart ne se voit qu'une fois l'ecran
 *       ouvert.</li>
 *   <li>Le compteur etait une pastille `bg-orange-100 text-orange-600` sans variante
 *       sombre : depuis que la bascule de theme est dans l'en-tete, elle restait un aplat
 *       clair pose sur un panneau sombre. `Chip` en `warning`/`soft` dit la meme chose,
 *       l'attente, et suit les deux themes.</li>
 *   <li>L'horloge du titre etait un caractere emoji colore en dur : son dessin depend de
 *       la police du systeme et sa teinte ne suivait aucun theme. Les lignes de la file
 *       portent deja l'icone `Clock`.</li>
 *   <li>Pendant la premiere lecture, la file affichait « Aucun ticket en attente ». Ce
 *       message se lit exactement comme « rien a traiter » : l'operateur pouvait quitter
 *       l'ecran alors que les tickets n'etaient pas encore arrives. Tant que la lecture
 *       est en cours et que rien n'est encore affichable, la file montre des gabarits.</li>
 * </ul>
 *
 * <p>Ce qui ne change pas : les memes tickets dans le meme ordre, le meme compteur, la
 * meme selection, l'echec de lecture toujours distingue d'une file vide, et la meme
 * relance.</p>
 */

import { Card, Chip, Skeleton } from '@heroui-v3/react';
import { Clock } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';

import RegularisationQueueItem from './RegularisationQueueItem';

interface Props {
  tickets: BonLivraisonTerminee[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isError?: boolean;
  isFetching?: boolean;
  onReessayer?: () => void;
}

export default function RegularisationQueue({
  tickets,
  selectedId,
  onSelect,
  isError = false,
  isFetching = false,
  onReessayer,
}: Props) {
  // Une lecture en cours sans rien a montrer n'est ni une file vide ni un echec.
  const enChargement = isFetching && tickets.length === 0 && !isError;

  return (
    <Card className="w-full lg:w-[340px] lg:shrink-0">
      <Card.Header className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-4 text-muted" />
          {/* Le titre reste un h2 : ce panneau est fils du h1 de la page. */}
          <Card.Title render={(props) => <h2 {...props} />}>File d&apos;attente</Card.Title>
        </div>
        <Chip color="warning" size="sm" variant="soft">
          <Chip.Label>{tickets.length}</Chip.Label>
        </Chip>
      </Card.Header>

      <div aria-busy={enChargement} className="divide-y divide-separator">
        {tickets.map((ticket) => (
          <RegularisationQueueItem
            key={ticket.commandeId}
            ticket={ticket}
            isSelected={selectedId === ticket.commandeId}
            onSelect={onSelect}
          />
        ))}

        {/* Le gabarit garde la forme d'une ligne de la file : sans cela, la liste saute
            au moment ou les vrais tickets arrivent. */}
        {enChargement &&
          Array.from({ length: 4 }).map((_, i) => (
            <div className="flex items-center gap-3 px-4 py-3" key={`gabarit-${i}`}>
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-14 shrink-0" />
            </div>
          ))}

        {/* Un echec de chargement ne doit pas se lire comme « aucun ticket en attente » :
            la file paraissait traitee alors que rien n'avait pu etre lu. */}
        {isError && (
          <EtatErreur
            quoi="les tickets à régulariser"
            onReessayer={onReessayer}
            enCours={isFetching}
          />
        )}
        {!isError && !enChargement && tickets.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Aucun ticket en attente</p>
        )}
      </div>
    </Card>
  );
}
