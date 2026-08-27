'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import { useSession } from 'next-auth/react';
import { Download, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { useAbility } from '@/hooks/use-ability';
import { normalizeRole } from '@/lib/casl/ability';
import { obtenirMasseSalariale } from '@/features/personnel/apis/personnel-historisation.api';
import {
  useCloturerMasseSalarialeMutation,
  useComparaisonMasseSalarialeQuery,
  useMasseSalarialeQuery,
  useMoisMasseSalarialeQuery,
} from '@/features/personnel/queries/personnel-historisation.query';
import {
  formaterMontant,
  formaterMontantSigne,
  libelleTypeCollaborateur,
  telechargerCsv,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { AgentCell } from './shared/agent-cell';
import { EtatMoisChip, TypeContratChip } from './shared/personnel-chips';

/**
 * Profils autorisés à clôturer, alignés sur `MasseSalarialeService.ROLES_CLOTURE`.
 *
 * Ce n'est qu'un gate d'affichage : l'autorité reste le serveur, qui refuse en 403 (et
 * fail-closed si l'identité n'est pas résolue). On ne s'appuie pas sur CASL ici parce que
 * l'Ops Manager n'a que `read` sur le sujet Personnel alors que le backend l'autorise à
 * clôturer — masquer le bouton pour lui serait faux.
 */
const ROLES_CLOTURE = ['DG', 'DGA', 'OPS_MANAGER'];

/**
 * Onglet « Masse salariale » (F4).
 *
 * Un mois clôturé est un instantané figé : les montants affichés ne sont plus recalculés
 * depuis les fiches. La clôture est irréversible — le bouton n'apparaît que pour les profils
 * habilités et passe par une confirmation qui le dit.
 */
export function MasseSalarialeTab() {
  const { data: session } = useSession();
  const ability = useAbility();
  const userId = session?.user?.id ? String(session.user.id) : null;
  const role = normalizeRole(session?.user?.role as string | undefined);
  const peutCloturer = ability.can('manage', 'all') || (!!role && ROLES_CLOTURE.includes(role));

  const { data: mois, isLoading: chargementMois } = useMoisMasseSalarialeQuery();
  const [moisSelectionne, setMoisSelectionne] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  // Verrou d'export : un double-clic écrirait deux traces d'audit pour un seul geste.
  const [exportEnCours, setExportEnCours] = useState(false);

  useEffect(() => {
    if (!moisSelectionne && mois && mois.length > 0) {
      // Par défaut : le dernier mois clôturé, à défaut le plus récent connu.
      setMoisSelectionne((mois.find((m) => m.statut === 'CLOTURE') ?? mois[0]).mois);
    }
  }, [mois, moisSelectionne]);

  const { data: masse, isLoading, isFetching } = useMasseSalarialeQuery(moisSelectionne);
  const { data: comparaison } = useComparaisonMasseSalarialeQuery(moisSelectionne);
  const cloture = useCloturerMasseSalarialeMutation();

  const moisCourant = useMemo(
    () => mois?.find((m) => m.mois === moisSelectionne) ?? null,
    [mois, moisSelectionne],
  );
  const estCloture = (masse?.statut ?? '').toUpperCase() === 'CLOTURE';

  /**
   * Export CSV. Règle de gestion 5 : l'export est un événement d'audit — l'appel porte
   * `export: true` (déclenche `AuditService.tracerExport`) et l'identité du demandeur.
   * Non bloquant : une trace impossible n'annule pas le fichier, elle est signalée.
   */
  const exporter = async () => {
    if (!masse || exportEnCours) return;
    setExportEnCours(true);
    try {
      await obtenirMasseSalariale(masse.mois, { export: true, userId });
    } catch {
      toast.warning("Export non journalisé : la trace d'audit n'a pas pu être écrite.");
    }
    telechargerCsv(
      `masse_salariale_${masse.mois}`,
      ['agent', 'matricule', 'type', 'base', 'primes', 'retenues', 'motif_retenues', 'net', 'paiement', 'mois', 'etat'],
      masse.lignes.map((l) => [
        l.nom ?? '',
        l.matricule ?? '',
        libelleTypeCollaborateur(l.typeCollaborateur),
        l.base ?? 0,
        l.primes ?? 0,
        l.retenues ?? 0,
        (l.detailRetenues ?? []).map((r) => r.motif).filter(Boolean).join(' | '),
        l.net ?? 0,
        l.statut ?? '',
        masse.moisLibelle,
        estCloture ? 'cloture' : 'brouillon',
      ]),
    );
    setExportEnCours(false);
  };

  const confirmerCloture = () => {
    if (!moisSelectionne || !userId) {
      toast.error('Session incomplète : impossible de signer la clôture.');
      return;
    }
    cloture.mutate(
      { mois: moisSelectionne, userId },
      {
        onSuccess: () => {
          toast.success('Mois clôturé — l’instantané est figé.');
          setConfirmation(false);
        },
        onError: (erreur: unknown) => {
          const statut = (erreur as { response?: { status?: number } })?.response?.status;
          toast.error(
            statut === 403
              ? 'Clôture réservée aux profils habilités.'
              : statut === 409
                ? 'Ce mois est déjà clôturé.'
                : 'La clôture a échoué.',
          );
        },
      },
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-default-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          label="Mois"
          size="sm"
          className="w-72"
          isLoading={chargementMois}
          selectedKeys={moisSelectionne ? new Set([moisSelectionne]) : new Set()}
          onSelectionChange={(keys) => setMoisSelectionne((Array.from(keys)[0] as string) ?? null)}
        >
          {(mois ?? []).map((m) => (
            <SelectItem key={m.mois} value={m.mois}>
              {`${m.moisLibelle} — ${m.statut === 'CLOTURE' ? 'clôturé' : 'brouillon'}`}
            </SelectItem>
          ))}
        </Select>

        <div className="flex items-center gap-2 pb-1">
          <EtatMoisChip statut={masse?.statut} />
          {estCloture && masse?.clotureParNom ? (
            <span className="text-xs text-default-400">par {masse.clotureParNom}</span>
          ) : null}
        </div>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={!exportEnCours && <Download className="h-4 w-4" />}
          isLoading={exportEnCours}
          onPress={exporter}
          isDisabled={!masse || masse.lignes.length === 0}
        >
          Exporter CSV
        </Button>

        {peutCloturer && moisCourant?.cloturable ? (
          <Button
            size="sm"
            color="primary"
            startContent={<Lock className="h-4 w-4" />}
            onPress={() => setConfirmation(true)}
          >
            Clôturer le mois
          </Button>
        ) : null}
      </div>

      <Table aria-label="Masse salariale du mois" removeWrapper isStriped>
        <TableHeader>
          <TableColumn className="text-primary">AGENT</TableColumn>
          <TableColumn className="text-primary">TYPE</TableColumn>
          <TableColumn className="text-right text-primary">BASE</TableColumn>
          <TableColumn className="text-right text-primary">PRIMES</TableColumn>
          <TableColumn className="text-right text-primary">RETENUES / PERTES</TableColumn>
          <TableColumn className="text-right text-primary">NET PAYÉ</TableColumn>
          <TableColumn className="text-primary">PAIEMENT</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucune ligne de paie sur ce mois.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement de la masse salariale…" />}
        >
          {(masse?.lignes ?? []).map((l, index) => (
            <TableRow key={`${l.employeId}-${l.regularisationDe ?? 'principal'}-${index}`}>
              <TableCell>
                <AgentCell
                  nom={l.nom}
                  matricule={l.matricule}
                  employeId={l.employeId}
                  sousTitre={[l.poste, l.agence].filter(Boolean).join(' · ')}
                  mention={l.regularisationDe ? `régularisation ${l.regularisationDe}` : null}
                />
              </TableCell>
              <TableCell>
                <TypeContratChip type={l.typeCollaborateur} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{formaterMontant(l.base)}</TableCell>
              <TableCell className="text-right tabular-nums">{l.primes ? formaterMontant(l.primes) : '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {l.retenues ? (
                  <div>
                    <div className="text-danger">−{formaterMontant(l.retenues)}</div>
                    {(l.detailRetenues ?? []).length > 0 ? (
                      <div className="text-[10.5px] text-default-400">
                        {(l.detailRetenues ?? [])
                          .map((r) => r.motif)
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formaterMontant(l.net)}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={estCloture ? 'success' : 'default'}>
                  {estCloture ? 'Payé' : 'À payer'}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-100 pt-3 text-xs text-default-500">
        <span className="font-semibold text-default-700">
          {masse
            ? `${masse.moisLibelle} : ${masse.effectif} agent(s) · total net ${formaterMontant(masse.totalNet)}`
            : '—'}
        </span>
        <span>
          {comparaison?.moisPrecedentLibelle
            ? `Écart vs ${comparaison.moisPrecedentLibelle} : ${formaterMontantSigne(comparaison.ecartNet)} · effectif ${
                comparaison.ecartEffectif >= 0 ? '+' : '−'
              }${Math.abs(comparaison.ecartEffectif)}`
            : 'Aucun mois de comparaison'}
        </span>
      </div>

      <Modal isOpen={confirmation} onClose={() => setConfirmation(false)} size="md">
        <ModalContent>
          <ModalHeader>Clôturer {masse?.moisLibelle ?? 'le mois'} ?</ModalHeader>
          <ModalBody className="text-sm text-default-600">
            <p>
              La clôture fige l&apos;instantané du mois : liste nominative et montants ne seront plus recalculés,
              même si une fiche change ensuite.
            </p>
            <p className="font-semibold text-danger">
              L&apos;opération est définitive. Toute correction ultérieure passera par une régularisation tracée sur
              un mois ouvert.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" size="sm" onPress={() => setConfirmation(false)}>
              Annuler
            </Button>
            <Button color="primary" size="sm" isLoading={cloture.isPending} onPress={confirmerCloture}>
              Clôturer définitivement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
