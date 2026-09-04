'use client';

/*
 * Override d'inclusion d'une ligne de paie par la Comptabilite, avec justification
 * obligatoire tracee au journal de securite.
 *
 * Quatre defauts corriges au passage en V3.
 *
 * 1. La fenetre etait un `createPortal` maison vers `#modal-portal`, monte derriere un
 * drapeau `mounted` pour passer le rendu serveur. Elle ne se fermait pas a la touche
 * Echap et ne piegeait pas le focus : l'operateur qui tabulait depuis la zone de
 * justification repartait dans le tableau reste derriere, sans indication visible de
 * l'endroit ou il se trouvait. `Modal` porte le portail, le piege a focus et la fermeture
 * au clavier ; la fermeture au clic exterieur, elle, existait deja et est conservee.
 *
 * 2. Le rond d'icone en tete etait peint `bg-emerald-100` ou `bg-amber-100`, et les deux
 * bandeaux d'avertissement en `bg-amber-50 text-amber-800`, aucun sans variante sombre.
 * Avec la bascule de theme de l'en-tete, l'operateur qui travaille en sombre lisait de
 * l'ambre fonce sur fond ambre clair : l'avertissement « le lot a deja ete soumis au
 * DGA », la seule chose a lire avant de renvoyer un lot en arriere dans le workflow,
 * devenait le moins visible de la fenetre. Les echelles `success`, `warning` et `danger`
 * portent le meme sens et suivent les deux themes.
 *
 * 3. Le bouton de confirmation etait force en `bg-emerald-600` ou `bg-amber-600` selon le
 * sens de la bascule, teinte recopiee a la main qui ne bougeait plus avec le theme. Les
 * deux sens gardent leur signal par le `variant` : inclure est le geste courant, exclure
 * prive un livreur de sa paie du creneau et prend la teinte d'alerte.
 *
 * 4. Le compteur de caracteres passait en `text-emerald-600` en dur une fois le seuil
 * atteint. Meme probleme de theme, et c'est le seul retour qui annonce a l'operateur que
 * sa justification passera le controle du backend au lieu de revenir en 400.
 */

