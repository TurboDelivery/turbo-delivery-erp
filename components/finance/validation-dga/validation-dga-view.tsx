'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Building2, Calendar, Download, FileText, Landmark, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@heroui/react';
import {
  useFacturesRFQuery,
  useFactureRFQuery,
  useViserDgMutation,
  type IFactureRF,
} from '@/features/responsable-financier';

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// ─── Left Panel — Invoice List ────────────────────────────────────────────────

interface FactureItemProps {
  facture: IFactureRF;
  selected: boolean;
  onClick: () => void;
}

function FactureItem({ facture, selected, onClick }: FactureItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
        selected
          ? 'border-blue-400 bg-blue-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Building2 className={`w-4 h-4 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{facture.partenaire}</p>
            <p className="text-xs text-gray-500">{facture.numero}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-red-600">{formatMontant(facture.montant)}</p>
          <p className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {formatDate(facture.emission)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Right Panel — Proof Viewer ───────────────────────────────────────────────

interface ProofPanelProps {
  facture: IFactureRF | null;
  isLoading: boolean;
  onViser: () => void;
  onRejeter: () => void;
  isPending: boolean;
}

function ProofPanel({ facture, isLoading, onViser, onRejeter, isPending }: ProofPanelProps) {
  const preuve = facture?.preuve;
  const isPdf = preuve?.startsWith('data:application/pdf') || preuve?.toLowerCase().endsWith('.pdf');
  const isImage =
    preuve?.startsWith('data:image') || /\.(jpe?g|png|webp|gif)$/i.test(preuve ?? '');

  function handleDownload() {
    if (!preuve) return;
    const a = document.createElement('a');
    a.href = preuve;
    a.download = `preuve-${facture?.numero ?? 'facture'}`;
    a.click();
  }

  if (!facture) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <FileText className="w-16 h-16 mb-3 opacity-40" />
        <p className="text-sm font-medium text-gray-400">Sélectionnez une facture</p>
        <p className="text-xs text-gray-300 mt-1">La preuve de paiement s&apos;affichera ici</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">PREUVE DE PAIEMENT</p>
            <p className="text-xs text-gray-400">{facture.numero} — {facture.partenaire}</p>
          </div>
        </div>
        {preuve && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Proof viewer */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
          </div>
        ) : !preuve ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucune preuve disponible</p>
            <p className="text-xs mt-1 text-gray-300">La preuve n&apos;a pas encore été ajoutée.</p>
          </div>
        ) : isPdf ? (
          <iframe
            src={preuve}
            className="w-full h-full rounded-lg border border-gray-200 bg-white"
            style={{ minHeight: '400px' }}
            title="Preuve PDF"
          />
        ) : isImage ? (
          <img
            src={preuve}
            alt="Preuve de paiement"
            className="w-full rounded-lg border border-gray-200 object-contain bg-white"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Format non supporté</p>
            <p className="text-xs mt-1 text-gray-300">
              <button onClick={handleDownload} className="text-blue-500 underline">Télécharger le fichier</button>
            </p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white">
        <div className="text-xs text-gray-400">
          Montant :{' '}
          <span className="font-semibold text-red-600">{formatMontant(facture.montant)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            size="sm"
            className="text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-600"
            startContent={<X className="w-4 h-4" />}
            onPress={onRejeter}
            isDisabled={isPending}
          >
            Rejeter
          </Button>
          <Button
            color="success"
            size="sm"
            className="text-white font-semibold"
            startContent={<Landmark className="w-4 h-4" />}
            onPress={onViser}
            isLoading={isPending}
          >
            Viser cette opération
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function ValidationDgaView() {
  const { data: session } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch the list of invoices waiting for DGA visa
  const { data: listData, isLoading: listLoading } = useFacturesRFQuery({
    statut: 'En attente visa DGA',
    size: 50,
  });

  const factures = listData?.factures?.content ?? [];
  const pendingCount = listData?.factures?.totalElements ?? factures.length;

  // Fetch detail of selected facture (to get proof URL)
  const { data: selectedDetail, isLoading: detailLoading } = useFactureRFQuery(selectedId ?? '');

  const selectedFacture: IFactureRF | null = selectedDetail ?? (factures.find((f) => f.id === selectedId) ?? null);

  // Mutations
  const viserMutation = useViserDgMutation();

  function handleViser() {
    if (!selectedId) return;
    viserMutation.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId(null);
      },
    });
  }

  function handleRejeter() {
    toast.info('Fonctionnalité de rejet en cours de déploiement.');
  }

  const userName = session?.user?.name ?? 'DGA';

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] gap-4 p-4 md:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Vue Directeur Général Adjoint</h1>
          <p className="text-sm text-gray-500 mt-0.5">Validation des preuves de paiement — Étape 5</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 shadow-sm">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs font-bold text-indigo-700">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel — Invoice list */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">En attente de visa</p>
                <p className="text-xs text-gray-400 mt-0.5">Étape 5 — Visa Direction</p>
              </div>
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold px-1.5">
                {pendingCount}
              </span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {listLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))
            ) : factures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <FileText className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm text-gray-400">Aucune facture en attente</p>
              </div>
            ) : (
              factures.map((facture) => (
                <FactureItem
                  key={facture.id}
                  facture={facture}
                  selected={selectedId === facture.id}
                  onClick={() => setSelectedId(facture.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel — Proof viewer */}
        <ProofPanel
          facture={selectedFacture}
          isLoading={detailLoading}
          onViser={handleViser}
          onRejeter={handleRejeter}
          isPending={viserMutation.isPending}
        />
      </div>
    </div>
  );
}
