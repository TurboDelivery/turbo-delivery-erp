'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Clock, TrendingUp, FileText, DollarSign } from 'lucide-react';
import { createAgentRecouvreurColumns } from './agent-recouvreur-columns';
import type { IFactureAgent } from './mock-data';
import DepotPartenaireModal from './depot-partenaire-modal';
import EncaissementModal from './encaissement-drawer';
import VerserComptableModal from './verser-comptable-modal';
import type { IPaiement } from './ajouter-paiement-modal'; // used by EncaissementModal callback
import { useAgentFacturesQuery, useDepotPartenaireMutation, useEncaissementMutation, useVerserComptableMutation } from '@/features/agent-recouvreur';

type Periode = 'mois' | 'annee' | 'cycle' | 'plage';
type StatutFilter = 'Tous' | 'En attente' | 'Acompte' | 'Soldé';

const statutFilters: StatutFilter[] = ['Tous', 'En attente', 'Acompte', 'Soldé'];

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
  const sessionUserId = session?.user?.id ?? '';
  const [agentIdInput, setAgentIdInput] = useState('');
  const agentId = agentIdInput.trim() || undefined;

  const [periode, setPeriode] = useState<Periode>('mois');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('Tous');
  const [factureDepot, setFactureDepot] = useState<IFactureAgent | null>(null);
  const [factureEncaissement, setFactureEncaissement] = useState<IFactureAgent | null>(null);
  const [factureVersement, setFactureVersement] = useState<IFactureAgent | null>(null);

  const { data, isLoading, isError, error } = useAgentFacturesQuery({ periode }, agentId);
  const depotPartenaireMutation = useDepotPartenaireMutation(agentId);
  const encaissementMutation = useEncaissementMutation(agentId);
  const verserComptableMutation = useVerserComptableMutation(agentId);

  const factures = (data?.factures.content ?? []) as unknown as IFactureAgent[];

  const enAttente = data?.stats.enAttente ?? 0;
  const avecAcompte = data?.stats.avecAcompte ?? 0;
  const soldees = data?.stats.soldees ?? 0;
  const tauxRecouvrement = data?.stats.tauxRecouvrement ?? 0;

  const filteredData = useMemo(() => factures.filter((f) => {
    if (statutFilter === 'Tous') return true;
    if (statutFilter === 'En attente') return f.statut === 'Recouvrement';
    if (statutFilter === 'Acompte') return f.pourcentageRecouvre !== null && f.pourcentageRecouvre < 100;
    if (statutFilter === 'Soldé') return f.statut === 'Soldé';
    return true;
  }), [factures, statutFilter]);

  const columns = useMemo(
    () => createAgentRecouvreurColumns(
      (facture) => setFactureDepot(facture),
      (_facture) => { /* ajouter preuve: no dedicated endpoint */ },
      (facture) => setFactureEncaissement(facture),
      (facture) => setFactureVersement(facture),
    ),
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Gestion des Paiements</p>
        <h1 className="text-2xl font-bold text-red-500">Espace Agent Recouvreur</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          color="bg-orange-400"
          label="En attente de paiement"
          value={String(enAttente)}
        />
        <StatCard
          icon={TrendingUp}
          color="bg-teal-500"
          label="Paiement avec acompte"
          value={String(avecAcompte)}
        />
        <StatCard
          icon={FileText}
          color="bg-green-500"
          label="Factures soldées"
          value={String(soldees)}
        />
        <StatCard
          icon={DollarSign}
          color="bg-blue-500"
          label="Taux de recouvrement"
          value={`${tauxRecouvrement}%`}
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <span>▼</span> Filtres
        </div>
        <div className="flex flex-wrap gap-6">
          {/* Période */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Période</label>
            <div className="flex gap-1.5">
              {([['mois', 'Mois en cours'], ['annee', 'Année 2026'], ['cycle', 'Par cycle'], ['plage', 'Plage de dates']] as [Periode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriode(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    periode === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Statut</label>
            <div className="flex gap-1.5">
              {statutFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatutFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    statutFilter === s
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Agent ID override (admin) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">
              ID Agent <span className="text-gray-400 font-normal">(laisser vide = vous-même)</span>
            </label>
            <input
              type="text"
              placeholder={sessionUserId || 'UUID de l\'agent…'}
              value={agentIdInput}
              onChange={(e) => setAgentIdInput(e.target.value)}
              className="h-8 w-72 rounded-lg border border-gray-200 px-3 text-xs text-gray-700 placeholder-gray-300 focus:border-blue-400 focus:outline-none"
            />
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
            <p className="text-xs text-gray-400">{String(data?.factures.totalElements ?? filteredData.length).padStart(2, '0')} factures</p>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
            Suivi des factures
          </button>
        </div>
        <Table isStriped aria-label="Factures agent recouvreur">
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
        agentNom={session?.user?.name ?? ''}
        onConfirm={(facture, { date, montant, agent }) => {
          depotPartenaireMutation.mutate({ factureId: facture.id, body: { date, montant, agent } });
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
            encaissementMutation.mutate({
              factureId: facture.id,
              body: {
                type: dernierPaiement.type,
                date: dernierPaiement.date,
                montant: dernierPaiement.montant,
                remarque: dernierPaiement.remarque,
              },
            });
          }
        }}
      />

      <VerserComptableModal
        open={factureVersement !== null}
        onClose={() => setFactureVersement(null)}
        facture={factureVersement}
        onConfirm={(facture, { montant, date }) => {
          verserComptableMutation.mutate({ factureId: facture.id, body: { montant, date } });
          setFactureVersement(null);
        }}
      />
    </div>
  );
}
