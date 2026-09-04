'use client';

import { PanneauNotifications } from './panneau';
import { useNotificationController } from './controller';

/**
 * Branche le controleur sur le panneau refondu.
 *
 * <p>Ce fichier contenait 112 lignes de balisage : un `Dropdown` maison sans surface, un
 * titre en gros rouge, un onglet « Tous 1 » qui ne faisait rien choisir, le type de
 * notification en pastille rouge pleine ayant l'apparence d'un bouton destructeur, et un
 * message qui repetait mot pour mot le titre au-dessus. Tout cela vit desormais dans
 * `panneau.tsx`, reconstruit avec les composants v3 ; il ne reste ici que le cablage.</p>
 */
const Content = ({ className }: { className?: string }) => {
    const ctrl = useNotificationController();

    return (
        <div className={className}>
            <PanneauNotifications
                nonLues={ctrl.notificationNonLus.length}
                notifications={ctrl.toutNotifications.length ? ctrl.toutNotifications : ctrl.notificationNonLus}
                onToutMarquer={ctrl.toutMarqueCommeLus}
            />
        </div>
    );
};

export default Content;
