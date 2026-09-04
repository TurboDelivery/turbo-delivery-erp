'use client';

/*
 * Point par livreur des regularisations, rendu avec HeroUI V3.
 *
 * <p>Quatre defauts corriges au passage, aucun visible au build, tous payes par le
 * comptable ou par un livreur.</p>
 *
 * <p>1. Le panneau peignait a la main tout ce que le theme fournit : bordure, fond et
 * rayon de la coquille, aplats des pastilles (`bg-blue-50`, `bg-amber-50`,
 * `bg-emerald-50`) et des boutons (`bg-blue-600`, `bg-indigo-600`, `bg-emerald-600`).
 * Aucune de ces teintes n'avait de variante sombre : avec la bascule de l'en-tete,
 * l'etat du lot et le mot « manquant » a cote d'un numero Wave absent devenaient du
 * texte fonce sur aplat clair, au moment precis ou ils disent qu'un virement ne
 * partira pas.</p>
 *
 * <p>2. Une seule pastille bleue servait pour les huit etats du lot : un lot REJETE
 * avait exactement l'allure d'un lot en attente de visa. On relancait la chaine sans
 * voir qu'elle avait ete refusee. L'echelle d'etat de la V3 distingue le refus, le
 * paiement lance et le solde.</p>
 *
 * <p>3. Le seul garde-fou contre un second appui pendant l'appel etait le changement de
 * libelle (« Envoi… », « Visa… ») : `disabled` n'arrivait qu'au rendu suivant. Sur des
 * actions qui soumettent, visent puis DECLENCHENT des virements Wave reels, un
 * double-appui n'est pas une gene d'affichage. `isPending` coupe la pression des
 * l'appui.</p>
 *
 * <p>4. Le filtre par livreur etait un `<input>` nu dans une boite dessinee a la main :
 * ni anneau de focus du theme, ni moyen de l'effacer autrement qu'en selectionnant le
 * texte. Un filtre oublie fait lire « il ne reste que ces trois livreurs a payer ».</p>
 */

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Banknote, CheckCircle2, ListChecks, Send, ShieldCheck } from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
  Skeleton,
  Spinner,
  Table,
} from '@heroui-v3/react';

import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import EtatErreur from '@/components/commons/EtatErreur';
import { normalizeRole } from '@/lib/casl/ability';
import { formatMontant } from '@/utils/format.utils';

import {
  useApprouverLotRegulMutation,
  useGenererLotRegulMutation,
  useRecapRegularisationQuery,
  useSoumettreLotRegulMutation,
  useViserLotRegulMutation,
} from '../queries/regularisation-paiement.query';

const fmt = (n?: number | null) =>
  n === null || n === undefined ? '—' : `${formatMontant(Math.round(n))}`;

const LOT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'Lot créé',
  CALCUL_EN_COURS: 'Prêt à soumettre',
  SOUMIS_DGA: 'Soumis — attente visa DGA',
  VALIDE_DGA: 'Visé — attente approbation DG',
  APPROUVE_DG: 'Approuvé — paiement lancé',
  PAIEMENT_EN_COURS: 'Paiements Wave en cours',
  REJETE: 'Rejeté — re-générer pour corriger',
  SOLDE: 'Payé (soldé)',
};

/**
 * Ce que l'etat du lot veut dire, en couleur : un refus se voit, un paiement lance se
 * voit, le reste attend une signature et ne reclame pas l'oeil.
 */
const LOT_TON: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  EN_ATTENTE: 'default',
  CALCUL_EN_COURS: 'default',
  SOUMIS_DGA: 'warning',
  VALIDE_DGA: 'warning',
  APPROUVE_DG: 'accent',
  PAIEMENT_EN_COURS: 'accent',
  REJETE: 'danger',
  SOLDE: 'success',
};

/**
 * Point PAR LIVREUR des tickets régularisés (saisis après clôture puis approuvés)
 * + paiement par lot REGULARISATION suivant la chaîne CONTRÔLÉE existante :
 * génération (net = brut × 0,6) → soumission Comptable → visa DGA → approbation DG
 * (déclenche les virements Wave). ON NE PAIE QUE LES INDÉPENDANTS (défaut).
 */
