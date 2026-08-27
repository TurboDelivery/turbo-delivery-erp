'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@/components/heroui';
import { useSession } from 'next-auth/react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

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
  { cle: 'DECLARE', libelle: 'Déclaré' },
  { cle: 'NON_DECLARE', libelle: 'Non déclaré' },
  { cle: 'INCONNU', libelle: 'À confirmer (non renseigné)' },
];

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
  /** `bordered` sur la fiche (action de tête), `light` dans les tableaux. */
  variante?: 'bordered' | 'light';
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
  variante = 'light',
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
      <Button
        size="sm"
        variant={variante}
        color="primary"
        startContent={<ShieldCheck className="h-4 w-4" />}
        onPress={() => setOuvert(true)}
      >
        Déclaration
      </Button>

      <Modal isOpen={ouvert} onClose={() => setOuvert(false)} size="md">
        <ModalContent>
          <ModalHeader className="flex-col items-start gap-1">
            <span>Suivi de déclaration</span>
            <span className="text-xs font-normal text-default-400">
              Chaque modification est journalisée avec son auteur et inscrite au parcours de l&apos;agent.
            </span>
          </ModalHeader>
          <ModalBody className="gap-3">
            <Select
              label="État de la déclaration"
              size="sm"
              selectedKeys={new Set([choix])}
              onSelectionChange={(keys) => setChoix((Array.from(keys)[0] as string) ?? 'INCONNU')}
            >
              {CHOIX.map((c) => (
                <SelectItem key={c.cle} value={c.cle}>
                  {c.libelle}
                </SelectItem>
              ))}
            </Select>

            <Input
              type="date"
              label="Date de déclaration"
              size="sm"
              value={date}
              onValueChange={setDate}
              description={
                choix === 'DECLARE'
                  ? 'Laissée vide, le serveur retient la date du jour.'
                  : 'Facultative hors déclaration effective.'
              }
            />

            <Input
              label="Référence de déclaration"
              size="sm"
              placeholder="N° de dépôt CNPS, référence du dossier…"
              value={reference}
              onValueChange={setReference}
            />

            <Input
              label="Pièce justificative (URL)"
              size="sm"
              placeholder="https://…"
              value={url}
              onValueChange={setUrl}
              description="Lien vers l'attestation ou le récépissé déjà stocké."
            />
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="light" onPress={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button size="sm" color="primary" isLoading={mutation.isPending} onPress={enregistrer}>
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
