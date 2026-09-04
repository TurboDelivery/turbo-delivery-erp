'use client';

/*
 * Motif de rejet pour fraude, depuis le verrouillage V2. Le texte saisi ici part avec la
 * decision et reste lisible ensuite sur le ticket archive : d'ou le minimum de 30
 * caracteres exige avant de pouvoir confirmer.
 *
 * Trois defauts corriges au passage en V3.
 *
 * 1. Le motif n'etait vide que par `handleClose`, c'est a dire quand l'operateur fermait
 * lui meme la fenetre. Apres un rejet reussi c'est le parent qui referme
 * (`rejectDialogId` repasse a null) sans passer par la fermeture du composant : le texte
 * du ticket precedent restait dans la zone de saisie et se retrouvait pre-rempli sur le
 * ticket suivant. Accuser un livreur de fraude avec le motif ecrit pour un autre est la
 * faute que le garde sur `ticketId` evite.
 *
 * 2. Pendant l'envoi le bouton changeait seulement de mot (« Rejet en cours... ») sans
 * indicateur d'attente. Sur une connexion lente l'operateur voyait un bouton d'apparence
 * inerte, pouvait croire que rien n'etait parti, et reappuyer. `isPending` porte
 * l'attente et bloque la seconde pression.
 *
 * 3. Le bouton restait gris tant que le motif n'atteignait pas 30 caracteres, et la seule
 * explication de ce blocage etait le compteur sous la zone de saisie. L'info-bulle est
 * portee par `Tooltip.Trigger` et non par le bouton : un declencheur desactive n'emet ni
 * survol ni focus, donc pose sur le bouton elle ne s'ouvrirait jamais, precisement dans
 * le seul etat ou elle sert.
 */

import { useState } from 'react';
import { Button, Label, Modal, Spinner, TextArea, Tooltip } from '@heroui-v3/react';
import { XCircle } from 'lucide-react';

/** Longueur opposable du motif : on n'accuse pas un livreur de fraude en trois mots. */
const MIN_MOTIF = 30;

const ID_MOTIF = 'verrouillage-v2-motif-rejet';
const ID_AIDE_MOTIF = 'verrouillage-v2-motif-rejet-aide';

interface RejectMotifDialogProps {
  open: boolean;
  ticketId: string | null;
  isRejecting: boolean;
  onConfirm: (id: string, motif: string) => void;
  onClose: () => void;
}

export function RejectMotifDialog({ open, ticketId, isRejecting, onConfirm, onClose }: RejectMotifDialogProps) {
  const [motif, setMotif] = useState('');

  // Le motif appartient au ticket ouvert : des que le parent en designe un autre, ou
  // referme apres un rejet reussi, la zone de saisie repart vide.
  const [ticketSaisi, setTicketSaisi] = useState(ticketId);
  if (ticketId !== ticketSaisi) {
    setTicketSaisi(ticketId);
    setMotif('');
  }

  const longueur = motif.trim().length;
  const canConfirm = longueur >= MIN_MOTIF;
  const manquants = MIN_MOTIF - longueur;

  const handleConfirm = () => {
    if (!ticketId || !canConfirm) return;
    onConfirm(ticketId, motif.trim());
  };

  const handleClose = () => {
    setMotif('');
    onClose();
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(ouvert) => {
        if (!ouvert) handleClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />

          <Modal.Header>
            {/* Meme icone que « Rejeter » dans la ligne du tableau : l'operateur retrouve
                le geste qu'il vient de declencher. */}
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <XCircle className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Motif de rejet pour fraude</Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Label htmlFor={ID_MOTIF}>Motif</Label>
                <span className="text-xs text-muted">min. {MIN_MOTIF} caractères</span>
              </div>
              {/* `resize-none` : la poignee de redimensionnement du navigateur laisse tirer
                  la zone au-dela de la fenetre et decale le pied de page. */}
              <TextArea
                fullWidth
                aria-describedby={ID_AIDE_MOTIF}
                className="resize-none"
                id={ID_MOTIF}
                placeholder="Décrivez le motif du rejet..."
                rows={4}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
              />
              {/* `aria-live` : au clavier, le decompte etait la seule chose qui bougeait a
                  l'ecran sans jamais etre annoncee. La couleur ne dit rien seule, le
                  compte reste ecrit. */}
              <p
                aria-live="polite"
                className={
                  longueur > 0 && !canConfirm
                    ? 'text-xs text-danger-soft-foreground'
                    : 'text-xs text-muted'
                }
                id={ID_AIDE_MOTIF}
              >
                <span className="tabular-nums">{longueur}</span> / {MIN_MOTIF} caractères minimum
              </p>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isRejecting} onPress={handleClose}>
              Annuler
            </Button>
            <Tooltip>
              <Tooltip.Trigger>
                {/* `isPending` bloque deja la pression pendant l'envoi : le garde sur la
                    longueur du motif reste le seul `isDisabled` a porter. */}
                <Button
                  variant="danger"
                  isDisabled={!canConfirm}
                  isPending={isRejecting}
                  onPress={handleConfirm}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      {isPending ? 'Rejet en cours...' : 'Confirmer le rejet'}
                    </>
                  )}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {canConfirm
                  ? 'Le ticket sera classé « Rejeté (fraude) »'
                  : `Encore ${manquants} caractère${manquants > 1 ? 's' : ''} de motif avant de pouvoir rejeter`}
              </Tooltip.Content>
            </Tooltip>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
