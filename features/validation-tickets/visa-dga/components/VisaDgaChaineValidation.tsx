/*
 * Frise de la chaine de validation d'un creneau, rendue avec HeroUI V3.
 *
 * <p>Le panneau etait une `div` habillee a la main (`rounded-xl border border-separator
 * bg-surface p-5`) : le rayon et la surface devaient etre reportes ici a chaque reglage du
 * theme, et l'ecran s'est deja retrouve avec deux rayons differents pour la meme carte.
 * `Card` porte deja sa surface, son rayon et son espacement.</p>
 *
 * <p>Les etats etaient peints en vert et bleu fixes (`bg-green-500`, `bg-blue-600`,
 * `bg-blue-50`, `text-blue-700`). En theme sombre le bleu tres clair du bloc de l'etape
 * courante restait clair sous du texte clair : l'operateur ne lisait plus a quelle etape
 * le creneau se trouvait. L'echelle `success` marque ce qui est fait, `accent` ce qui
 * appelle l'attention, et les deux suivent le theme.</p>
 */
import { Card } from '@heroui-v3/react';
import { Check } from 'lucide-react';

import { IEtapeValidation } from '../types/visa-dga.type';

interface Props {
  etapes: IEtapeValidation[];
}

export default function VisaDgaChaineValidation({ etapes }: Props) {
  return (
    <Card className="w-full self-start lg:sticky lg:top-6 lg:w-[300px] lg:shrink-0">
      <Card.Header>
        <Card.Title>Chaîne de validation</Card.Title>
        <Card.Description>Statuts traversés par le créneau</Card.Description>
      </Card.Header>

      <Card.Content>
        <ol className="flex flex-col">
          {etapes.map((etape, idx) => {
            const isLast = idx === etapes.length - 1;
            const isCourant = etape.statut === 'current';

            return (
              <li
                key={etape.numero}
                aria-current={isCourant ? 'step' : undefined}
                className="flex gap-3"
              >
                {/* Indicateur + ligne verticale */}
                <div className="flex flex-col items-center">
                  <StepIcon etape={etape} />
                  {!isLast && (
                    <div
                      aria-hidden="true"
                      className={[
                        'mt-1 min-h-5 w-px flex-1',
                        etape.statut === 'done' ? 'bg-success' : 'bg-separator',
                      ].join(' ')}
                    />
                  )}
                </div>

                {/* Contenu */}
                <div
                  className={[
                    'flex-1',
                    isCourant
                      ? '-mt-1 mb-3 rounded-lg bg-accent-soft px-3 py-2'
                      : isLast
                        ? ''
                        : 'pb-5',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-sm font-semibold leading-tight',
                      etape.statut === 'done'
                        ? 'text-foreground'
                        : isCourant
                          ? 'text-accent-soft-foreground'
                          : 'text-muted',
                    ].join(' ')}
                  >
                    {etape.label}
                  </p>
                  <p
                    className={[
                      'mt-0.5 text-[11px]',
                      isCourant
                        ? 'font-medium text-accent-soft-foreground/80'
                        : 'text-muted',
                    ].join(' ')}
                  >
                    {etape.agent}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card.Content>
    </Card>
  );
}

function StepIcon({ etape }: { etape: IEtapeValidation }) {
  if (etape.statut === 'done') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
        {/* Sans ce libelle, l'etape franchie ne se distingue des autres que par la couleur. */}
        <span className="sr-only">Étape validée</span>
      </div>
    );
  }
  if (etape.statut === 'current') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
        {etape.numero}
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-separator text-xs font-bold text-muted">
      {etape.numero}
    </div>
  );
}
