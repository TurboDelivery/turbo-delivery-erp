'use client';

/*
 * Confirmation du visa DGA avant transmission au PDG.
 *
 * <p>Deux corrections portees par le passage en V3 :</p>
 *
 * <p>1. Le resume et le pave d'explication etaient peints en `bg-green-50` / `bg-blue-50`
 * sans variante sombre. Avec la bascule de theme de l'en-tete, l'operateur qui travaille
 * en sombre lisait du texte fonce sur un fond clair au milieu d'une fenetre sombre : les
 * chiffres qu'il doit verifier AVANT de viser devenaient les moins lisibles de l'ecran.
 * Les jetons `surface-secondary` / `separator` suivent le theme.</p>
 *
 * <p>2. Le bouton de confirmation etait force en rouge (`bg-red-500`) alors que la barre
 * d'action de la meme page peint « Viser » en vert et « Rejeter » en rouge. Dans la
 * fenetre, viser et rejeter se presentaient donc a l'identique : c'est le geste
 * irreversible qui portait la couleur du refus. Il reprend le bouton primaire.</p>
 */

import { Button, Modal, Spinner } from '@heroui-v3/react';
import { ShieldCheck } from 'lucide-react';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  codeCreneau: string;
  totaux: {
    livreurs: number;
    tickets: number;
    net: number;
  };
}

export default function VisaDgaViserModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  codeCreneau,
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
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <ShieldCheck className="size-5" />
            </Modal.Icon>
            <div className="flex flex-col gap-0.5">
              <Modal.Heading>Viser et Transmettre au PDG</Modal.Heading>
              <p className="text-sm text-muted">Créneau : {codeCreneau}</p>
            </div>
          </Modal.Header>

          <Modal.Body>
            <p className="mb-2 text-sm font-semibold text-foreground">Résumé du Créneau</p>

            {/* Trois chiffres a rapprocher avant de viser : chasse tabulaire et alignement
                a droite pour qu'ils se comparent d'un coup d'oeil. */}
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

            <p className="mt-4 rounded-xl border border-separator px-4 py-3">
              <span className="font-semibold text-foreground">Action :</span> Le Créneau sera marqué
              comme &quot;Visé DGA&quot; et transmis automatiquement au PDG pour l&apos;approbation
              finale.
            </p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isLoading} onPress={onClose}>
              Annuler
            </Button>
            <Button isPending={isLoading} onPress={onConfirm}>
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? 'Envoi...' : 'Viser et Transmettre'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
