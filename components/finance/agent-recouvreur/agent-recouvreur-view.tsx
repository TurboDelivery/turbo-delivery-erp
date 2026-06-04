'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { flexRender, type RowSelectionState } from '@tanstack/react-table';
import type { DateRange } from 'react-day-picker';
import { createAgentRecouvreurColumns, renderAgentActions, getStatutConfig, formatMontant } from './agent-recouvreur-columns';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import DepotPartenaireModal from './depot-partenaire-modal';
import EncaissementModal from './encaissement-drawer';
import VerserComptableModal from './verser-comptable-modal';
import EncaisserLotModal, { resteAEncaisser } from './encaisser-lot-modal';
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

  // Encaissement en masse (factures « Déposé partenaire » pas encore soldées).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [lotOpen, setLotOpen] = useState(false);
  const [lotRunning, setLotRunning] = useState(false);
  const [lotProgress, setLotProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  const columns = useMemo(
    () => createAgentRecouvreurColumns(
      (facture) => setFactureDepot(facture),
      (facture) => setFactureEncaissement(facture),
      (facture) => setFactureVersement(facture),
      true, // colonne de sélection (encaissement en masse)
    ),
    [],
  );

  const { data: agentsData } = useAgentsRecouvrementQuery();
  const agentsList = agentsData ?? [];

  /** Nom de l'agent connecté résolu depuis la liste des agents RF */
  const connectedAgentNom =
    agentsList.find((a) => a.id === session?.user?.id)?.nom ??
    session?.user?.nomComplet ??
    session?.user?.name ??
    '';

  // Seules les factures « Déposé partenaire » pas encore couvertes à 100% sont
  // encaissables en masse (= celles qui affichent le bouton « Encaisser »).
  const isBulkEligible = (f: IAgentFacture) =>
    f.statut === 'Déposé partenaire' && (f.montantRecouvre ?? 0) < f.montant;

  const { table, isLoading, isError, error, totalElements, totalPages } =
    useAgentRecouvreurTable(columns, params, undefined, {
      state: { rowSelection },
      onRowSelectionChange: setRowSelection,
      enableRowSelection: (row) => isBulkEligible(row.original),
    });
  const { statsCards } = useAgentRecouvreurStats(params);

  const depotPartenaireMutation = useDepotPartenaireMutation();
  const encaissementMutation = useEncaissementMutation();
  const verserComptableMutation = useVersementCaissierMutation();

  const facturesSelection = table.getSelectedRowModel().rows.map((r) => r.original).filter(isBulkEligible);
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
      toast.error('Session expirée', { description: 'Impossible de récupérer votre identifiant. Reconnectez-vous.' });
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
          factureId: f.id,
          agentIdOverride: agentId,
          body: { type: 'Solde', date: today, montant: restant, preuve: shared.preuve, remarque: shared.remarque },
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
      toast.warning(`${ok} encaissée(s), ${echecs.length} en échec`, { description: echecs.join(', ') });
    }
  }

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

      {/* Table — desktop uniquement (≥ md) */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Suivi des factures</p>
            <p className="text-xs text-gray-400">{String(totalElements).padStart(2, '0')} factures</p>
          </div>
          {facturesSelection.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {facturesSelection.length} sélectionnée(s) ·{' '}
                <span className="font-semibold text-gray-700">{formatMontant(totalSelection)}</span>
              </span>
              <button onClick={() => setRowSelection({})} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Tout désélectionner
              </button>
              <Button size="sm" onClick={() => setLotOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                Encaisser à 100%
              </Button>
            </div>
          )}
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

      {/* Barre d'action lot — mobile */}
      {facturesSelection.length > 0 && (
        <div className="md:hidden sticky top-2 z-20 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm">
          <span className="text-xs text-gray-600">
            {facturesSelection.length} · <span className="font-semibold">{formatMontant(totalSelection)}</span>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setRowSelection({})} className="text-xs text-gray-400 underline">
              Annuler
            </button>
            <Button size="sm" onClick={() => setLotOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5">
              <Banknote className="w-3.5 h-3.5" /> Encaisser à 100%
            </Button>
          </div>
        </div>
      )}

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <MobileCardList>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            {isError ? String(error) : 'Aucune facture trouvée'}
          </p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const f = row.original;
            const cfg = getStatutConfig(f.statut);
            const card = (
              <FactureMobileCard
                numero={f.numero}
                partenaire={f.partenaire}
                montant={formatMontant(f.montant)}
                statut={cfg.label}
                statutClassName={cfg.className}
                actions={renderAgentActions(f, setFactureDepot, setFactureEncaissement, setFactureVersement)}
              />
            );
            return row.getCanSelect() ? (
              <div key={f.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  aria-label="Sélectionner la facture"
                  className="mt-4 h-4 w-4 flex-shrink-0 rounded border-gray-300 accent-green-600 cursor-pointer"
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                />
                <div className="flex-1 min-w-0">{card}</div>
              </div>
            ) : (
              <div key={f.id}>{card}</div>
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination page={filters.page + 1} total={totalPages} onChange={(p) => setFilters({ page: p - 1 })} />
          </div>
        )}
      </MobileCardList>

      <DepotPartenaireModal
        open={factureDepot !== null}
        onClose={() => setFactureDepot(null)}
        facture={factureDepot}
        agentNom={connectedAgentNom}
        onConfirm={(facture, { date, montant, agent }) => {
          depotPartenaireMutation.mutate(
            { factureId: facture.id, body: { date, montant, agent }, agentIdOverride: session?.user?.id ?? '' },
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
        agentNom={connectedAgentNom}
        onPaiementAjoute={(facture, paiements) => {
          const dernierPaiement = paiements[paiements.length - 1];
          if (dernierPaiement) {
            encaissementMutation.mutate(
              {
                factureId: facture.id,
                agentIdOverride: session?.user?.id ?? '',
                body: {
                  type: dernierPaiement.type,
                  date: dernierPaiement.date,
                  montant: dernierPaiement.montant,
                  remarque: dernierPaiement.remarque,
                  // V52 (2026-05) — Propager la preuve data URL base64 au
                  // backend pour persistance. Avant : champ jamais propagé,
                  // upload silencieusement perdu.
                  preuve: dernierPaiement.preuve,
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
        onConfirm={(facture, { montant, date, preuve }) => {
          const agentId = session?.user?.id ?? '';
          if (!agentId) {
            toast.error('Session expirée', {
              description: 'Impossible de récupérer votre identifiant. Reconnectez-vous.',
            });
            return;
          }
          verserComptableMutation.mutate(
            // V52 (2026-05) — Propager la preuve data URL base64 au backend.
            { factureId: facture.id, agentIdOverride: agentId, body: { montant, date, preuve } },
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

      <EncaisserLotModal
        open={lotOpen}
        onClose={() => { if (!lotRunning) setLotOpen(false); }}
        factures={facturesSelection}
        running={lotRunning}
        progress={lotProgress}
        onConfirm={runBulkEncaisser}
      />
    </div>
  );
}
