'use client';

/*
 * Rejet de l'approbation finale : le dossier repart au niveau precedent avec un motif.
 *
 * Trois corrections portees par le passage en V3.
 *
 * 1. Le pave de consequence etait peint en `bg-red-50` / `text-red-700` sans variante
 * sombre. Avec la bascule de theme de l'en-tete, l'operateur qui travaille en sombre
 * lisait du texte fonce sur un fond clair au milieu d'une fenetre sombre : la seule
 * phrase qui dit ou part le dossier devenait la moins lisible de l'ecran. Les jetons
 * `danger-soft` disent la meme chose et suivent les deux themes.
 *
 * 2. Le bouton de confirmation etait force en rouge a la main
 * (`bg-red-500 text-white hover:bg-red-600`) alors que `variant="danger"` existe : la
 * teinte du geste irreversible etait recopiee ici et ne bougeait plus avec le theme.
 *
 * 3. Le libelle etait un `<label>` sans `htmlFor` : cliquer sur « Motif du rejet » ne
 * placait pas le curseur dans la zone de saisie, et le lecteur d'ecran annoncait un
 * champ sans nom alors que le motif est obligatoire pour confirmer.
 */

import { Button, Label, Modal, Spinner, TextArea } from '@heroui-v3/react';
import { XCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  motif: string;
  onMotifChange: (v: string) => void;
}

export default function ApprobationFinaleRejetModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  motif,
  onMotifChange,
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
            {/* Meme icone que « Rejeter » dans la barre d'action : l'operateur retrouve le
                geste qu'il vient de declencher. */}
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <XCircle className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Rejeter l&apos;approbation finale</Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground">
              Le dossier sera renvoyé au niveau précédent pour correction.
            </p>

            <div className="mt-5 flex flex-col gap-1.5">
              <Label htmlFor="approbation-finale-motif-rejet">Motif du rejet</Label>
              {/* `resize-none` : la poignee de redimensionnement du navigateur laisse tirer
                  la zone au-dela de la fenetre et decale le pied de page. */}
              <TextArea
                fullWidth
                className="resize-none"
                id="approbation-finale-motif-rejet"
                placeholder="Expliquez la raison du rejet..."
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
                  {isPending ? 'Envoi...' : 'Confirmer le rejet'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
