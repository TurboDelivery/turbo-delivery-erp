'use client';

import { Button } from '@heroui/react';

interface RequestHeaderProps {
  onNewRequest: () => void;
}

export function RequestHeader({ onNewRequest }: RequestHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Demandes de congé</h2>
      <Button color="primary" onPress={onNewRequest}>
        Nouvelle demande
      </Button>
    </div>
  );
}
