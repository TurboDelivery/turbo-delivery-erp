'use client';

import { useQueryStates } from 'nuqs';
import { Alert, Button, Card, ComboBox, Input, Label, ListBox, Spinner } from '@heroui-v3/react';
import {
  encoursFilters,
  useEncoursQuery,
  useEncoursGroupesQuery,
  MOIS_LONGS,
} from '@/features/encours';
import { EncoursKpiCards } from './encours-kpi-cards';
import { EncoursCharts } from './encours-charts';
import { EncoursTable } from './encours-table';
import { EncoursMobileCards } from './encours-mobile-cards';
import { EncoursDeductionsTable } from './encours-deductions-table';
import { EncoursDeductionsManager } from './encours-deductions-manager';
import { EncoursExportButton } from './encours-export-button';
import { EncoursExportDusButton } from './encours-export-dus-button';
import { EncoursStoreFilter } from './encours-store-filter';

const anneeCourante = new Date().getFullYear();
const ANNEES = [anneeCourante, anneeCourante - 1, anneeCourante - 2, anneeCourante - 3];
const MOIS = Array.from({ length: 12 }, (_, i) => i + 1);
const CYCLES = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'MENSUEL', label: 'Mensuel' },
  { key: 'QUINZAINE', label: 'Quinzaine' },
  { key: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
];

export function EncoursView() {
  const [filters, setFilters] = useQueryStates(encoursFilters.filter, encoursFilters.option);

  const params = {
    annee: filters.annee,
    mois: filters.mois ? Number(filters.mois) : null,
    cycle: filters.cycle || null,
    partenaire: filters.partenaire || null,
    stores: filters.stores ?? [],
  };

  const { data: releve, isError, isFetching, isLoading, refetch } = useEncoursQuery(params);
  const { data: groupes } = useEncoursGroupesQuery();

  return (
    <div className="space-y-4 p-3 sm:p-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Encours — Restes à payer</h1>
          <p className="text-sm text-muted">
            Factures éditées non encore recouvrées — détail par facture (mois / quinzaine / semaine)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EncoursDeductionsManager annee={filters.annee} />
          <EncoursExportDusButton releve={releve} params={params} isDisabled={isLoading} />
          <EncoursExportButton params={params} isDisabled={!releve || isLoading} />
        </div>
      </div>

      {/*
       * Les filtres, dans une carte.
       *
       * <p>Des `ComboBox` et non des `Select` : la liste des partenaires suit le
       * portefeuille et se cherche, comme partout ailleurs dans ce projet.</p>
       */}
      <Card>
        <Card.Content className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <ComboBox
            className="w-full sm:w-28"
            onSelectionChange={(c) => {
              if (c) setFilters({ annee: Number(c) });
            }}
            selectedKey={String(filters.annee)}
          >
            <Label>Année</Label>
            <ComboBox.InputGroup>
              <Input />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={ANNEES.map((y) => ({ cle: String(y) }))}>
                {(o: { cle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.cle}>
                    {o.cle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox
            className="w-full sm:w-44"
            onSelectionChange={(c) => setFilters({ mois: c === 'TOUS' ? '' : String(c ?? '') })}
            selectedKey={filters.mois || 'TOUS'}
          >
            <Label>Mois</Label>
            <ComboBox.InputGroup>
              <Input />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox
                items={[
                  { cle: 'TOUS', libelle: 'Tous (cumul annuel)' },
                  ...MOIS.map((m) => ({ cle: String(m), libelle: MOIS_LONGS[m] })),
                ]}
              >
                {(o: { cle: string; libelle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.libelle}>
                    {o.libelle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox
            className="w-full sm:w-40"
            onSelectionChange={(c) => setFilters({ cycle: c === 'TOUS' ? '' : String(c ?? '') })}
            selectedKey={filters.cycle || 'TOUS'}
          >
            <Label>Cycle</Label>
            <ComboBox.InputGroup>
              <Input />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={CYCLES}>
                {(o: { key: string; label: string }) => (
                  <ListBox.Item id={o.key} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox
            className="w-full sm:w-56"
            // changer de partenaire réinitialise la sélection de points de vente (§4)
            onSelectionChange={(c) =>
              setFilters({ partenaire: c === 'TOUS' ? '' : String(c ?? ''), stores: [] })
            }
            selectedKey={filters.partenaire || 'TOUS'}
          >
            <Label>Partenaire</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Rechercher…" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox
                items={[{ cle: 'TOUS', libelle: 'Tous' }, ...(groupes ?? []).map((g) => ({ cle: g, libelle: g }))]}
              >
                {(o: { cle: string; libelle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.libelle}>
                    {o.libelle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <div className="col-span-2 sm:contents">
            <EncoursStoreFilter
              onChange={(ids) => setFilters({ stores: ids })}
              partenaire={filters.partenaire}
              value={filters.stores ?? []}
            />
          </div>
        </Card.Content>
      </Card>

      {/* États */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Spinner size="sm" /> Chargement du relevé…
        </div>
      )}
      {/*
       * L'echec n'offrait aucune reprise : il fallait recharger la page entiere pour
       * retenter une lecture. Et il etait peint en `rose-200/50/600`, trois teintes de la
       * palette Tailwind indifferentes au theme.
       */}
      {isError && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>Le relevé n’a pas pu être lu.</Alert.Description>
          </Alert.Content>
          <Button isPending={isFetching} onPress={() => void refetch()} size="sm" variant="outline">
            Réessayer
          </Button>
        </Alert>
      )}

      {/* Contenu */}
      {releve && !isLoading && (
        <div className="space-y-4">
          <EncoursKpiCards releve={releve} />
          <EncoursCharts releve={releve} />
          {/* Desktop : tableau détaillé ; Mobile : cartes tactiles */}
          <div className="hidden md:block">
            <EncoursTable releve={releve} />
          </div>
          <div className="md:hidden">
            <EncoursMobileCards releve={releve} />
          </div>
          <EncoursDeductionsTable deductions={releve.deductions} total={releve.totalDeductions} />
        </div>
      )}
    </div>
  );
}
