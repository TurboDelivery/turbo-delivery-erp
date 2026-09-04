'use client';

/*
 * Confirmation avant de lever le drapeau d'attente pose sur une ligne livreur.
 *
 * <p>Trois defauts corriges au passage en V3 :</p>
 *
 * <p>1. Le pave « Net a payer » etait peint en `bg-emerald-50 text-emerald-700` et
 * l'avertissement en `bg-amber-50 text-amber-700`, sans variante sombre. Avec la bascule
 * de theme de l'en-tete, le Comptable qui travaille en sombre lisait du vert et de
 * l'ambre fonces sur des fonds clairs au milieu d'une fenetre sombre : le montant qu'il
 * doit verifier avant un geste irreversible devenait le moins lisible de l'ecran. Les
 * echelles `success` et `warning` suivent le theme et portent deja le sens.</p>
 *
 * <p>2. Le bouton de confirmation etait force en `bg-amber-500 hover:bg-amber-600`. Une
 * couleur repeinte a la main sur un composant qui a ses propres etats laissait le focus
 * et le survol desaccordes du reste de l'ERP. Le bouton primaire s'en charge ; l'ambre du
 * drapeau d'attente reste porte par la pastille d'en-tete et par le pave d'alerte.</p>
 *
 * <p>3. Le montant etait du texte courant. Il se rapproche d'une ligne de grille de paie :
 * chasse tabulaire et alignement a droite pour qu'il se compare d'un coup d'oeil.</p>
 */

import { Button, Modal, Spinner } from '@heroui-v3/react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

interface Props {
  open: boolean;
  ligne: IGrillePaiementLigne | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

export default function ValiderLigneConfirmModal({
  open,
  ligne,
  isLoading,
  onClose,
  onConfirm,
}: Props) {
  if (!ligne) return null;

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
            <Modal.Icon className="bg-warning-soft text-warning-soft-foreground">
              <ShieldCheck className="size-5" />
            </Modal.Icon>
            <div className="flex flex-col gap-0.5">
              <Modal.Heading>Valider la ligne livreur</Modal.Heading>
              <p className="text-sm text-muted">
                Lever le drapeau d&apos;attente pour{' '}
                <span className="font-semibold text-foreground">{ligne.turboy.nom}</span>
                {ligne.turboy.code ? ` (${ligne.turboy.code})` : null}
              </p>
            </div>
          </Modal.Header>

          <Modal.Body>
            <dl className="overflow-hidden rounded-xl bg-surface-secondary">
              <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt>Net à payer</dt>
                <dd className="font-semibold tabular-nums text-success-soft-foreground">
                  {formatNumber(ligne.netAPayer)} FCFA
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-warning-soft-foreground">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                Cette action est <span className="font-semibold">irréversible</span>. Le drapeau
                d&apos;attente sera levé définitivement pour ce livreur.
              </span>
            </p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isLoading} onPress={onClose}>
              Annuler
            </Button>
            <Button isPending={isLoading} onPress={onConfirm}>
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : <ShieldCheck aria-hidden="true" />}
                  {isPending ? 'Validation…' : 'Valider'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
