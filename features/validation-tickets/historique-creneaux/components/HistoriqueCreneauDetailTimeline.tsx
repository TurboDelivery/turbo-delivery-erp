/*
 * Frise des evenements d'un creneau de paie, rendue avec HeroUI V3.
 *
 * <p>Le panneau etait une `div` habillee a la main (`rounded-xl border border-separator
 * bg-surface p-5`), posee juste a cote des `Card` de la page de detail : deux rayons et
 * deux ombres pour deux blocs voisins, a reporter ici a chaque reglage du theme. `Card`
 * porte deja sa surface, son rayon et son espacement.</p>
 *
 * <p>Le compteur d'evenements etait peint en `text-red-500` depuis la premiere version du
 * fichier. Sur l'ecran ou l'operateur cherche precisement un rejet, un simple decompte en
 * rouge se lit comme une alerte. Il passe sur `Card.Description`, muet par defaut, et
 * s'accorde au singulier : il annoncait « 1 evenements enregistres ».</p>
 *
 * <p>Les pastilles d'icone etaient des aplats clairs sans couple sombre (`bg-blue-50`,
 * `bg-red-50`, `bg-amber-50`, `bg-green-50` avec un `text-*-500`) : depuis que la bascule
 * de theme est dans l'en-tete, elles restaient pastel sur fond sombre. Le rejet, le
 * renvoi, la validation et le paiement passent sur l'echelle d'etat, qui porte ses deux
 * themes. La soumission n'a pas d'equivalent dans cette echelle et garde son bleu, avec sa
 * variante sombre, comme les pastilles de `lot-statut.utils`.</p>
 *
 * <p>Le commentaire etait rendu en rouge QUEL QUE SOIT l'evenement : la note d'un
 * validateur ou d'un paiement s'affichait avec l'alarme d'un motif de rejet. Il prend
 * desormais le ton de son evenement et reste neutre quand l'evenement l'est.</p>
 *
 * <p>Enfin les evenements etaient empiles sans rien qui les relie : c'etait une liste, pas
 * une chronologie. Le fil vertical entre les pastilles donne l'enchainement, et la `ol`
 * annonce cet ordre a la lecture d'ecran.</p>
 */
import { Card, Chip } from '@heroui-v3/react';
import { AlertTriangle, CheckCircle2, CreditCard, FileText, Send, XCircle } from 'lucide-react';
import type { ElementType } from 'react';

import { cn } from '@/lib/utils';
import type { ICreneauTimelineEvent, TimelineEventType } from '../types/historique-creneaux.type';

interface EvenementConfig {
  icon: ElementType;
  /** Pastille de l'icone : fond et couleur d'icone accordes, dans les deux themes. */
  pastille: string;
  /** Ton du bloc de commentaire, qui suit celui de l'evenement. */
  commentaire: string;
}

const CONFIG_NEUTRE: EvenementConfig = {
  icon: FileText,
  pastille: 'bg-surface-secondary text-muted',
  commentaire: 'bg-surface-secondary text-foreground',
};

const EVENT_CONFIG: Record<TimelineEventType, EvenementConfig> = {
  creation: CONFIG_NEUTRE,
  soumission: {
    icon: Send,
    pastille: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300',
    commentaire: 'bg-surface-secondary text-foreground',
  },
  rejet: {
    icon: XCircle,
    pastille: 'bg-danger-soft text-danger-soft-foreground',
    commentaire: 'bg-danger-soft text-danger-soft-foreground',
  },
  renvoi: {
    icon: AlertTriangle,
    pastille: 'bg-warning-soft text-warning-soft-foreground',
    commentaire: 'bg-warning-soft text-warning-soft-foreground',
  },
  validation: {
    icon: CheckCircle2,
    pastille: 'bg-success-soft text-success-soft-foreground',
    commentaire: 'bg-surface-secondary text-foreground',
  },
  paiement: {
    icon: CreditCard,
    pastille: 'bg-success-soft text-success-soft-foreground',
    commentaire: 'bg-surface-secondary text-foreground',
  },
};

interface Props {
  events: ICreneauTimelineEvent[];
}

export default function HistoriqueCreneauDetailTimeline({ events }: Props) {
  const nombre = events.length;

  return (
    <Card className="self-start">
      <Card.Header>
        {/*
          Le titre etait une `h2`, au meme niveau que « Detail livreurs » dans le panneau
          voisin. `Card.Title` rend une `h3` par defaut : la frise se serait retrouvee un
          cran plus bas que son jumeau dans le plan de la page.
        */}
        <Card.Title render={(props) => <h2 {...props} />}>Timeline du Créneau</Card.Title>
        <Card.Description>
          {nombre} événement{nombre > 1 ? 's' : ''} enregistré{nombre > 1 ? 's' : ''}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        {nombre === 0 ? (
          // Le panneau se terminait sur le decompte : sous « 0 evenements » il n'y avait
          // plus rien, et le vide ne disait pas s'il s'agissait d'un creneau sans
          // historique ou d'un rendu incomplet.
          <p className="py-6 text-center text-sm text-muted">Aucun événement enregistré</p>
        ) : (
          <ol className="flex flex-col">
            {events.map((event, index) => {
              // Un type inconnu rendait `cfg` indefini et faisait tomber toute la page de
              // detail sur `cfg.icon`. La timeline vient encore d'un jeu fige : le jour ou
              // l'endpoint enverra une valeur de plus, l'evenement s'affiche en neutre.
              const cfg = EVENT_CONFIG[event.type] ?? CONFIG_NEUTRE;
              const Icon = cfg.icon;
              const dernier = index === events.length - 1;

              return (
                <li key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        cfg.pastille,
                      )}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </div>
                    {!dernier && (
                      <div aria-hidden="true" className="mt-1 min-h-4 w-px flex-1 bg-separator" />
                    )}
                  </div>

                  <div className={cn('min-w-0 flex-1', dernier ? '' : 'pb-5')}>
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {event.titre}
                    </p>

                    {/*
                      Qui a agi, a quel titre, et quand. La date etait poussee a droite du
                      titre : dans la colonne de 360 px de la page de detail, elle rognait
                      les libelles longs alors qu'elle est l'information la moins lue des
                      trois.
                    */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {event.acteurNom && (
                        <span className="text-xs font-medium text-foreground">{event.acteurNom}</span>
                      )}
                      {event.acteurRole && (
                        <Chip size="sm" variant="soft">
                          {event.acteurRole}
                        </Chip>
                      )}
                      {event.date && (
                        <span className="whitespace-nowrap text-[11px] text-muted">{event.date}</span>
                      )}
                    </div>

                    {event.commentaire && (
                      <p
                        className={cn(
                          'mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed',
                          cfg.commentaire,
                        )}
                      >
                        {event.commentaire}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card.Content>
    </Card>
  );
}
