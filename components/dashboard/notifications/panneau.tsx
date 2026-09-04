'use client';

import { Button, Chip, Popover, Separator } from '@heroui-v3/react';
import {
    AlertTriangle,
    Banknote,
    Bell,
    CheckCircle2,
    Clock,
    Package,
    Store,
    Ticket,
    Truck,
    UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import type { NotificationType, NotificationVm } from '@/features/notifications/types/notification.type';
import { cn } from '@/lib/utils';

/**
 * Panneau de notifications.
 *
 * <h3>Ce qui n'allait pas, au-dela du fond transparent</h3>
 * <ul>
 *   <li><b>« Notification » en gros rouge.</b> L'accent de marque etait depense sur un
 *       intitule qui informe. Il est desormais reserve a ce qui appelle un geste — ici
 *       le compteur de non-lues et le lien de detail.</li>
 *   <li><b>« Tous marquer comme lus » en texte gris.</b> Une action qui ne ressemble pas
 *       a une action ne se clique pas. C'est un bouton, et il n'apparait que s'il y a
 *       reellement quelque chose a marquer.</li>
 *   <li><b>« Tous 1 ».</b> Un onglet unique avec un compte qui ne correspondait a rien.
 *       Supprime : un onglet qui ne fait pas choisir n'est pas un onglet.</li>
 *   <li><b>Le type en grosse pastille rouge pleine.</b> « Facture Depose Partenaire » avait
 *       l'apparence exacte d'un bouton d'action destructrice, alors que c'est une
 *       etiquette. Il devient une etiquette discrete, et son icone porte la famille.</li>
 *   <li><b>Le titre et le message se repetaient</b> — le numero de facture figurait dans
 *       les deux. Le message est desormais borne a deux lignes : le titre porte
 *       l'essentiel, le message le detaille sans occuper l'ecran.</li>
 *   <li><b>Rien ne distinguait une non-lue</b> sinon un point vert sur une cloche. Un
 *       liseré d'accent le dit, sans repeindre la ligne entiere.</li>
 * </ul>
 *
 * <p>Sur telephone le panneau prend la largeur de l'ecran moins ses marges, au lieu de
 * deborder ; sa hauteur est bornee et la liste defile a l'interieur.</p>
 */

/** Famille visuelle par type. L'icone dit de quoi il s'agit avant qu'on ait lu. */
const FAMILLES: { icone: LucideIcon; teinte: string; types: NotificationType[] }[] = [
    {
        icone: Banknote,
        teinte: 'text-emerald-700 dark:text-emerald-400',
        types: ['CHARGE_A_VISER_DGA', 'CHARGE_A_APPROUVER_DG', 'CHARGE_A_DECAISSER', 'CHARGE_DECAISSEE', 'RETRAIT_CONFIRME'],
    },
    { icone: AlertTriangle, teinte: 'text-red-700 dark:text-red-400', types: ['CHARGE_REJETEE', 'ANNULATION_COMMANDE', 'COURSE_CLOTURE_BLOQUEE', 'CONTESTATION_PAIE', 'DEMANDE_ASSIGNATION_REJETER'] },
    { icone: Ticket, teinte: 'text-blue-700 dark:text-blue-400', types: ['TICKET_AUTHENTIFIE', 'TICKET_V1_VALIDE', 'TICKET_V2_VALIDE', 'VALIDATION_PARTIELLE', 'VALIDATION_COMPLETE'] },
    { icone: Truck, teinte: 'text-indigo-700 dark:text-indigo-400', types: ['NOUVELLE_COURSE', 'ACCEPTATION_COURSE', 'ASSIGNATION_COURSE', 'CLOTURE_COURSE', 'DEMANDE_ASSIGNATION', 'DEMANDE_ASSIGNATION_ACCEPTE'] },
    { icone: Package, teinte: 'text-orange-700 dark:text-orange-400', types: ['COMMANDE', 'NOUVELLE_COMMANDE'] },
    { icone: UserPlus, teinte: 'text-purple-700 dark:text-purple-400', types: ['NOUVEAU_LIVREUR', 'INSCRIPTION_PARTENAIRE'] },
    { icone: Store, teinte: 'text-purple-700 dark:text-purple-400', types: ['NOUVEAU_RESTAURANT', 'NOUVEAU_MESSAGE_PARTENAIRE', 'DEMANDE_RAPPEL_PARTENAIRE'] },
    { icone: Clock, teinte: 'text-amber-700 dark:text-amber-400', types: ['POINTAGE_START', 'POINTAGE_MID', 'POINTAGE_END', 'CRENEAU_LIVREUR', 'RAPPEL'] },
];

function familleDe(type: NotificationType) {
    const f = FAMILLES.find((x) => x.types.includes(type));
    return f ?? { icone: Bell, teinte: 'text-muted' };
}

/** `CHARGE_A_VISER_DGA` se lit mal ; on rend l'etiquette a la langue. */
const enClair = (type: string) =>
    type
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^./, (c) => c.toUpperCase());

