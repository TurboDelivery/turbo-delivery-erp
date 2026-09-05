'use client';

import { Button, Card, Chip, Modal, Table } from '@heroui-v3/react';
import { Download, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe } from '@/components/personnel/common/champs-personnel';
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

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { alignDroite: false, id: 'agent', libelle: 'Agent' },
  { alignDroite: false, id: 'type', libelle: 'Type' },
  { alignDroite: true, id: 'base', libelle: 'Base' },
  { alignDroite: true, id: 'primes', libelle: 'Primes' },
  { alignDroite: true, id: 'retenues', libelle: 'Retenues / pertes' },
  { alignDroite: true, id: 'net', libelle: 'Net payé' },
  { alignDroite: false, id: 'paiement', libelle: 'Paiement' },
] as const;

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

  const {
    data: mois,
    isLoading: chargementMois,
    isFetching: rechargeMois,
    isError: echecMois,
    refetch: relancerMois,
  } = useMoisMasseSalarialeQuery();
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

  const { data: masse, isLoading, isFetching, isError: echecMasse, refetch: relancerMasse } = useMasseSalarialeQuery(moisSelectionne);
  const { data: comparaison } = useComparaisonMasseSalarialeQuery(moisSelectionne);
  const cloture = useCloturerMasseSalarialeMutation();

  // La liste des mois compte autant que la masse elle-meme : si elle tombe, aucun mois n'est
  // selectionne, la requete de masse reste desactivee et le tableau affiche « aucune ligne de
  // paie » pour un mois qu'il n'a jamais demande.
  const enEchec = (echecMois || echecMasse) && (masse?.lignes ?? []).length === 0;
  const relancer = () => {
    relancerMois();
    if (moisSelectionne) relancerMasse();
  };

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

  const optionsMois = (mois ?? []).map((m) => ({
    label: `${m.moisLibelle} — ${m.statut === 'CLOTURE' ? 'clôturé' : 'brouillon'}`,
    value: m.mois,
  }));

  return (
    <Card>
      <Card.Content className="gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-72">
            <ChampListe
              label="Mois"
              onChange={(v) => setMoisSelectionne(v || null)}
              options={optionsMois}
              placeholder={chargementMois ? 'Chargement…' : 'Choisir un mois'}
              valeur={moisSelectionne ?? ''}
            />
          </div>

          <div className="flex items-center gap-2 pb-1">
            <EtatMoisChip statut={masse?.statut} />
            {estCloture && masse?.clotureParNom ? (
              <span className="text-xs text-muted">par {masse.clotureParNom}</span>
            ) : null}
          </div>

          <div className="flex-1" />

          <Button
            isDisabled={!masse || masse.lignes.length === 0}
            isPending={exportEnCours}
            onPress={exporter}
            size="sm"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            Exporter CSV
          </Button>

          {peutCloturer && moisCourant?.cloturable ? (
            <Button onPress={() => setConfirmation(true)} size="sm" variant="primary">
              <Lock aria-hidden="true" className="size-4" />
              Clôturer le mois
            </Button>
          ) : null}
        </div>

        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Masse salariale du mois" className="min-w-[68rem]">
              <Table.Header>
                {COLONNES.map((c) => (
                  <Table.Column
                    className={c.alignDroite ? 'text-right' : undefined}
                    id={c.id}
                    isRowHeader={c.id === 'agent'}
                    key={c.id}
                  >
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  isLoading ? null : enEchec ? (
                    <div className="py-6">
                      <EtatErreur
                        enCours={isFetching || rechargeMois}
                        onReessayer={relancer}
                        quoi="la masse salariale"
                      />
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucune ligne de paie sur ce mois.
                    </p>
                  )
                }
              >
                {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {COLONNES.map((c) => (
                          <Table.Cell key={`sq-${i}-${c.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {(isLoading || enEchec ? [] : (masse?.lignes ?? [])).map((l, index) => (
                  <Table.Row
                    id={`${l.employeId}-${l.regularisationDe ?? 'principal'}-${index}`}
                    key={`${l.employeId}-${l.regularisationDe ?? 'principal'}-${index}`}
                  >
                    <Table.Cell>
                      <AgentCell
                        employeId={l.employeId}
                        matricule={l.matricule}
                        mention={l.regularisationDe ? `régularisation ${l.regularisationDe}` : null}
                        nom={l.nom}
                        sousTitre={[l.poste, l.agence].filter(Boolean).join(' · ')}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <TypeContratChip type={l.typeCollaborateur} />
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {formaterMontant(l.base)}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {l.primes ? formaterMontant(l.primes) : '—'}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {l.retenues ? (
                        <div>
                          <div className="text-danger-soft-foreground">
                            −{formaterMontant(l.retenues)}
                          </div>
                          {(l.detailRetenues ?? []).length > 0 ? (
                            <div className="text-xs text-muted">
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
                    </Table.Cell>
                    <Table.Cell className="text-right font-semibold tabular-nums">
                      {formaterMontant(l.net)}
                    </Table.Cell>
                    <Table.Cell>
                      <Chip color={estCloture ? 'success' : 'default'} size="sm" variant="soft">
                        <Chip.Label>{estCloture ? 'Payé' : 'À payer'}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-3 text-xs text-muted">
          <span className="font-semibold text-foreground">
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
      </Card.Content>

      <Modal isOpen={confirmation} onOpenChange={(o) => !o && setConfirmation(false)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Clôturer {masse?.moisLibelle ?? 'le mois'} ?</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-2 text-sm text-muted">
                <p>
                  La clôture fige l&apos;instantané du mois : liste nominative et montants ne seront
                  plus recalculés, même si une fiche change ensuite.
                </p>
                <p className="font-semibold text-danger-soft-foreground">
                  L&apos;opération est définitive. Toute correction ultérieure passera par une
                  régularisation tracée sur un mois ouvert.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setConfirmation(false)} size="sm" variant="ghost">
                  Annuler
                </Button>
                <Button
                  isPending={cloture.isPending}
                  onPress={confirmerCloture}
                  size="sm"
                  variant="primary"
                >
                  Clôturer définitivement
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
