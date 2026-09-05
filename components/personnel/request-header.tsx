'use client';

import { Button } from '@heroui-v3/react';
import { Plus } from 'lucide-react';

interface RequestHeaderProps {
  onNewRequest: () => void;
}

export function RequestHeader({ onNewRequest }: RequestHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-foreground">Demandes de congé</h2>
      <Button onPress={onNewRequest} variant="primary">
        <Plus aria-hidden="true" className="size-4" />
        Nouvelle demande
      </Button>
    </div>
  );
}
