'use client';

import { useState } from 'react';
import { AlertCircle, Clock, ShieldCheck, X } from 'lucide-react';
import { Button, Chip, Label, Spinner, TextArea } from '@heroui-v3/react';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  ticket: BonLivraisonTerminee;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, motif: string) => void;
}

/** Longueur opposable du motif : on n'accuse pas un livreur de fraude en trois mots. */
const MOTIF_MIN = 30;

export default function RegularisationDetail({ ticket, isApproving, isRejecting, onApprove, onReject }: Props) {
  const [motif, setMotif] = useState('');
  const caracteresManquants = MOTIF_MIN - motif.trim().length;
  const peutRejeter = caracteresManquants <= 0;
  const motifIncomplet = motif.length > 0 && !peutRejeter;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-separator bg-surface">
      {/* L'aplat ambre pleine largeur etait ecrit en dur, sans variante sombre : il
          restait eclatant des que l'operateur basculait le theme, et il criait aussi
          fort que le bandeau rouge de la page. L'alerte tient dans la puce qui la dit. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator bg-surface-secondary px-4 py-4 sm:px-6">
        <span className="text-lg font-extrabold text-foreground sm:text-xl">{ticket.reference}</span>
        <Chip color="warning" size="sm" variant="soft">
          <Clock aria-hidden="true" className="size-3" />
          <Chip.Label>Saisi à {ticket.heure} (hors créneau)</Chip.Label>
        </Chip>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
        <dl className="grid grid-cols-1 gap-4 border-b border-separator pb-5 sm:grid-cols-3">
          <div>
            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Livreur</dt>
            <dd className="text-sm font-bold text-foreground">{ticket.livreur}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Restaurant</dt>
            <dd className="text-sm font-bold text-foreground">{ticket.restaurant}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Date</dt>
            <dd className="text-sm font-bold text-foreground">{ticket.date}</dd>
          </div>
          {ticket.createdByUser && (
            <div>
              <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Créé par</dt>
              <dd className="text-sm font-bold text-foreground">
                {ticket.createdByUser.prenoms} {ticket.createdByUser.nom}
              </dd>
            </div>
          )}
        </dl>

        {/* Les deux montants se lisent l'un contre l'autre : chasse tabulaire pour que
            les ordres de grandeur s'alignent au lieu de danser. */}
        <dl className="grid grid-cols-2 gap-4 border-b border-separator pb-5">
          <div>
            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Montant CMD</dt>
            <dd className="text-sm font-bold tabular-nums text-foreground">{formatMontant(ticket.coutCommande)}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Coût Livraison</dt>
            {/* Somme reellement versee si le ticket passe : c'est elle qui est en jeu
                dans la decision, elle garde sa teinte d'alerte. L'orange en dur devenait
                illisible sur fond sombre. */}
            <dd className="text-sm font-bold tabular-nums text-warning-soft-foreground">
              {formatMontant(ticket.coutLivraison)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="size-4 text-danger-soft-foreground" />
            <Label htmlFor="regularisation-motif-rejet" isInvalid={motifIncomplet}>
              Motif de rejet{' '}
              <span className="text-xs font-normal text-muted">
                (obligatoire, min {MOTIF_MIN} caractères)
              </span>
            </Label>
          </div>
          {/* resize-none : la poignee du navigateur laisse tirer la zone sous le pied de
              page et pousse les deux boutons de decision hors de l'ecran. */}
          <TextArea
            fullWidth
            className="resize-none"
            id="regularisation-motif-rejet"
            placeholder="Décrivez la raison du rejet pour fraude..."
            rows={3}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          {motifIncomplet && (
            <p className="text-xs text-danger-soft-foreground">{caracteresManquants} caractères manquants</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-separator px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {/* `isPending` bloque deja la pression pendant l'envoi : le motif trop court
            reste le seul `isDisabled` a porter. */}
        <Button
          isDisabled={!peutRejeter}
          isPending={isRejecting}
          variant="danger-soft"
          onPress={() => onReject(ticket.commandeId, motif.trim())}
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <X aria-hidden="true" className="size-4" />}
              {isPending ? 'Rejet...' : 'Rejeter (Fraude)'}
            </>
          )}
        </Button>

        <Button isPending={isApproving} variant="primary" onPress={() => onApprove(ticket.commandeId)}>
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <ShieldCheck aria-hidden="true" className="size-4" />
              )}
              {isPending ? 'Approbation...' : 'Approuver (Retard)'}
              {!isPending && <span aria-hidden="true">→</span>}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
