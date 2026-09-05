'use client';

import { Button, Card, Checkbox, ComboBox, Input, Label, ListBox, Table } from '@heroui-v3/react';
import { flexRender, type RowSelectionState } from '@tanstack/react-table';
import { Banknote, SlidersHorizontal } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import { FiltreStatut } from '@/components/finance/common/filtre-statut';
import DateFilterInput from '@/components/finance/date-filter-input';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import {
  cycleOptions,
  useAgentRecouvreurFilters,
  useAgentRecouvreurStats,
  useAgentRecouvreurTable,
  useDepotPartenaireMutation,
  useEncaissementMutation,
  useVersementCaissierMutation,
} from '@/features/agent-recouvreur';
import type { IAgentFacture } from '@/features/agent-recouvreur';
import { useAgentsRecouvrementQuery } from '@/features/responsable-financier';

import { createAgentRecouvreurColumns, formatMontant, renderAgentActions } from './agent-recouvreur-columns';
import DepotPartenaireModal from './depot-partenaire-modal';
import EncaisserLotModal, { resteAEncaisser } from './encaisser-lot-modal';
import EncaissementModal from './encaissement-drawer';
import VerserComptableModal from './verser-comptable-modal';

// Dans l'ordre de la chaîne : l'agent voit son dossier descendre la liste.
const statutChips = [
  { label: 'Tous', value: 'Tous' },
  { label: 'Recouvrement', value: 'Recouvrement' },
  { label: 'Déposé partenaire', value: 'Déposé partenaire' },
  { label: 'Soldé', value: 'Soldé' },
  { label: 'Versé au caissier', value: 'Versé au caissier' },
] as const;

