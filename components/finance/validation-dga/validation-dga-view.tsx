'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Building2, Calendar, Download, FileText, Landmark, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '@heroui/react';
import {
  useFacturesRFQuery,
  useFactureRFQuery,
  useViserDgMutation,
  useRejeterDgaMutation,
  type IFactureRF,
} from '@/features/responsable-financier';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';

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
  const [rejeterOpen, setRejeterOpen] = useState(false);
  const [motif, setMotif] = useState('');

  // Fetch the list of invoices waiting for DGA visa.
  //
  // Bug (2026-05) — Le backlog visa DGA doit montrer TOUTES les factures en
  // attente de visa, quel que soit leur mois de création. Sans `periode`
  // explicite, le backend applique `periode="mois"` (mois courant) et masque
  // silencieusement les factures plus anciennes encore non visées : une
  // facture créée en février (ex. F20260211-AGHA-56744, statut
  // EN_ATTENTE_VISA_DGA) n'apparaissait plus dans le backlog en mai alors
  // qu'elle bloquait toujours le workflow. `periode="cycle"` mappe sur
  // DateRange(null, null) côté backend = aucun filtre de date.
  const { data: listData, isLoading: listLoading } = useFacturesRFQuery({
    periode: 'cycle',
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
  const rejeterMutation = useRejeterDgaMutation();

  function handleViser() {
    if (!selectedId) return;
    viserMutation.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId(null);
      },
    });
  }

  function handleRejeter() {
    if (!selectedId) return;
    setMotif('');
    setRejeterOpen(true);
  }

  function handleConfirmRejeter() {
    if (!selectedId || !motif.trim()) return;
    rejeterMutation.mutate(
      { id: selectedId, data: { motif: motif.trim() } },
      {
        onSuccess: () => {
          setRejeterOpen(false);
          setSelectedId(null);
        },
      },
    );
  }

  const userName = session?.user?.name ?? 'DGA';

  // Écran « poste de travail » : liste à gauche, preuve à droite, barre Viser/Rejeter en bas.
  // Il doit tenir dans la fenêtre, sinon la barre d'action passe sous la ligne de flottaison.
  // La hauteur est mesurée : le plancher d'avant réservait 120 px à la coquille alors qu'elle
  // en fait environ 155 (en-tête applicatif + marges de ContentAnimation + pied de page), donc
  // la page débordait d'emblée sur une fenêtre courte.
  //
  // Ce commentaire ne cite volontairement PAS la classe supprimée : Tailwind extrait les noms
  // de classes du texte brut des fichiers, commentaires inclus, et regénérerait la règle morte.
  const zoneTravailRef = useRef<HTMLDivElement>(null);
  const hauteurZoneTravail = useHauteurDisponible(zoneTravailRef);

  return (
    <div
      ref={zoneTravailRef}
      className="flex flex-col gap-4 p-4 md:p-6 lg:h-[calc(100vh-11rem)]"
      style={hauteurZoneTravail ? { height: hauteurZoneTravail } : undefined}
    >
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

      {/* Two-panel layout — empilé sur mobile, côte à côte ≥ lg */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left panel — Invoice list (pleine largeur sur mobile, hauteur limitée) */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-h-[45vh] lg:max-h-none">
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
          isPending={viserMutation.isPending || rejeterMutation.isPending}
        />
      </div>

      {/* Modale rejet DGA */}
      <Modal isOpen={rejeterOpen} onOpenChange={setRejeterOpen} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-red-600">Rejeter la facture</ModalHeader>
              <ModalBody>
                <Textarea
                  label="Motif du rejet"
                  placeholder="Décrivez la raison du rejet…"
                  value={motif}
                  onValueChange={setMotif}
                  minRows={3}
                  isRequired
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={rejeterMutation.isPending}>
                  Annuler
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmRejeter}
                  isLoading={rejeterMutation.isPending}
                  isDisabled={!motif.trim()}
                >
                  Confirmer le rejet
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
