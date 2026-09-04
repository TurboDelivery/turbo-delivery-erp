'use client';

/*
 * Derniere confirmation avant le declenchement reel des virements Wave.
 *
 * <p>Trois defauts corriges au passage en V3 :</p>
 *
 * <p>1. Le recapitulatif etait peint en `bg-green-50` / `divide-green-100` et le montant
 * en `text-emerald-600`, sans variante sombre. Avec la bascule de theme de l'en-tete,
 * l'operateur en sombre lisait du vert fonce sur un fond clair au milieu d'une fenetre
 * sombre : le nombre de Turboys et le montant a virer, les deux seuls chiffres qu'il doit
 * verifier avant un virement irreversible, devenaient les moins lisibles de l'ecran.</p>
 *
 * <p>2. Le pave d'avertissement etait en `bg-amber-50 text-amber-700`, meme probleme. Il
 * passe sur l'echelle `warning`, qui suit le theme et porte deja le sens d'alerte.</p>
 *
 * <p>3. Le bouton de confirmation etait force en `bg-green-600 hover:bg-green-700`. Une
 * couleur repeinte a la main sur un composant qui a ses propres etats laissait le focus
 * et le survol desaccordes du reste de l'ERP. Le bouton primaire s'en charge ; le vert de
 * l'approbation reste porte par la pastille d'en-tete et par le montant.</p>
 *
 * <p>Les chiffres passent en chasse tabulaire et alignes a droite : ce sont deux valeurs
 * a rapprocher d'un lot de paie, pas du texte courant.</p>
 */

import { Button, Modal, Spinner } from '@heroui-v3/react';
import { CheckCircle2 } from 'lucide-react';

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
    net: number;
  };
}

export default function ApprobationFinaleApprouverModal({
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
            <Modal.Icon className="bg-success-soft text-success-soft-foreground">
              <CheckCircle2 className="size-5" />
            </Modal.Icon>
            <div className="flex flex-col gap-0.5">
              <Modal.Heading>Approuver et déclencher Wave</Modal.Heading>
              <p className="text-sm text-muted">Créneau : {codeCreneau}</p>
            </div>
          </Modal.Header>

          <Modal.Body>
            <dl className="divide-y divide-separator overflow-hidden rounded-xl bg-surface-secondary">
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt>Nombre de Turboys</dt>
                <dd className="font-medium tabular-nums text-foreground">{totaux.livreurs}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt>Montant total à virer (Indépendants)</dt>
                <dd className="font-semibold tabular-nums text-success-soft-foreground">
                  {formatNumber(totaux.net)} FCFA
                </dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-warning-soft-foreground">
              <span className="font-bold">Attention :</span> Cette action déclenche immédiatement
              les virements Wave. Elle est irréversible.
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
                  {isPending ? 'Envoi...' : 'Confirmer et déclencher'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