export default function AgentRecouvreurView() {
  const { data: session } = useSession();

  const { filters, params, setFilters } = useAgentRecouvreurFilters();

  const [factureDepot, setFactureDepot] = useState<IAgentFacture | null>(null);
  const [factureEncaissement, setFactureEncaissement] = useState<IAgentFacture | null>(null);
  const [factureVersement, setFactureVersement] = useState<IAgentFacture | null>(null);

  // Encaissement en masse (factures « Déposé partenaire » pas encore soldées).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [lotOpen, setLotOpen] = useState(false);
  const [lotRunning, setLotRunning] = useState(false);
  const [lotProgress, setLotProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const columns = useMemo(
    () =>
      createAgentRecouvreurColumns(
        (facture) => setFactureDepot(facture),
        (facture) => setFactureEncaissement(facture),
        (facture) => setFactureVersement(facture),
        true, // colonne de sélection (encaissement en masse)
      ),
    [],
  );

  const { data: agentsData } = useAgentsRecouvrementQuery();
  const agentsList = useMemo(() => agentsData ?? [], [agentsData]);

  /** Nom de l'agent connecté résolu depuis la liste des agents RF */
  const connectedAgentNom = agentsList.find((a) => a.id === session?.user?.id)?.nom ?? session?.user?.nomComplet ?? session?.user?.name ?? '';

  // Seules les factures « Déposé partenaire » pas encore couvertes à 100% sont
  // encaissables en masse (= celles qui affichent le bouton « Encaisser »).
  const isBulkEligible = (f: IAgentFacture) => f.statut === 'Déposé partenaire' && (f.montantRecouvre ?? 0) < f.montant;

  const { error, isError, isFetching, isLoading, refetch, table, totalElements, totalPages } = useAgentRecouvreurTable(columns, params, undefined, {
    enableRowSelection: (row) => isBulkEligible(row.original),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });
  // Le hook exposait `isError` sans que personne ne le lise : « Taux de recouvrement
  // 0 % » s'affichait sur un echec de lecture, ce qui se lit comme un resultat.
  const { isError: isErrorStats, statsCards } = useAgentRecouvreurStats(params);

  const depotPartenaireMutation = useDepotPartenaireMutation();
  const encaissementMutation = useEncaissementMutation();
  const verserComptableMutation = useVersementCaissierMutation();

  const facturesSelection = table
    .getSelectedRowModel()
    .rows.map((r) => r.original)
    .filter(isBulkEligible);
  const totalSelection = facturesSelection.reduce((s, f) => s + resteAEncaisser(f), 0);

  // Réinitialise la sélection dès qu'un filtre / la page change (la liste change).
  useEffect(() => {
    setRowSelection({});
  }, [filters.statut, filters.cycle, filters.restaurantId, filters.dateDebut, filters.dateFin, filters.page]);

  // Encaisse en masse : pour chaque facture sélectionnée, un paiement « Solde »
  // du restant dû (date du jour), justificatif/remarque partagés optionnels. On
  // boucle la mutation unitaire en SÉQUENTIEL (évite les races d'optimistic update
  // sur la même queryKey) et on résume les échecs à la fin.
  async function runBulkEncaisser(shared: { preuve?: string; remarque?: string }) {
    const agentId = session?.user?.id ?? '';
    if (!agentId) {
      toast.error('Session expirée', {
        description: 'Impossible de récupérer votre identifiant. Reconnectez-vous.',
      });
      return;
    }
    const cibles = facturesSelection;
    const today = new Date().toISOString().split('T')[0];
    setLotRunning(true);
    setLotProgress({ done: 0, total: cibles.length });
    let ok = 0;
    const echecs: string[] = [];
    for (const f of cibles) {
      const restant = resteAEncaisser(f);
      if (restant <= 0) {
        setLotProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }
      try {
        await encaissementMutation.mutateAsync({
          agentIdOverride: agentId,
          body: {
            date: today,
            montant: restant,
            preuve: shared.preuve,
            remarque: shared.remarque,
            type: 'Solde',
          },
          factureId: f.id,
        });
        ok += 1;
      } catch {
        echecs.push(f.numero);
      }
      setLotProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setLotRunning(false);
    setLotOpen(false);
    setRowSelection({});
    if (echecs.length === 0) {
      toast.success(`${ok} facture(s) encaissée(s) à 100%`);
    } else {
      toast.warning(`${ok} encaissée(s), ${echecs.length} en échec`, {
        description: echecs.join(', '),
      });
    }
  }

  const handleDateChange = (range: DateRange | undefined) => {
    setFilters({
      dateDebut: range?.from ?? null,
      dateFin: range?.to ?? null,
      page: 0,
    });
  };

  const handleRestaurantChange = (value?: string) => {
    setFilters({ page: 0, restaurantId: value ?? '' });
  };

  const enTetes = table.getFlatHeaders();

  /** La barre du lot : même contenu, deux placements (au-dessus du tableau, ou collante en mobile). */
  const barreLot = (
    <>
      <span className="text-xs text-muted">
        {facturesSelection.length} sélectionnée(s) · <span className="font-semibold tabular-nums text-foreground">{formatMontant(totalSelection)}</span>
      </span>
      <div className="flex items-center gap-2">
        <Button onPress={() => setRowSelection({})} size="sm" variant="ghost">
          Tout désélectionner
        </Button>
        <Button onPress={() => setLotOpen(true)} size="sm" variant="primary">
          <Banknote aria-hidden="true" className="size-3.5" />
          Encaisser à 100%
        </Button>
      </div>
    </>
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-muted">Gestion des Paiements</p>
        <h1 className="text-2xl font-bold text-foreground">Espace Agent Recouvreur</h1>
      </div>

      {/* Bandeau de statistiques. La carte locale supprimee ici etait une copie
          CARACTERE POUR CARACTERE de celle de caissier-view : deux fichiers a
          corriger le jour ou l'un des deux bougeait. */}
      <GrilleStats colonnes={4}>
        {statsCards.map((card) => (
          <CarteStat icone={card.icon} isError={isErrorStats} key={card.key} libelle={card.label} ton={card.ton} valeur={card.value} />
        ))}
      </GrilleStats>

      <Card>
        <Card.Content className="gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filtres
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {/* Plage de dates (mois en cours par défaut) */}
            <DateFilterInput
              filters={{
                debut: filters.dateDebut ?? undefined,
                fin: filters.dateFin ?? undefined,
              }}
              handleDateChange={handleDateChange}
              variant="outline"
            />

            {/* Restaurant / Partenaire */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted">Partenaire</span>
              <RestaurantSelect className="w-full text-xs sm:w-[220px]" onChange={handleRestaurantChange} placeholder="Tous les partenaires" value={filters.restaurantId || undefined} />
            </div>

            {/* Cycle — cherchable, comme tout ce qui se choisit dans une liste. */}
            <ComboBox
              className="w-full sm:w-[220px]"
              onSelectionChange={(key) => {
                if (key != null) setFilters({ cycle: String(key), page: 0 });
              }}
              selectedKey={filters.cycle || 'TOUT'}
            >
              <Label>Cycle</Label>
              <ComboBox.InputGroup>
                <Input placeholder="Tous les cycles" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox items={cycleOptions}>
                  {(opt: { key: string; label: string }) => (
                    <ListBox.Item id={opt.key} textValue={opt.label}>
                      {opt.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>

            <FiltreStatut onChange={(statut) => setFilters({ page: 0, statut })} options={statutChips} valeur={filters.statut} />
          </div>
        </Card.Content>
      </Card>

      {/* L'echec de lecture prend la place du message de vide : afficher les deux
                revient a se contredire. */}
      {isError && <EtatErreur detail={error instanceof Error ? error.message : undefined} enCours={isFetching} onReessayer={() => refetch()} quoi="les factures" />}

      {/* Table — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <div className="flex items-center justify-between gap-4 border-b border-separator px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Suivi des factures</p>
              <p className="text-xs text-muted">{String(totalElements).padStart(2, '0')} factures</p>
            </div>
            {facturesSelection.length > 0 && <div className="flex items-center gap-3">{barreLot}</div>}
          </div>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Factures agent recouvreur" className="min-w-[56rem]">
                <Table.Header>
                  {enTetes.map((header) => (
                    <Table.Column id={header.id} isRowHeader={header.id === 'numero'} key={header.id}>
                      {header.isPlaceholder ? '' : flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body renderEmptyState={() => (isLoading || isError ? null : <p className="py-8 text-center text-sm text-muted">Aucune facture trouvée</p>)}>
                  {/*
                   * Le tableau n'avait AUCUN squelette : au chargement il se vidait
                   * d'un coup et se remplissait, ce qui se lit comme « aucune facture ».
                   * Le compte de cellules se derive des memes en-tetes que les lignes,
                   * sinon « Cell count must match column count » emporte la page.
                   */}
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {enTetes.map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading || isError ? [] : table.getRowModel().rows).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell className={isFetching ? 'opacity-70' : undefined} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau onPage={(p) => setFilters({ page: p - 1 })} page={filters.page + 1} total={totalPages} />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Barre d'action lot — mobile */}
      {facturesSelection.length > 0 && (
        <Card className="sticky top-2 z-20 md:hidden">
          <Card.Content className="flex-row items-center justify-between gap-3 px-4 py-2.5">{barreLot}</Card.Content>
        </Card>
      )}

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <MobileCardList>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div className="h-44 animate-pulse rounded-xl bg-surface-secondary" key={i} />)
        ) : table.getRowModel().rows.length === 0 ? (
          isError ? null : (
            <p className="py-10 text-center text-sm text-muted">Aucune facture trouvée</p>
          )
        ) : (
          table.getRowModel().rows.map((row) => {
            const f = row.original;
            const card = (
              <FactureMobileCard
                actions={renderAgentActions(f, setFactureDepot, setFactureEncaissement, setFactureVersement)}
                montant={formatMontant(f.montant)}
                numero={f.numero}
                partenaire={f.partenaire}
                statut={<ChipStatutFacture statut={f.statut} />}
              />
            );
            return row.getCanSelect() ? (
              <div className="flex items-start gap-2" key={f.id}>
                {/*
                 * C'etait un `<input type="checkbox">` nu peint en `accent-green-600` :
                 * ni etat de focus, ni taille de cible tactile, ni theme sombre.
                 */}
                <Checkbox aria-label="Sélectionner la facture" className="mt-4 shrink-0" isSelected={row.getIsSelected()} onChange={(checked) => row.toggleSelected(checked)}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
                <div className="min-w-0 flex-1">{card}</div>
              </div>
            ) : (
              <div key={f.id}>{card}</div>
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau onPage={(p) => setFilters({ page: p - 1 })} page={filters.page + 1} total={totalPages} />
          </div>
        )}
      </MobileCardList>

      <DepotPartenaireModal
        agentNom={connectedAgentNom}
        facture={factureDepot}
        onClose={() => setFactureDepot(null)}
        onConfirm={(facture, { agent, date, montant }) => {
          depotPartenaireMutation.mutate(
            {
              agentIdOverride: session?.user?.id ?? '',
              body: { agent, date, montant },
              factureId: facture.id,
            },
            {
              onError: (e) => toast.error(`Échec dépôt : ${e instanceof Error ? e.message : 'Erreur'}`),
              onSuccess: () => toast.success('Dépôt enregistré avec succès'),
            },
          );
          setFactureDepot(null);
        }}
        open={factureDepot !== null}
      />

      <EncaissementModal
        agentNom={connectedAgentNom}
        facture={factureEncaissement}
        onClose={() => setFactureEncaissement(null)}
        onPaiementAjoute={(facture, paiements) => {
          const dernierPaiement = paiements[paiements.length - 1];
          if (dernierPaiement) {
            encaissementMutation.mutate(
              {
                agentIdOverride: session?.user?.id ?? '',
                body: {
                  date: dernierPaiement.date,
                  montant: dernierPaiement.montant,
                  // V52 (2026-05) — Propager la preuve data URL base64 au
                  // backend pour persistance. Avant : champ jamais propagé,
                  // upload silencieusement perdu.
                  preuve: dernierPaiement.preuve,
                  remarque: dernierPaiement.remarque,
                  type: dernierPaiement.type,
                },
                factureId: facture.id,
              },
              {
                onError: (e) => toast.error(`Échec encaissement : ${e instanceof Error ? e.message : 'Erreur'}`),
                onSuccess: () => toast.success('Encaissement enregistré'),
              },
            );
          }
        }}
        open={factureEncaissement !== null}
      />

      <VerserComptableModal
        facture={factureVersement}
        onClose={() => setFactureVersement(null)}
        onConfirm={(facture, { date, montant, preuve }) => {
          const agentId = session?.user?.id ?? '';
          if (!agentId) {
            toast.error('Session expirée', {
              description: 'Impossible de récupérer votre identifiant. Reconnectez-vous.',
            });
            return;
          }
          verserComptableMutation.mutate(
            // V52 (2026-05) — Propager la preuve data URL base64 au backend.
            { agentIdOverride: agentId, body: { date, montant, preuve }, factureId: facture.id },
            {
              onError: (e) => toast.error(`Échec versement : ${e instanceof Error ? e.message : 'Erreur'}`),
              onSuccess: (data) => {
                if (data && 'statut' in data && data.statut !== 'Versé au caissier') {
                  toast.error('Versement non enregistré', {
                    description: `Le serveur a retourné le statut "${data.statut}" — le versement n'a pas été appliqué. Contactez le support.`,
                  });
                } else {
                  toast.success('Versement enregistré avec succès');
                }
              },
            },
          );
          setFactureVersement(null);
        }}
        open={factureVersement !== null}
      />

      <EncaisserLotModal
        factures={facturesSelection}
        onClose={() => {
          if (!lotRunning) setLotOpen(false);
        }}
        onConfirm={runBulkEncaisser}
        open={lotOpen}
        progress={lotProgress}
        running={lotRunning}
      />
    </div>
  );
}
