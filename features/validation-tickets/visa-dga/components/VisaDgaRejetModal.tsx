'use client';

/*
 * Rejet du creneau par le DGA : le lot repart a la Comptabilite avec un motif.
 *
 * Deux corrections portees par le passage en V3.
 *
 * 1. Le resume etait peint en `bg-red-50` / `divide-red-100` et le montant en
 * `text-emerald-600`, sans variante sombre. Avec la bascule de theme de l'en-tete,
 * l'operateur qui travaille en sombre voyait un pave clair a texte fonce au milieu d'une
 * fenetre sombre : les trois chiffres qu'il doit relire AVANT de renvoyer le lot etaient
 * les moins lisibles de l'ecran. Les jetons `surface-secondary`, `separator` et `success`
 * disent la meme chose et suivent les deux themes.
 *
 * 2. Le bouton de confirmation etait force en rouge a la main (`bg-red-500 hover:bg-red-600`)
 * alors que `variant="danger"` existe : la teinte du geste irreversible etait recopiee ici
 * et ne bougeait plus avec le theme.
 */

import { Button, Label, Modal, Spinner, TextArea } from '@heroui-v3/react';
import { RotateCcw } from 'lucide-react';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  motif: string;
  onMotifChange: (v: string) => void;
  totaux: {
    livreurs: number;
    tickets: number;
    net: number;
  };
}

export default function VisaDgaRejetModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  motif,
  onMotifChange,
  totaux,
}: Props) {
  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(ouvert) => {
        if (!ouvert) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />

          <Modal.Header>
            {/* Meme icone que « Rejeter et renvoyer » dans la barre d'action : l'operateur
                retrouve le geste qu'il vient de declencher. */}
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <RotateCcw className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Rejeter le Créneau</Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            {/* Trois chiffres a rapprocher avant de renvoyer le lot : chasse tabulaire et
                alignement a droite pour qu'ils se comparent d'un coup d'oeil. */}
            <dl className="divide-y divide-separator overflow-hidden rounded-xl bg-surface-secondary">
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt>Indépendants à payer</dt>
                <dd className="font-medium tabular-nums text-foreground">{totaux.livreurs}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt>Tickets totaux</dt>
                <dd className="font-medium tabular-nums text-foreground">{totaux.tickets}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt>Total à payer (Indépendants)</dt>
                <dd className="font-semibold tabular-nums text-success-soft-foreground">
                  {formatNumber(totaux.net)} FCFA
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-1.5">
              <Label htmlFor="visa-dga-motif-rejet">Commentaire de rejet</Label>
              {/* `resize-none` : la poignee de redimensionnement du navigateur laisse tirer
                  la zone au-dela de la fenetre et decale le pied de page. */}
              <TextArea
                fullWidth
                className="resize-none"
                id="visa-dga-motif-rejet"
                placeholder="Expliquez la raison du rejet pour renvoyer à la Comptabilité..."
                rows={4}
                value={motif}
                onChange={(e) => onMotifChange(e.target.value)}
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isLoading} onPress={onClose}>
              Annuler
            </Button>
            {/* `isPending` bloque deja la pression pendant l'envoi : le garde sur le motif
                vide reste le seul `isDisabled` a porter. */}
            <Button
              variant="danger"
              isDisabled={!motif.trim()}
              isPending={isLoading}
              onPress={onConfirm}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? 'Envoi...' : 'Confirmer le Rejet'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
