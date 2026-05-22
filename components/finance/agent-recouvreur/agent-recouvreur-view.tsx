'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Select,
  SelectItem,
} from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import type { DateRange } from 'react-day-picker';
import { createAgentRecouvreurColumns } from './agent-recouvreur-columns';
import DepotPartenaireModal from './depot-partenaire-modal';
import EncaissementModal from './encaissement-drawer';
import VerserComptableModal from './verser-comptable-modal';
import DateFilterInput from '@/components/finance/date-filter-input';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import {
  useDepotPartenaireMutation,
  useEncaissementMutation,
  useVersementCaissierMutation,
  useAgentRecouvreurFilters,
  useAgentRecouvreurTable,
  useAgentRecouvreurStats,
  cycleOptions,
} from '@/features/agent-recouvreur';
import { useAgentsRecouvrementQuery } from '@/features/responsable-financier';
import type { IAgentFacture } from '@/features/agent-recouvreur';

const statutChips = ['Tous', 'Recouvrement', 'Déposé partenaire', 'Soldé', 'Versé au caissier'] as const;
type StatutChip = typeof statutChips[number];

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

export default function AgentRecouvreurView() {
  const { data: session } = useSession();

  const { filters, setFilters, params } = useAgentRecouvreurFilters();

  const [factureDepot, setFactureDepot] = useState<IAgentFacture | null>(null);
  const [factureEncaissement, setFactureEncaissement] = useState<IAgentFacture | null>(null);
  const [factureVersement, setFactureVersement] = useState<IAgentFacture | null>(null);

  const columns = useMemo(
    () => createAgentRecouvreurColumns(
      (facture) => setFactureDepot(facture),
      (facture) => setFactureEncaissement(facture),
      (facture) => setFactureVersement(facture),
    ),
    [],
  );

  const { data: agentsData } = useAgentsRecouvrementQuery();
  const agentsList = agentsData ?? [];

  /** Résout le X-User-Id depuis le nom de l'agent assigné à la facture */
  function resolveAgentId(factureAgentNom: string): string {
    const normalized = factureAgentNom.trim().toLowerCase();
    return agentsList.find((a) => a.nom.trim().toLowerCase() === normalized)?.id ?? '';
  }

  const { table, isLoading, isError, error, totalElements, totalPages } =
    useAgentRecouvreurTable(columns, params);
  const { statsCards } = useAgentRecouvreurStats(params);

  const depotPartenaireMutation = useDepotPartenaireMutation();
  const encaissementMutation = useEncaissementMutation();
  const verserComptableMutation = useVersementCaissierMutation();

  const handleDateChange = (range: DateRange | undefined) => {
    setFilters({
      dateDebut: range?.from ?? null,
      dateFin: range?.to ?? null,
      page: 0,
    });
  };

  const handleCycleChange = (key: string) => {
    setFilters({ cycle: key, page: 0 });
  };

  const handleRestaurantChange = (value?: string) => {
    setFilters({ restaurantId: value ?? '', page: 0 });
  };

  const handleStatutChip = (chip: StatutChip) => {
    setFilters({ statut: chip === 'Tous' ? '' : chip, page: 0 });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Gestion des Paiements</p>
        <h1 className="text-2xl font-bold text-red-500">Espace Agent Recouvreur</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            color={card.color}
            label={card.label}
            value={card.value}
          />
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <span>▼</span> Filtres
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
            <label className="text-xs text-gray-500 font-medium">Partenaire</label>
            <RestaurantSelect
              value={filters.restaurantId || undefined}
              onChange={handleRestaurantChange}
              placeholder="Tous les partenaires"
              className="text-xs w-full sm:w-[220px]"
            />
          </div>

          {/* Cycle */}
          <Select
            label="Cycle"
            selectedKeys={new Set([filters.cycle || 'TOUT'])}
            onSelectionChange={(keys) => {
              const key = Array.from(keys as Set<string>)[0];
              if (key) handleCycleChange(key);
            }}
            variant="bordered"
            className="max-w-xs w-full sm:w-[220px]"
            disallowEmptySelection
          >
            {cycleOptions.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>

          {/* Statut chips (envoyés au backend) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Statut</label>
            <div className="flex flex-wrap gap-1.5">
              {statutChips.map((s) => {
                const active = (s === 'Tous' && !filters.statut) || filters.statut === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatutChip(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Erreur de chargement : {error instanceof Error ? error.message : 'Erreur inconnue'}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Suivi des factures</p>
            <p className="text-xs text-gray-400">{String(totalElements).padStart(2, '0')} factures</p>
          </div>
        </div>
        <Table
          isStriped
          aria-label="Factures agent recouvreur"
          bottomContent={
            totalPages > 1 ? (
              <div className="flex justify-center py-3">
                <Pagination
                  page={filters.page + 1}
                  total={totalPages}
                  onChange={(p) => setFilters({ page: p - 1 })}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((h) => (
              <TableColumn key={h.id} className="text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={isLoading ? ' ' : 'Aucune facture trouvée'}
            isLoading={isLoading}
          >
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DepotPartenaireModal
        open={factureDepot !== null}
        onClose={() => setFactureDepot(null)}
        facture={factureDepot}
        agentNom={session?.user?.nomComplet || session?.user?.name || ''}
        onConfirm={(facture, { date, montant, agent }) => {
          const agentId = resolveAgentId(facture.agent);
          depotPartenaireMutation.mutate(
            { factureId: facture.id, body: { date, montant, agent }, agentIdOverride: agentId },
            {
              onSuccess: () => toast.success('Dépôt enregistré avec succès'),
              onError: (e) => toast.error(`Échec dépôt : ${e instanceof Error ? e.message : 'Erreur'}`),
            },
          );
          setFactureDepot(null);
        }}
      />

      <EncaissementModal
        open={factureEncaissement !== null}
        onClose={() => setFactureEncaissement(null)}
        facture={factureEncaissement}
        onPaiementAjoute={(facture, paiements) => {
          const dernierPaiement = paiements[paiements.length - 1];
          if (dernierPaiement) {
            encaissementMutation.mutate(
              {
                factureId: facture.id,
                agentIdOverride: resolveAgentId(facture.agent),
                body: {
                  type: dernierPaiement.type,
                  date: dernierPaiement.date,
                  montant: dernierPaiement.montant,
                  remarque: dernierPaiement.remarque,
                },
              },
              {
                onSuccess: () => toast.success('Encaissement enregistré'),
                onError: (e) => toast.error(`Échec encaissement : ${e instanceof Error ? e.message : 'Erreur'}`),
              },
            );
          }
        }}
      />

      <VerserComptableModal
        open={factureVersement !== null}
        onClose={() => setFactureVersement(null)}
        facture={factureVersement}
        onConfirm={(facture, { montant, date }) => {
          const agentId = resolveAgentId(facture.agent);
          if (!agentId) {
            toast.error('Agent introuvable', {
              description: `Impossible de résoudre l'identifiant de l'agent "${facture.agent}". Réessayez dans un instant.`,
            });
            return;
          }
          verserComptableMutation.mutate(
            { factureId: facture.id, agentIdOverride: agentId, body: { montant, date } },
            {
              onSuccess: (data) => {
                if (data && 'statut' in data && data.statut !== 'Versé au caissier') {
                  toast.error('Versement non enregistré', {
                    description: `Le serveur a retourné le statut "${data.statut}" — le versement n'a pas été appliqué. Contactez le support.`,
                  });
                } else {
                  toast.success('Versement enregistré avec succès');
                }
              },
              onError: (e) => toast.error(`Échec versement : ${e instanceof Error ? e.message : 'Erreur'}`),
            },
          );
          setFactureVersement(null);
        }}
      />
    </div>
  );
}
