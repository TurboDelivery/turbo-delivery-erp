'use client';

import { Button } from '@/components/ui/button';
import { FileText, Lock } from 'lucide-react';

interface VerrouillageV2FooterProps {
  ticketCount: number;
  isValidating: boolean;
  onValidateAll: () => void;
}

export function VerrouillageV2Footer({ ticketCount, isValidating, onValidateAll }: VerrouillageV2FooterProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-orange-700">Action critique — Verrouillage irréversible</p>
        <p className="text-xs text-orange-500 mt-0.5">
          Une fois verrouillé, tout ticket pour ce créneau passera en PENDING_APPROBATION et requerra une approbation explicite.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Exporter PDF
        </Button>
        <Button
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          disabled={ticketCount === 0 || isValidating}
          onClick={onValidateAll}
        >
          <Lock className="h-4 w-4" />
          Valider V2 et Verrouiller le créneau
        </Button>
      </div>
    </div>
  );
}