export function RegularisationRecapPanel() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const role = normalizeRole(
    (session?.user?.role as unknown as string | { libelle?: string } | null | undefined) ?? null,
  );
  const peutViser = role === 'DGA' || role === 'DG';
  const peutApprouver = role === 'DG';

  const { data: creneauList } = useCreneauxListQuery();
  const creneaux = useMemo(() => creneauList?.content ?? [], [creneauList]);
  const [creneauId, setCreneauId] = useState<string | undefined>(undefined);
  // Défaut : le créneau clôturé le plus récent (la régularisation concerne les créneaux passés).
  useEffect(() => {
    if (creneauId || creneaux.length === 0) return;
    const clos = creneaux.find((c: any) => String(c.statut ?? '').startsWith('VERROUILLE') || c.statut === 'SOLDE');
    setCreneauId((clos ?? creneaux[0])?.id);
  }, [creneaux, creneauId]);

  const { data: recap, isLoading, isFetching, isError, refetch } =
    useRecapRegularisationQuery(creneauId);
  const generer = useGenererLotRegulMutation();
  const soumettre = useSoumettreLotRegulMutation();
  const viser = useViserLotRegulMutation();
  const approuver = useApprouverLotRegulMutation();
  const busy = generer.isPending || soumettre.isPending || viser.isPending || approuver.isPending;

  const [filtre, setFiltre] = useState('');
  const lignes = useMemo(() => {
    const all = recap?.lignes ?? [];
    const q = filtre.trim().toLowerCase();
    return q ? all.filter((l) => l.nom.toLowerCase().includes(q)) : all;
  }, [recap, filtre]);

  const statut = recap?.lotStatut ?? null;
  const lotId = recap?.lotId ?? null;

  return (
    <Card>
      <Card.Header className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Card.Title className="flex items-center gap-2">
            <Banknote aria-hidden="true" className="size-4 text-success-soft-foreground" />
            Point par livreur — paiement des régularisations
          </Card.Title>
          <Card.Description>
            Tickets approuvés en retard · net = brut × 0,6 · seuls les indépendants sont payés ·
            chaîne Comptable → DGA → DG → Wave.
          </Card.Description>
        </div>
        <div className="w-full sm:w-64">
          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={creneauId}
            onSelectCreneau={(id: string | undefined) => setCreneauId(id)}
            disabled={busy}
          />
        </div>
      </Card.Header>

      {!creneauId || isLoading ? (
        <Card.Content className="gap-3">
          <Skeleton className="h-9 w-full sm:w-72" />
          <Skeleton className="h-48 w-full" />
        </Card.Content>
      ) : isError ? (
        /* Un echec de chargement ne doit pas se lire comme « rien a payer » : le
           comptable en concluait qu'aucune regularisation n'attendait de virement. */
        <Card.Content>
          <EtatErreur
            quoi="les régularisations à payer"
            onReessayer={() => refetch()}
            enCours={isFetching}
          />
        </Card.Content>
      ) : (recap?.lignes.length ?? 0) === 0 ? (
        <Card.Content>
          <EmptyState className="py-10 text-center">
            Aucun ticket régularisé en attente de paiement sur ce créneau.
          </EmptyState>
        </Card.Content>
      ) : (
        <>
          <Card.Content className="gap-4">
            {/* Filtre + statut du lot */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SearchField
                aria-label="Filtrer par livreur"
                className="w-full sm:w-72"
                onChange={setFiltre}
                value={filtre}
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Filtrer par livreur…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              <div className="flex items-center gap-2 text-muted">
                {statut && (
                  <Chip color={LOT_TON[statut] ?? 'default'} size="sm" variant="soft">
                    {LOT_LABEL[statut] ?? statut}
                  </Chip>
                )}
                {(recap?.ticketsHorsLot ?? 0) > 0 && lotId && (
                  <Chip color="warning" size="sm" variant="soft">
                    {recap?.ticketsHorsLot} nouveau(x) ticket(s) à intégrer
                  </Chip>
                )}
                {isFetching && <Spinner color="current" size="sm" />}
              </div>
            </div>

            {/* Tableau par livreur */}
            <Table variant="secondary">
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Point par livreur des régularisations à payer"
                  className="min-w-[720px]"
                >
                  <Table.Header>
                    <Table.Column isRowHeader>Livreur</Table.Column>
                    <Table.Column>Type</Table.Column>
                    <Table.Column className="text-right">Tickets</Table.Column>
                    <Table.Column className="text-right">Brut</Table.Column>
                    <Table.Column className="text-right">Net (× 0,6)</Table.Column>
                    <Table.Column>N° Wave</Table.Column>
                    <Table.Column>Payé ?</Table.Column>
                  </Table.Header>
                  <Table.Body
                    /* Un filtre trop etroit rendait un tableau a l'entete seul, sans un
                       mot : on le lisait comme « plus personne a payer ». */
                    renderEmptyState={() => (
                      <EmptyState className="py-10 text-center">
                        Aucun livreur ne correspond à ce filtre.
                      </EmptyState>
                    )}
                  >
                    {lignes.map((l) => (
                      <Table.Row key={l.turboyId} id={l.turboyId}>
                        <Table.Cell className="font-medium">{l.nom}</Table.Cell>
                        <Table.Cell className="text-muted">{l.typeLivreur ?? '—'}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">{l.nbTickets}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">{fmt(l.brut)}</Table.Cell>
                        <Table.Cell className="text-right font-semibold tabular-nums text-success-soft-foreground">
                          {fmt(l.net)}
                        </Table.Cell>
                        <Table.Cell className="text-muted">
                          {l.numeroWave || <span className="text-warning-soft-foreground">manquant</span>}
                        </Table.Cell>
                        <Table.Cell>
                          {l.inclusDansPaie ? (
                            <Chip color="success" size="sm" variant="soft">
                              Inclus
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="soft">
                              Non payé
                            </Chip>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>

          {/* Total + chaîne d'actions */}
          <Card.Footer className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Total à payer (indépendants) :{' '}
              <span className="text-base font-bold tabular-nums text-success-soft-foreground">
                {fmt(recap?.totalAPayer)}
              </span>
              <span className="ml-2 text-xs text-muted">{recap?.nbTickets} ticket(s)</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(!lotId || statut === 'REJETE' || (recap?.ticketsHorsLot ?? 0) > 0) && (
                <Button
                  isDisabled={busy || !userId}
                  isPending={generer.isPending}
                  variant="outline"
                  onPress={() => creneauId && generer.mutate({ creneauId, userId })}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? (
                        <Spinner color="current" size="sm" />
                      ) : (
                        <ListChecks aria-hidden="true" className="size-4" />
                      )}
                      {isPending
                        ? 'Génération…'
                        : statut === 'REJETE'
                          ? 'Re-générer le lot'
                          : lotId
                            ? 'Actualiser le lot'
                            : 'Générer le lot de paiement'}
                    </>
                  )}
                </Button>
              )}
              {lotId && (statut === 'CALCUL_EN_COURS' || statut === 'EN_ATTENTE') && (
                <Button
                  isDisabled={busy || !userId}
                  isPending={soumettre.isPending}
                  variant="primary"
                  onPress={() => creneauId && soumettre.mutate({ lotId, userId, creneauId })}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? (
                        <Spinner color="current" size="sm" />
                      ) : (
                        <Send aria-hidden="true" className="size-4" />
                      )}
                      {isPending ? 'Envoi…' : 'Soumettre au DGA'}
                    </>
                  )}
                </Button>
              )}
              {lotId && statut === 'SOUMIS_DGA' && peutViser && (
                <Button
                  isDisabled={busy || !userId}
                  isPending={viser.isPending}
                  variant="primary"
                  onPress={() => creneauId && viser.mutate({ lotId, userId, creneauId })}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? (
                        <Spinner color="current" size="sm" />
                      ) : (
                        <ShieldCheck aria-hidden="true" className="size-4" />
                      )}
                      {isPending ? 'Visa…' : 'Viser (DGA)'}
                    </>
                  )}
                </Button>
              )}
              {lotId && statut === 'VALIDE_DGA' && peutApprouver && (
                <Button
                  isDisabled={busy || !userId}
                  isPending={approuver.isPending}
                  variant="primary"
                  onPress={() => creneauId && approuver.mutate({ lotId, userId, creneauId })}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? (
                        <Spinner color="current" size="sm" />
                      ) : (
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                      )}
                      {isPending ? 'Approbation…' : 'Approuver → paiement Wave'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card.Footer>
        </>
      )}
    </Card>
  );
}
