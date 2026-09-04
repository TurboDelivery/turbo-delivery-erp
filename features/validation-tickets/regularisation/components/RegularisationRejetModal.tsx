'use client';

/*
 * Rejet d'un ticket tardif pour fraude. Le motif saisi ici part avec la decision et reste
 * lisible ensuite : d'ou le minimum de 30 caracteres exige avant de pouvoir confirmer.
 *
 * Quatre corrections portees par le passage en V3.
 *
 * 1. Le bouton de confirmation etait force en rouge a la main
 * (`bg-red-500 text-white hover:bg-red-600`) alors que `variant="danger"` existe : la
 * teinte du geste irreversible etait recopiee ici et ne suivait plus la bascule de theme
 * de l'en-tete.
 *
 * 2. Pendant l'envoi, le bouton changeait seulement de mot (« Rejet... ») sans indicateur
 * d'attente. Sur une connexion lente l'operateur voyait un bouton d'apparence inerte et
 * pouvait croire que rien n'etait parti, puis reappuyer. `isPending` porte l'attente et
 * bloque la seconde pression.
 *
 * 3. « Motif de rejet » etait un paragraphe sans lien avec la zone de saisie : cliquer
 * dessus ne placait pas le curseur dans le champ, et le lecteur d'ecran annoncait une
 * zone sans nom alors que ce motif conditionne toute la confirmation.
 *
 * 4. Le compte des caracteres manquants, seule explication du bouton reste inactif, etait
 * peint en `text-red-500` sans variante sombre. Le jeton `danger` dit la meme chose et
 * suit les deux themes.
 */

import { Button, Label, Modal, Spinner, TextArea } from '@heroui-v3/react';
import { AlertCircle } from 'lucide-react';

const MIN_MOTIF = 30;

const ID_MOTIF = 'regularisation-motif-rejet';
const ID_AIDE_MOTIF = 'regularisation-motif-rejet-aide';

interface Props {
  open: boolean;
  reference: string;
  motif: string;
  onMotifChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function RegularisationRejetModal({
  open,
  reference,
  motif,
  onMotifChange,
  onClose,
  onConfirm,
  isLoading,
}: Props) {
  const canConfirm = motif.trim().length >= MIN_MOTIF;
  const missing = MIN_MOTIF - motif.trim().length;

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
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <AlertCircle className="size-5" />
            </Modal.Icon>
            {/* La reference reste collee au titre : c'est le seul element qui dit QUEL
                ticket est classe en fraude, et la decision ne se reprend pas. */}
            <div className="flex flex-col gap-0.5">
              <Modal.Heading>Rejeter le ticket</Modal.Heading>
              {reference ? <p className="text-sm text-muted">{reference}</p> : null}
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Label htmlFor={ID_MOTIF}>Motif de rejet</Label>
                <span className="text-xs text-muted" id={ID_AIDE_MOTIF}>
                  obligatoire, min {MIN_MOTIF} caractères
                </span>
              </div>
              {/* `resize-none` : la poignee de redimensionnement du navigateur laisse tirer
                  la zone au-dela de la fenetre et decale le pied de page. */}
              <TextArea
                fullWidth
                aria-describedby={ID_AIDE_MOTIF}
                className="resize-none"
                id={ID_MOTIF}
                placeholder="Décrivez la raison du rejet pour fraude..."
                rows={4}
                value={motif}
                onChange={(e) => onMotifChange(e.target.value)}
              />
              {motif.length > 0 && !canConfirm ? (
                <p className="text-xs text-danger-soft-foreground">{missing} caractères manquants</p>
              ) : null}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isLoading} onPress={onClose}>
              Annuler
            </Button>
            {/* `isPending` bloque deja la pression pendant l'envoi : le garde sur la
                longueur du motif reste le seul `isDisabled` a porter. */}
            <Button
              variant="danger"
              isDisabled={!canConfirm}
              isPending={isLoading}
              onPress={onConfirm}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? 'Rejet...' : 'Confirmer le rejet'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
