'use client';

import { Switch } from '@heroui-v3/react';
import { useUpdateZoneActifMutation } from '../queries/zones-demande-coursier.query';

interface ZoneActifSwitchProps {
  fraisId?: string;
  actif?: boolean;
}

export default function ZoneActifSwitch({ fraisId, actif }: ZoneActifSwitchProps) {
  const mutation = useUpdateZoneActifMutation();
  const isActif = actif ?? true;

  if (!fraisId) return null;

  return (
    <Switch
      aria-label={isActif ? 'Désactiver la zone' : 'Activer la zone'}
      isDisabled={mutation.isPending}
      isSelected={isActif}
      onChange={(value) => mutation.mutate({ actif: value, fraisId })}
      size="sm"
    >
      <Switch.Content>
        <Switch.Thumb />
      </Switch.Content>
    </Switch>
  );
}
