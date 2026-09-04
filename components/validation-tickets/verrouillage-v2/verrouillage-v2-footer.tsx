'use client';

/*
 * Barre de verrouillage V2 : la seule action irreversible de l'ecran.
 *
 * Quatre defauts corriges au passage en V3.
 *
 * 1. La barre etait peinte en `border-orange-200 bg-orange-50`, son titre en
 * `text-orange-700` et sa legende en `text-orange-500`, sans aucune variante sombre.
 * La bascule clair/sombre est dans l'en-tete : en sombre, l'operateur lisait un pave
 * clair a texte orange au milieu d'une page sombre, juste au-dessus du bouton qui
 * verrouille le creneau. L'echelle `warning` porte le meme sens et suit les deux themes.
 *
 * 2. Le bouton de validation etait force en `bg-green-600 hover:bg-green-700 text-white`.
 * Repeindre a la main un composant qui a ses propres etats laissait son survol, son
 * focus et son etat desactive desaccordes du reste de l'ERP.
 *
 * 3. Le nombre de tickets n'apparaissait qu'APRES ouverture de la fenetre de
 * confirmation. L'operateur ouvrait donc la confirmation sans savoir combien de tickets
 * l'action emporte ; le compte est desormais ecrit dans la barre, en chasse tabulaire.
 *
 * 4. Quand il n'y avait aucun ticket, le bouton etait simplement grise, sans un mot sur
 * la raison. Le motif de blocage est maintenant porte par une info-bulle et repris dans
 * la legende de la barre.
 *
 * Sur la traduction des props : la v3 ignore EN SILENCE `onClick` et `disabled`, qui
 * deviennent `onPress` et `isDisabled`. Le libelle « Validation en cours... » passe par
 * `isPending`, qui bloque aussi la pression pendant l'envoi, comme le faisait le
 * `disabled={... || isValidating}` d'origine.
 */

import { useState } from 'react';
import { Button, Modal, Spinner, Tooltip } from '@heroui-v3/react';
import { AlertTriangle, Lock } from 'lucide-react';
import { VerrouillageV2ExportButton } from './verrouillage-v2-export-button';

interface VerrouillageV2FooterProps {
  ticketCount: number;
  isValidating: boolean;
  onValidateAll: () => void;
}

export function VerrouillageV2Footer({ ticketCount, isValidating, onValidateAll }: VerrouillageV2FooterProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onValidateAll();
  };

  const pluriel = ticketCount > 1 ? 's' : '';
  const aucunTicket = ticketCount === 0;

  // Le motif du blocage doit se lire au moment ou le bouton est grise : c'est la que
  // l'operateur cherche pourquoi sa pression ne fait rien.
  const infobulle = aucunTicket
    ? 'Aucun ticket en attente : rien à verrouiller sur ce créneau.'
    : isValidating
      ? 'Validation en cours, patientez.'
      : `Verrouille définitivement ${ticketCount} ticket${pluriel} et les envoie à la comptabilité.`;

  return (
    <>
      <section className="flex flex-col gap-4 rounded-xl border border-warning/30 bg-warning-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning-soft-foreground" />
          <div>
            <p className="font-semibold text-foreground">Action critique</p>
            {/* Le compte est la portee reelle du geste : il se lit avant la pression, pas
                seulement dans la fenetre de confirmation. */}
            <p className="text-sm text-warning-soft-foreground">
              {aucunTicket ? (
                'Aucun ticket en attente de verrouillage.'
              ) : (
                <>
                  <span className="font-semibold tabular-nums text-foreground">{ticketCount}</span> ticket{pluriel} en
                  attente. Une fois validés, ils passent à la comptabilité et le créneau est verrouillé.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          <VerrouillageV2ExportButton totalItems={ticketCount} />

          {/* Un bouton desactive n'emet ni survol ni focus : l'info-bulle doit etre
              accrochee au `Tooltip.Trigger` qui l'enveloppe, sinon elle ne s'ouvre
              jamais, et c'est precisement grise que le bouton doit s'expliquer. */}
          <Tooltip>
            <Tooltip.Trigger className="inline-flex">
              <Button isDisabled={aucunTicket} isPending={isValidating} onPress={() => setOpen(true)}>
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : <Lock className="size-4" />}
                    {isPending ? 'Validation en cours...' : 'Valider V2'}
                  </>
                )}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>{infobulle}</Tooltip.Content>
          </Tooltip>
        </div>
      </section>

      <Modal.Backdrop
        isOpen={open}
        onOpenChange={(ouvert) => {
          if (!ouvert) setOpen(false);
        }}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Icon className="bg-warning-soft text-warning-soft-foreground">
                <AlertTriangle className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Confirmer le verrouillage</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <p className="text-foreground">
                Vous êtes sur le point de valider ces tickets en V2 et de verrouiller définitivement le créneau.
              </p>

              {/* Les deux valeurs que l'operateur doit relire avant un geste sans retour :
                  combien de tickets partent, et dans quel statut ils atterrissent. */}
              <dl className="mt-4 divide-y divide-separator overflow-hidden rounded-xl bg-surface-secondary">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt>
                    Ticket{pluriel} à valider en V2
                  </dt>
                  <dd className="font-semibold tabular-nums text-foreground">{ticketCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt>Nouveau statut</dt>
                  <dd className="font-medium text-foreground">PENDING_APPROBATION</dd>
                </div>
              </dl>

              <p className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-warning-soft-foreground">
                <span className="font-bold">Attention :</span> cette action est irréversible. Les tickets passent à la
                comptabilité.
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline" onPress={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onPress={handleConfirm}>
                <Lock className="size-4" />
                Confirmer la validation
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