import { useEffect, useState } from 'react';
import { Button, Label, Modal, Spinner, TextArea } from '@heroui-v3/react';
import { AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { IGrillePaiementLigne, TypeLivreur } from '../types/grille-paiement.type';

const JUSTIFICATION_MIN = 30;
const JUSTIFICATION_FIELD_ID = 'grille-paiement-justification-inclusion';

interface Props {
  open: boolean;
  ligne: IGrillePaiementLigne | null;
  /** L'état cible que la checkbox veut atteindre (true = inclure, false = exclure). */
  nextValue: boolean;
  /** Statut courant du lot — sert à prévenir d'une re-soumission au DGA. */
  lotStatut?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

/**
 * V54 (2026-05) — Modale Comptable : force la saisie d'une justification
 * d'au moins {@value JUSTIFICATION_MIN} caractères avant d'envoyer un
 * override d'inclusion. Si le lot est déjà SOUMIS_DGA / VALIDE_DGA /
 * APPROUVE_DG, un bandeau avertit que la modification déclenchera une
 * re-soumission au DGA.
 *
 * <p>Côté backend : le DTO {@code ModifierInclusionLigneDto} valide
 * {@code @NotBlank @Size(min=30)} sur la justification — la modale doit
 * empêcher l'envoi tant que ce seuil n'est pas atteint sinon on prend
 * un 400.</p>
 */
export default function JustificationInclusionModal({
  open,
  ligne,
  nextValue,
  lotStatut,
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (open) setJustification('');
  }, [open]);

  if (!ligne) return null;

  const remaining = Math.max(0, JUSTIFICATION_MIN - justification.trim().length);
  const isValid = justification.trim().length >= JUSTIFICATION_MIN;
  const reSoumissionRequise =
    lotStatut === 'SOUMIS_DGA' || lotStatut === 'VALIDE_DGA' || lotStatut === 'APPROUVE_DG';

  const action = nextValue ? 'inclure' : 'exclure';
  const actionMaj = nextValue ? 'Inclure' : 'Exclure';
  const typeLabel = typeLivreurLabel(ligne.typeLivreur ?? null);
  const typeAssigne = ligne.typeLivreur !== null && ligne.typeLivreur !== undefined;

  function handleConfirm() {
    if (!isValid) return;
    onConfirm(justification.trim());
  }

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(ouvert) => {
        if (!ouvert) onClose();
      }}
    >
      <Modal.Container size="lg">
        <Modal.Dialog>
          {/* `CloseTrigger` s'annonce « Close » par defaut : le lecteur d'ecran d'une
              interface entierement en francais annoncait un mot anglais. */}
          <Modal.CloseTrigger aria-label="Fermer" />

          <Modal.Header>
            {/* Le sens de la bascule se lit ici avant tout le reste : l'operateur ouvre
                cette fenetre depuis une case a cocher et doit voir dans quel sens elle
                part avant de rediger sa justification. */}
            <Modal.Icon
              className={
                nextValue
                  ? 'bg-success-soft text-success-soft-foreground'
                  : 'bg-danger-soft text-danger-soft-foreground'
              }
            >
              <ShieldCheck className="size-5" />
            </Modal.Icon>
            <div className="flex flex-col gap-0.5">
              <Modal.Heading>{actionMaj} cette ligne du paiement</Modal.Heading>
              <p className="text-sm text-muted">
                {ligne.turboy.nom}
                {ligne.turboy.code && <span className="ml-1">({ligne.turboy.code})</span>}
                {' — '}
                <span className="font-medium">{typeLabel}</span>
              </p>
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col gap-4">
              {/* Bandeau re-soumission si lot déjà engagé dans le workflow DGA */}
              {reSoumissionRequise && (
                <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-sm leading-relaxed text-warning-soft-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Le lot a déjà été soumis au DGA.</p>
                    <p>
                      Modifier l&apos;inclusion remettra le lot en{' '}
                      <span className="font-mono">CALCUL_EN_COURS</span> et nécessitera une nouvelle
                      soumission.
                    </p>
                  </div>
                </div>
              )}

              {/* Bandeau type implicite */}
              {typeAssigne ? (
                <p className="rounded-xl bg-surface-secondary px-4 py-3 text-sm text-muted">
                  Type par défaut : <span className="font-semibold">{typeLabel}</span> —{' '}
                  {ligne.typeLivreur === 'INDEPENDANT'
                    ? 'normalement inclus dans la paie hebdomadaire.'
                    : 'normalement exclu de la paie hebdomadaire.'}
                </p>
              ) : (
                <p className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Ce livreur est <span className="font-semibold">à catégoriser</span>. Demandez à
                    la RH d&apos;assigner un type avant d&apos;inclure manuellement.
                  </span>
                </p>
              )}

              {/* Justification */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={JUSTIFICATION_FIELD_ID}>
                  Justification <span className="text-danger-soft-foreground">*</span>
                  <span className="font-normal text-muted">
                    {' '}
                    (min {JUSTIFICATION_MIN} caractères)
                  </span>
                </Label>
                {/* `resize-none` : la poignee de redimensionnement du navigateur laisse
                    tirer la zone au-dela de la fenetre et decale le pied de page. */}
                <TextArea
                  fullWidth
                  className="resize-none"
                  id={JUSTIFICATION_FIELD_ID}
                  placeholder={`Pourquoi ${action} cette ligne ? Tracé dans le journal de sécurité.`}
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
                <div className="flex items-center justify-between text-xs">
                  {remaining === 0 ? (
                    <span className="flex items-center gap-1 text-success-soft-foreground">
                      <Check className="size-3.5" />
                      Justification valide
                    </span>
                  ) : (
                    <span className="text-muted">{`${remaining} caractère${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}</span>
                  )}
                  <span className="tabular-nums text-muted">
                    {justification.trim().length}/{JUSTIFICATION_MIN}
                  </span>
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline" isDisabled={isLoading} onPress={onClose}>
              Annuler
            </Button>
            {/* `isPending` bloque deja la pression pendant l'envoi : le seuil de 30
                caracteres reste le seul `isDisabled` a porter. */}
            <Button
              variant={nextValue ? 'primary' : 'danger'}
              isDisabled={!isValid}
              isPending={isLoading}
              onPress={handleConfirm}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? 'Envoi…' : `Confirmer — ${actionMaj}`}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function typeLivreurLabel(type: TypeLivreur | null): string {
  switch (type) {
    case 'INDEPENDANT':
      return 'Indépendant';
    case 'JOURNALIER':
      return 'Journalier';
    case 'SUPERVISEUR_LIVREUR':
      return 'Superviseur-livreur';
    default:
      return 'À catégoriser';
  }
}
