'use client';

import { Switch } from '@heroui/react';
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
      size="sm"
      color="success"
      aria-label={isActif ? 'Désactiver la zone' : 'Activer la zone'}
      isSelected={isActif}
      isDisabled={mutation.isLoading}
      onValueChange={(value) => mutation.mutate({ fraisId, actif: value })}
    />
  );
}