function Ligne({ n }: { n: NotificationVm }) {
    const { icone: Icone, teinte } = familleDe(n.type);

    const corps = (
        <div className="flex gap-3 px-4 py-3">
            {/* Le liseré dit « non lue » sans repeindre toute la ligne. */}
            <span
                aria-hidden="true"
                className={cn('mt-0.5 w-0.5 shrink-0 rounded-full', n.lu ? 'bg-transparent' : 'bg-accent')}
            />
            <Icone aria-hidden="true" className={cn('mt-0.5 size-[18px] shrink-0', teinte)} />

            <div className="min-w-0 flex-1">
                <p className={cn('text-sm leading-snug', n.lu ? 'font-medium text-foreground/90' : 'font-semibold text-foreground')}>
                    {n.titre}
                </p>
                {n.message && (
                    // Deux lignes au plus : le message reprenait mot pour mot ce que le
                    // titre disait deja, et occupait six lignes pour le redire.
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{n.message}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Chip className="text-[10px]" size="sm" variant="soft">
                        {enClair(n.type)}
                    </Chip>
                    <span className="text-[11px] text-muted">{n.tempsPasse}</span>
                </div>
            </div>
        </div>
    );

    if (!n.lien) return <li className="hover:bg-surface-secondary">{corps}</li>;

    return (
        <li>
            <Link
                className="block rounded-md hover:bg-surface-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                href={n.lien}
            >
                {corps}
            </Link>
        </li>
    );
}

interface PanneauProps {
    notifications: NotificationVm[];
    nonLues: number;
    onToutMarquer: () => void;
}

export function PanneauNotifications({ notifications, nonLues, onToutMarquer }: PanneauProps) {
    return (
        <Popover>
            <Popover.Trigger
                aria-label={
                    nonLues > 0 ? `Notifications — ${nonLues} non lues` : 'Notifications'
                }
                className="relative rounded-full p-2 text-foreground hover:bg-surface-secondary"
            >
                <Bell aria-hidden="true" className="size-5" />
                {nonLues > 0 && (
                    <span className={cn(
                            'absolute -top-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1',
                            'text-[10px] font-bold leading-none ring-2 ring-surface ltr:-right-0.5 rtl:-left-0.5',
                            // Le declencheur portait `hover:text-accent` : au survol, le
                            // chiffre prenait la couleur du FOND de sa propre pastille et
                            // disparaissait, laissant une tache rouge. Le survol agit
                            // desormais sur le fond du bouton, pas sur sa couleur de texte,
                            // et le chiffre garde la sienne quoi qu'il arrive.
                            'text-white!',
                        )}>
                        {nonLues > 99 ? '99+' : nonLues}
                    </span>
                )}
            </Popover.Trigger>

            {/* Sur telephone : largeur de l'ecran moins les marges, au lieu de deborder. */}
            <Popover.Content className="w-[min(420px,calc(100vw-2rem))] p-0" placement="bottom end">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <h2 className="text-sm font-semibold text-foreground">
                        Notifications
                        {nonLues > 0 && <span className="ms-2 text-xs font-normal text-muted">{nonLues} non lues</span>}
                    </h2>
                    {/* N'apparait que s'il y a quelque chose a marquer. */}
                    {nonLues > 0 && (
                        <Button onPress={onToutMarquer} size="sm" variant="ghost">
                            <CheckCircle2 aria-hidden="true" className="size-4" />
                            Tout marquer
                        </Button>
                    )}
                </div>

                <Separator />

                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <Bell aria-hidden="true" className="size-7 text-muted" />
                        <p className="text-sm font-medium text-foreground">Rien de nouveau</p>
                        <p className="max-w-[24ch] text-xs text-muted">
                            Les validations, dépôts et incidents qui vous concernent apparaîtront ici.
                        </p>
                    </div>
                ) : (
                    <ul className="max-h-[min(60vh,480px)] divide-y divide-separator overflow-y-auto">
                        {notifications.map((n) => (
                            <Ligne key={n.id} n={n} />
                        ))}
                    </ul>
                )}

                <Separator />

                <div className="px-2 py-2">
                    <Link
                        className="block rounded-md px-2 py-1.5 text-center text-sm font-medium text-accent hover:bg-surface-secondary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                        href="/notifications"
                    >
                        Voir toutes les notifications
                    </Link>
                </div>
            </Popover.Content>
        </Popover>
    );
}
