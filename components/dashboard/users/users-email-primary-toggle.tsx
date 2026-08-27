'use client';

import { useState, useTransition } from 'react';
import { Switch, Tooltip } from '@heroui/react';
import { toggleUserEmailPrimary } from '@/src/actions/users.actions';
import { User } from '@/types/models';

/**
 * 2026-05 — Switch HeroUI pour basculer le flag notification_email_primary
 * d'un user.
 *
 * Quand activé, l'user reçoit les emails SMTP des notifications de workflow
 * (charges, factures, tickets) en plus du push WS in-app que tout user du
 * rôle reçoit. Sert à limiter le volume d'emails sous le quota Hostinger 50/h
 * en désignant 1-2 destinataires primaires par rôle.
 *
 * UX optimiste : on bascule l'état local immédiatement (pour que le user voie
 * le changement instantané), on appelle le server action en arrière-plan, et
 * on rollback si erreur.
 */
export default function UsersEmailPrimaryToggle({ user }: { user: User }) {
  const initial = Boolean(user.notificationEmailPrimary);
  const [checked, setChecked] = useState<boolean>(initial);
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextChecked: boolean) => {
    // Optimiste : on flip immédiatement.
    setChecked(nextChecked);
    startTransition(async () => {
      const result = await toggleUserEmailPrimary(user.id);
      if (result.status === 'error') {
        // Rollback en cas d'échec serveur.
        setChecked(!nextChecked);
      } else if (result.data) {
        // Synchroniser sur la vérité serveur (au cas où on aurait raté un état).
        setChecked(Boolean(result.data.notificationEmailPrimary));
      }
    });
  };

  return (
    <Tooltip
      content={
        checked
          ? `${user.nom} ${user.prenoms} reçoit les emails de notification`
          : `${user.nom} ${user.prenoms} ne reçoit pas les emails (in-app seulement)`
      }
    >
      <span>
        <Switch
          isSelected={checked}
          onValueChange={handleChange}
          isDisabled={isPending}
          size="sm"
          color="success"
          aria-label="Destinataire des emails de notification"
        />
      </span>
    </Tooltip>
  );
}
