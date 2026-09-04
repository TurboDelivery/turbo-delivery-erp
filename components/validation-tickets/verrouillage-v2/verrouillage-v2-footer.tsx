'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Lock } from 'lucide-react';
import { VerrouillageV2ExportButton } from './verrouillage-v2-export-button';

interface VerrouillageV2FooterProps {
  ticketCount: number;
  isValidating: boolean;
  onValidateAll: () => void;
}

export function VerrouillageV2Footer({ ticketCount, isValidating, onValidateAll }: VerrouillageV2FooterProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onValidateAll();
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-orange-700">Action critique</p>
          <p className="text-xs text-orange-500 mt-0.5">Une fois validé, les tickets passerons a la comptabilité</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          <VerrouillageV2ExportButton totalItems={ticketCount} />
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" disabled={ticketCount === 0 || isValidating} onClick={() => setOpen(true)}>
            <Lock className="h-4 w-4" />
            {isValidating ? 'Validation en cours...' : 'Valider V2'}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Confirmer le verrouillage
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">
              Vous êtes sur le point de valider{' '}
              <span className="font-semibold">
                {ticketCount} ticket{ticketCount > 1 ? 's' : ''}
              </span>{' '}
              en V2 et de verrouiller définitivement le créneau.
            </p>
            <p className="text-sm text-orange-600 font-medium">Cette action est irréversible. Les tickets passeront en PENDING_APPROBATION.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirm}>
              <Lock className="h-4 w-4 mr-1.5" />
              Confirmer la validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
