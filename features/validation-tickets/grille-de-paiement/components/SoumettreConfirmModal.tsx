'use client';

/*
 * Derniere relecture de la Comptabilite avant que le creneau parte au visa du DGA.
 *
 * Trois defauts corriges au passage en V3.
 *
 * 1. Le pave de resume portait le montant en `text-emerald-600` et son intitule en
 * `text-blue-600`, sans variante sombre. Avec la bascule de theme de l'en-tete,
 * l'operateur qui travaille en sombre lisait du vert et du bleu fonces au milieu d'une
 * fenetre sombre : le montant a payer, le seul chiffre qu'il doit verifier avant de
 * dessaisir le lot, devenait le moins lisible de l'ecran.
 *
 * 2. Le pave d'avertissement etait en `bg-amber-50 border-amber-100 text-amber-700`, meme
 * probleme de theme. Il passe sur l'echelle `warning`, qui suit les deux themes et porte
 * deja le sens d'alerte.
 *
 * 3. Le bouton de confirmation etait force en `bg-red-500 hover:bg-red-600` alors que la
 * barre d'action de la meme page peint « Soumettre au DGA » en bleu. L'operateur
 * declenchait donc un geste presente comme une transmission et se retrouvait devant un
 * bouton de suppression : la couleur disait le contraire du geste. Le bouton primaire
 * remet les deux d'accord et suit le theme.
 *
 * Les chiffres passent en chasse tabulaire et alignes a droite : ce sont trois valeurs a
 * rapprocher d'un lot de paie, pas du texte courant.
 */

import { Button, Label, Modal, Spinner, TextArea } from '@heroui-v3/react';
import { Info, Send } from 'lucide-react';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  totaux: {
    livreurs: number;
    tickets: number;
    net: number;
  };
  commentaire: string;
  onCommentaireChange: (v: string) => void;
}

export default function SoumettreConfirmModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  totaux,
  commentaire,
  onCommentaireChange,
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
            {/* Meme icone que « Soumettre au DGA » dans la barre d'action : l'operateur
                retrouve le geste qu'il vient de declencher. */}
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Send className="size-5" />
            </Modal.Icon>
            <div className="flex flex-col gap-0.5">
              <Modal.Heading>Soumettre le Créneau au DGA</Modal.Heading>
              <p className="text-sm text-muted">Vérification finale avant transmission</p>
            </div>
          </Modal.Header>

          <Modal.Body>
            <p className="mb-2 text-sm font-semibold text-foreground">Résumé du Créneau</p>

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
              <Label htmlFor="grille-paiement-commentaire-soumission">Commentaire</Label>
              {/* `resize-none` : la poignee de redimensionnement du navigateur laisse tirer
                  la zone au-dela de la fenetre et decale le pied de page. */}
              <TextArea
                fullWidth
                className="resize-none"
                id="grille-paiement-commentaire-soumission"
                placeholder="Ajoutez des notes pour le DGA..."
                rows={3}
                value={commentaire}
                onChange={(e) => onCommentaireChange(e.target.value)}
              />
            </div>

            <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-warning-soft-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                Une fois soumis, le Créneau sera transmis au DGA pour visa. Vous serez notifié de la
                décision.
              </span>
            </p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isLoading} onPress={onClose}>
              Annuler
            </Button>
            {/* `isPending` bloque deja la pression pendant l'envoi : l'ancien `disabled`
                double emploi disparait. */}
            <Button isPending={isLoading} onPress={onConfirm}>
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? 'Envoi...' : 'Confirmer la Soumission'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
