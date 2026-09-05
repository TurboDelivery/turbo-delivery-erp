'use client';

import { Button, Modal } from '@heroui-v3/react';
import { ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';

import { useAbility } from '@/hooks/use-ability';
import { normalizeRole } from '@/lib/casl/ability';
import { useMarquerDeclarationContratMutation } from '@/features/personnel/queries/personnel-historisation.query';
import { EtatDeclaration, IContratDeclaration } from '@/features/personnel/types/personnel-historisation.types';

/**
 * Profils autorisés à toucher au suivi de déclaration, alignés sur
 * `EmployeContratService.ROLES_DECLARATION` (DG, DGA, Ops Manager, Comptable).
 *
 * Gate d'affichage seulement : l'autorité reste le serveur, qui refuse en 403 — y compris
 * quand il ne parvient pas à résoudre le rôle (fail-closed). On n'utilise pas CASL ici parce
 * que l'Ops Manager et le Comptable n'ont pas `update` sur le sujet Personnel alors que le
 * backend les autorise : masquer l'action pour eux serait faux.
 */
export const ROLES_DECLARATION = ['DG', 'DGA', 'OPS_MANAGER', 'COMPTABLE'];

/** Vrai quand l'utilisateur courant peut modifier le suivi de déclaration. */
export function usePeutDeclarer(): boolean {
  const { data: session } = useSession();
  const ability = useAbility();
  const role = normalizeRole(session?.user?.role as string | undefined);
  return ability.can('manage', 'all') || (!!role && ROLES_DECLARATION.includes(role));
}

/** Les trois états possibles, « jamais renseigné » compris — ce n'est pas « non déclaré ». */
const CHOIX = [
  { label: 'Déclaré', value: 'DECLARE' },
  { label: 'Non déclaré', value: 'NON_DECLARE' },
  { label: 'À confirmer (non renseigné)', value: 'INCONNU' },
] as const;

function versChoix(etat: EtatDeclaration | null | undefined): string {
  if (etat === 'DECLARE' || etat === 'NON_DECLARE') return etat;
  return 'INCONNU';
}

function versDeclare(choix: string): boolean | null {
  if (choix === 'DECLARE') return true;
  if (choix === 'NON_DECLARE') return false;
  return null;
}

interface Props {
  /** Identifiant du CONTRAT (pas de l'employé) : sans contrat enregistré, rien à déclarer. */
  contratId: string;
  /** Sert à rafraîchir la fiche de l'agent quand l'action est lancée depuis celle-ci. */
  employeId?: string | null;
  etat: EtatDeclaration;
  dateDeclaration?: string | null;
  referenceDeclaration?: string | null;
  declarationUrl?: string | null;
  /** `outline` sur la fiche (action de tête), `ghost` dans les tableaux. */
  variante?: 'ghost' | 'outline';
}

/**
 * Suivi de déclaration d'un contrat (F5) — `PATCH /api/erp/personnel/contrats/{id}/declaration`.
 *
 * La spec demande de pouvoir dire trois choses, pas deux : déclaré (avec sa date, sa référence
 * et sa pièce justificative), non déclaré, ou jamais renseigné. Le formulaire les expose telles
 * quelles ; le serveur écrit l'événement DECLARATION au parcours de l'agent.
 */
export function DeclarationContratAction({
  contratId,
  employeId,
  etat,
  dateDeclaration,
  referenceDeclaration,
  declarationUrl,
  variante = 'ghost',
}: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? String(session.user.id) : null;
  const peutDeclarer = usePeutDeclarer();
  const mutation = useMarquerDeclarationContratMutation(employeId ?? null);

  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState(versChoix(etat));
  const [date, setDate] = useState(dateDeclaration ?? '');
  const [reference, setReference] = useState(referenceDeclaration ?? '');
  const [url, setUrl] = useState(declarationUrl ?? '');

  // À chaque ouverture, on repart de l'état enregistré : un formulaire qui garde la saisie
  // d'un contrat précédent ferait écrire n'importe quoi sur le suivant.
  useEffect(() => {
    if (!ouvert) return;
    setChoix(versChoix(etat));
    setDate((dateDeclaration ?? '').slice(0, 10));
    setReference(referenceDeclaration ?? '');
    setUrl(declarationUrl ?? '');
  }, [ouvert, etat, dateDeclaration, referenceDeclaration, declarationUrl]);

  if (!peutDeclarer) return null;

  const enregistrer = () => {
    if (!userId) {
      toast.error('Session incomplète : impossible de signer la déclaration.');
      return;
    }
    const donnees: IContratDeclaration = {
      declare: versDeclare(choix),
      dateDeclaration: date ? date : null,
      referenceDeclaration: reference.trim() ? reference.trim() : null,
      declarationUrl: url.trim() ? url.trim() : null,
    };
    mutation.mutate(
      { contratId, donnees, userId },
      {
        onSuccess: () => {
          toast.success('Suivi de déclaration mis à jour.');
          setOuvert(false);
        },
        onError: (erreur: unknown) => {
          const statut = (erreur as { response?: { status?: number } })?.response?.status;
          toast.error(
            statut === 403
              ? 'Suivi de déclaration réservé aux profils habilités.'
              : statut === 404
                ? 'Contrat introuvable.'
                : 'La mise à jour a échoué.',
          );
        },
      },
    );
  };

  return (
    <>
      <Button onPress={() => setOuvert(true)} size="sm" variant={variante}>
        <ShieldCheck aria-hidden="true" className="size-4" />
        Déclaration
      </Button>

      <Modal isOpen={ouvert} onOpenChange={(o) => !o && setOuvert(false)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="flex flex-col items-start gap-1">
                  <span>Suivi de déclaration</span>
                  <span className="text-xs font-normal text-muted">
                    Chaque modification est journalisée avec son auteur et inscrite au parcours de
                    l&apos;agent.
                  </span>
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3">
                <ChampListe
                  label="État de la déclaration"
                  onChange={(v) => setChoix(v || 'INCONNU')}
                  options={CHOIX}
                  placeholder="Choisir un état"
                  valeur={choix}
                />

                <ChampTexte
                  aide={
                    choix === 'DECLARE'
                      ? 'Laissée vide, le serveur retient la date du jour.'
                      : 'Facultative hors déclaration effective.'
                  }
                  label="Date de déclaration"
                  onChange={setDate}
                  type="date"
                  valeur={date}
                />

                <ChampTexte
                  label="Référence de déclaration"
                  onChange={setReference}
                  placeholder="N° de dépôt CNPS, référence du dossier…"
                  valeur={reference}
                />

                <ChampTexte
                  aide="Lien vers l'attestation ou le récépissé déjà stocké."
                  label="Pièce justificative (URL)"
                  onChange={setUrl}
                  placeholder="https://…"
                  valeur={url}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setOuvert(false)} size="sm" variant="ghost">
                  Annuler
                </Button>
                <Button
                  isPending={mutation.isPending}
                  onPress={enregistrer}
                  size="sm"
                  variant="primary"
                >
                  Enregistrer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
