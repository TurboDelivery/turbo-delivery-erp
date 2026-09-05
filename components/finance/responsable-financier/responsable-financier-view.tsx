'use client';

import { Button, Card, Checkbox, ComboBox, Input, Label, ListBox, Table } from '@heroui-v3/react';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { CheckCircle2, FileText, Percent, SlidersHorizontal, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import { FiltreStatut } from '@/components/finance/common/filtre-statut';
import DateFilterInput from '@/components/finance/date-filter-input';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import { useConfirmerReceptionComptableMutation, useDepotBanqueMutation, useLancerRecouvrementMutation, useValiderFactureRFMutation } from '@/features/responsable-financier';
import { cycleOptions } from '@/features/responsable-financier/filters/responsable-financier.filter';
import { useResponsableFinancierStats } from '@/features/responsable-financier/hooks/use-responsable-financier-stats';
import { useResponsableFinancierTable } from '@/features/responsable-financier/hooks/use-responsable-financier-table';
import type { IActionsGroupeesFiltres, IFactureRFParams } from '@/features/responsable-financier/types/responsable-financier.types';
import { formatPeriodeFacturee } from '@/lib/finance/periode-facturee';

import BulkActionsBar from './bulk-actions-bar';
import DepotBanqueModal from './depot-banque-modal';
import DemarrerRecouvrementDrawer from './demarrer-recouvrement-modal';
import { createResponsableFinancierColumns, formatMontant, type IFactureRF } from './responsable-financier-columns';
import ValiderFactureModal from './valider-facture-modal';

// Onglets de statut. 2026-07-27 : l'onglet « Visé DGA » devient « Orientation des fonds »
// (le visa est implicite depuis « En attente visa DGA » — plus d'étape manuelle de visa).
// La valeur backend reste « Visé DGA » : l'onglet liste le stock visé non encore orienté,
// sur lequel l'action groupée « Orientation des fonds » s'applique aussi.
//
// L'ordre est celui de la CHAÎNE, pas l'alphabet : une facture descend cette liste de
// l'émission à la clôture. C'est pour cela que le filtre reste une rangée visible et
// n'est pas rentré dans une liste déroulante — l'ordre est l'information.
const statutFilters = [
  { label: 'Tous', value: 'Tous' },
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'À valider', value: 'À valider' },
  { label: 'Validé', value: 'Validé' },
  { label: 'Recouvrement', value: 'Recouvrement' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Déposé partenaire', value: 'Déposé partenaire' },
  { label: 'Preuve ajoutée', value: 'Preuve ajoutée' },
  { label: 'Soldé', value: 'Soldé' },
  { label: 'Versé au caissier', value: 'Versé au caissier' },
  { label: 'En attente visa DGA', value: 'En attente visa DGA' },
  { label: 'Orientation des fonds', value: 'Visé DGA' },
  { label: 'Rejeté DGA', value: 'Rejeté DGA' },
  { label: 'Clôturé', value: 'Clôturé' },
] as const;

export default function ResponsableFinancierView() {
  const [factureAValider, setFactureAValider] = useState<IFactureRF | null>(null);
  const [factureRecouvrement, setFactureRecouvrement] = useState<IFactureRF | null>(null);
  const [factureDepotBanque, setFactureDepotBanque] = useState<IFactureRF | null>(null);

  // ── Sélection pour les actions groupées ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  const toggleRow = (id: string) => {
    setSelectAllMatching(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllMatching(false);
  };

  const confirmerReceptionMutation = useConfirmerReceptionComptableMutation();

  const selectColumn: ColumnDef<IFactureRF> = useMemo(
    () => ({
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Sélectionner ${row.original.numero}`}
          isDisabled={selectAllMatching}
          isSelected={selectAllMatching || selectedIds.has(row.original.id)}
          onChange={() => toggleRow(row.original.id)}
          /*
           * `slot={null}` : dans un `Table` v3, tout `Checkbox` est branche sur le
           * contexte de selection de la table et exige `slot="selection"`, faute de
           * quoi React Aria leve « A slot prop is required » et la page tombe en 500.
           * Ici la selection est un `Set` local dont dependent les actions groupees
           * ET le « selectionner les N factures de toutes les pages » : on sort du
           * contexte plutot que de changer de modele.
           */
          slot={null}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      ),
      enableSorting: false,
      header: () => <span className="sr-only">Sélection</span>,
      id: '__select',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, selectAllMatching],
  );

  const columns = useMemo(
    () => [
      selectColumn,
      ...createResponsableFinancierColumns(
        (facture) => setFactureAValider(facture),
        (facture) => setFactureRecouvrement(facture),
        (facture) => setFactureDepotBanque(facture),
        // 2026-05 (fix post-test mardi) — D3 : Comptable confirme physiquement
        // la réception des fonds versés par le caissier. Click direct (pas de
        // modal), c'est une simple confirmation idempotente. La sécurité reste
        // côté backend qui vérifie le statut autorisé et renvoie 400 sinon.
        (facture) => confirmerReceptionMutation.mutate(facture.id),
      ),
    ],
    [confirmerReceptionMutation, selectColumn],
  );

  const { filters, isError, isFetching, isLoading, refetch, setFilters, table, totalElements, totalPages } = useResponsableFinancierTable(columns);

  // Ids de la page courante + états de la case « page ».
  const pageIds = table.getRowModel().rows.map((r) => r.original.id);
  const pageSelectedCount = pageIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected = pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  const togglePage = () => {
    setSelectAllMatching(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // La sélection ne doit jamais survivre à un changement de filtre / de page.
  useEffect(() => {
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.statut, filters.cycle, filters.restaurantId, filters.dateDebut, filters.dateFin, filters.page]);

  const bulkFiltres: IActionsGroupeesFiltres = useMemo(
    () => ({
      cycle: filters.cycle && filters.cycle !== 'TOUT' ? filters.cycle : undefined,
      debut: filters.dateDebut ? filters.dateDebut.toISOString().split('T')[0] : undefined,
      fin: filters.dateFin ? filters.dateFin.toISOString().split('T')[0] : undefined,
      periode: 'plage',
      restaurantId: filters.restaurantId || undefined,
      statut: filters.statut || 'Tous',
    }),
    [filters],
  );

  const statsParams = useMemo(
    (): IFactureRFParams => ({
      cycle: filters.cycle && filters.cycle !== 'TOUT' ? filters.cycle : undefined,
      dateDebut: filters.dateDebut ? filters.dateDebut.toISOString().split('T')[0] : undefined,
      dateFin: filters.dateFin ? filters.dateFin.toISOString().split('T')[0] : undefined,
      periode: 'plage',
      restaurantId: filters.restaurantId || undefined,
      statut: filters.statut || undefined,
    }),
    [filters],
  );

  const { statsCards } = useResponsableFinancierStats(statsParams);

  const validerMutation = useValiderFactureRFMutation();
  const lancerRecouvrementMutation = useLancerRecouvrementMutation();
  const depotBanqueMutation = useDepotBanqueMutation();

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

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-muted">Gestion des Paiements</p>
        <h1 className="text-2xl font-bold text-foreground">Espace Responsable Financier</h1>
      </div>

      <GrilleStats colonnes={4}>
        {/*
          NB métier (2026-05) : ce "Total factures émises" est la somme des
          montants des factures émises pour la période/cycle/partenaire
          sélectionnés. Il diffère structurellement du "CA de la Période" du
          tableau de bord financier qui additionne frais de livraison +
          commissions + entrées de caisse côté commandes (notion comptable
          distincte). Voir DashboardFinancierService vs.
          ResponsableFinancierFactureService.buildStats côté backend.
        */}
        <CarteStat icone={TrendingUp} libelle="Total factures émises" note="Somme des montants facturés" ton="succes" valeur={formatMontant(statsCards[1]?.value ?? 0)} />
        <CarteStat icone={FileText} libelle="Nombre de factures" note="Période sélectionnée" ton="primaire" valeur={String(statsCards[0]?.value ?? 0)} />
        <CarteStat icone={Users} libelle="Nombre de partenaires" note="Partenaires uniques" ton="primaire" valeur={String(statsCards[2]?.value ?? 0)} />
        <CarteStat icone={Percent} libelle="Taux de recouvrement" note="Période sélectionnée" ton="attention" valeur={`${statsCards[3]?.value ?? 0} %`} />
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

            <FiltreStatut onChange={(statut) => setFilters({ page: 0, statut })} options={statutFilters} valeur={filters.statut} />
          </div>
        </Card.Content>
      </Card>

      {/* Barre de sélection (desktop) */}
      {!isLoading && pageIds.length > 0 && (
        <div className="-mb-2 hidden items-center gap-4 px-1 text-sm md:flex">
          <Checkbox isIndeterminate={somePageSelected && !selectAllMatching} isSelected={allPageSelected || selectAllMatching} onChange={togglePage}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              {/* `Checkbox` n'expose que Root/Content/Control/Indicator : le libelle
                                est un enfant ordinaire du Content, qui est deja la zone cliquable. */}
              <span className="text-sm text-muted">Sélectionner la page</span>
            </Checkbox.Content>
          </Checkbox>
          {allPageSelected && !selectAllMatching && totalElements > pageIds.length && (
            <Button onPress={() => setSelectAllMatching(true)} size="sm" variant="ghost">
              Sélectionner les {totalElements} factures de toutes les pages
            </Button>
          )}
          {selectAllMatching && (
            <span className="flex items-center gap-1 text-muted">
              Les <b>{totalElements}</b> factures du filtre sont sélectionnées
              <Button onPress={clearSelection} size="sm" variant="ghost">
                Effacer
              </Button>
            </span>
          )}
        </div>
      )}

      {/* L'echec de lecture s'affiche ICI, et les deux messages d'etat vide
          (tableau desktop + cartes mobiles) sont neutralises en dessous : sans
          cela, l'ecran afficherait l'erreur ET « aucune donnee », ce qui revient
          a se contredire. */}
      {isError && <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les factures" />}

      {/* Table — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Factures responsable financier" className="min-w-[80rem]">
                <Table.Header>
                  {enTetes.map((header) => (
                    <Table.Column id={header.id} isRowHeader={header.id === 'numero'} key={header.id}>
                      {header.isPlaceholder ? '' : flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body renderEmptyState={() => (isLoading || isError ? null : <p className="py-8 text-center text-sm text-muted">Aucune facture trouvée</p>)}>
                  {/*
                   * Le squelette compte ses cellules sur les MEMES en-tetes que les
                   * lignes reelles : un compte tenu a la main derive des qu'on
                   * ajoute une colonne, et « Cell count must match column count »
                   * emporte la page entiere en 500.
                   */}
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
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

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <MobileCardList>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" key={i} />)
        ) : table.getRowModel().rows.length === 0 ? (
          isError ? null : (
            <p className="py-10 text-center text-sm text-muted">Aucune facture trouvée</p>
          )
        ) : (
          table.getRowModel().rows.map((row) => {
            const f = row.original;
            return (
              <FactureMobileCard
                actions={
                  <>
                    {(f.statut === 'DRAFT' || f.statut === 'À valider') && (
                      <Button className="w-full" onPress={() => setFactureAValider(f)} variant="primary">
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                        Valider la facture
                      </Button>
                    )}
                    {f.statut === 'Validé' && (
                      <Button className="w-full" onPress={() => setFactureRecouvrement(f)} variant="primary">
                        Lancer le recouvrement
                      </Button>
                    )}
                    {f.statut === 'Versé au caissier' && (
                      <Button className="w-full" onPress={() => confirmerReceptionMutation.mutate(f.id)} variant="primary">
                        Confirmer la réception des fonds
                      </Button>
                    )}
                    {f.statut === 'Orienté banque' && (
                      <Button className="w-full" onPress={() => setFactureDepotBanque(f)} variant="primary">
                        Dépôt en banque
                      </Button>
                    )}
                    <LienBouton href={`/finance/comptabilite/responsable-financier/${f.id}`} pleineLargeur variante="outline">
                      Voir le détail
                    </LienBouton>
                  </>
                }
                fields={[
                  {
                    label: 'Recouvré',
                    value: f.montantRecouvre ? `${formatMontant(f.montantRecouvre)} (${f.pourcentageRecouvre ?? 0}%)` : '—',
                  },
                  { label: 'Cycle', value: f.cycle },
                  { label: 'Agent', value: f.agent },
                  {
                    label: 'Période facturée',
                    value: formatPeriodeFacturee(f.cycle, f.periodeDebut, f.periodeFin),
                  },
                  { label: 'Émission', value: f.emission },
                ]}
                key={f.id}
                montant={formatMontant(f.montant)}
                numero={f.numero}
                partenaire={f.partenaire}
                statut={<ChipStatutFacture statut={f.statut} />}
              />
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau onPage={(p) => setFilters({ page: p - 1 })} page={filters.page + 1} total={totalPages} />
          </div>
        )}
      </MobileCardList>

      <ValiderFactureModal
        facture={factureAValider}
        onClose={() => setFactureAValider(null)}
        onConfirm={(facture, cycle) => {
          validerMutation.mutate({ data: { cycle }, id: facture.id });
          setFactureAValider(null);
        }}
        open={factureAValider !== null}
      />

      <DemarrerRecouvrementDrawer
        facture={factureRecouvrement}
        onClose={() => setFactureRecouvrement(null)}
        onConfirm={(facture, agent) => {
          lancerRecouvrementMutation.mutate({ data: { agentId: agent.id }, id: facture.id });
          setFactureRecouvrement(null);
        }}
        open={factureRecouvrement !== null}
      />

      <DepotBanqueModal
        facture={factureDepotBanque}
        onClose={() => setFactureDepotBanque(null)}
        onConfirm={(facture, data) => {
          depotBanqueMutation.mutate({ data, id: facture.id });
          setFactureDepotBanque(null);
        }}
        open={factureDepotBanque !== null}
      />

      {/* Actions groupées (barre flottante) */}
      <BulkActionsBar filtres={bulkFiltres} onClear={clearSelection} selectAllMatching={selectAllMatching} selectedIds={Array.from(selectedIds)} totalElements={totalElements} />
    </div>
  );
}
