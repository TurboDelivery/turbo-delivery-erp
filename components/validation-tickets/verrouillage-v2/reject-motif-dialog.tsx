'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectMotifDialogProps {
  open: boolean;
  ticketId: string | null;
  isRejecting: boolean;
  onConfirm: (id: string, motif: string) => void;
  onClose: () => void;
}

export function RejectMotifDialog({ open, ticketId, isRejecting, onConfirm, onClose }: RejectMotifDialogProps) {
  const [motif, setMotif] = useState('');
  const canConfirm = motif.trim().length >= 30;

  const handleConfirm = () => {
    if (!ticketId || !canConfirm) return;
    onConfirm(ticketId, motif.trim());
  };

  const handleClose = () => {
    setMotif('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Motif de rejet pour fraude</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motif">
            Motif <span className="text-muted text-xs">(min. 30 caractères)</span>
          </Label>
          <Textarea
            id="motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Décrivez le motif du rejet..."
            rows={4}
          />
          <p className="text-xs text-muted">{motif.trim().length} / 30 caractères minimum</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRejecting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm || isRejecting}>
            {isRejecting ? 'Rejet en cours...' : 'Confirmer le rejet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
