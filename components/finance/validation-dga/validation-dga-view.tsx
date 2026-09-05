'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Building2, Calendar, Download, FileText, Landmark, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Label, Modal, Spinner, TextArea } from '@heroui-v3/react';
import {
  useFacturesRFQuery,
  useFactureRFQuery,
  useViserDgMutation,
  useRejeterDgaMutation,
  type IFactureRF,
} from '@/features/responsable-financier';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
import EtatErreur from '@/components/commons/EtatErreur';
import { formatMontant } from '@/utils/format.utils';

// ─── Utils ────────────────────────────────────────────────────────────────────


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
          ? 'border-accent bg-accent-soft/30 shadow-xs'
          : 'border-separator bg-surface hover:border-separator hover:bg-surface-secondary'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-accent-soft' : 'bg-surface-secondary'}`}>
            <Building2 aria-hidden="true" className={`size-4 ${selected ? 'text-accent' : 'text-muted'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{facture.partenaire}</p>
            <p className="text-xs text-muted">{facture.numero}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums text-foreground">{formatMontant(facture.montant)}</p>
          <p className="text-xs text-muted flex items-center justify-end gap-1 mt-0.5">
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
  isError?: boolean;
  onReessayer?: () => void;
  facture: IFactureRF | null;
  isLoading: boolean;
  onViser: () => void;
  onRejeter: () => void;
  isPending: boolean;
}

function ProofPanel({ facture, isLoading, isError, onReessayer, onViser, onRejeter, isPending }: ProofPanelProps) {
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
      <div className="flex-1 flex flex-col items-center justify-center text-muted bg-surface-secondary rounded-2xl border border-dashed border-separator">
        <FileText className="w-16 h-16 mb-3 opacity-40" />
        <p className="text-sm font-medium text-muted">Sélectionnez une facture</p>
        <p className="text-xs text-muted mt-1">La preuve de paiement s&apos;affichera ici</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-separator shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-separator">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
            <FileText aria-hidden="true" className="size-4 text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">PREUVE DE PAIEMENT</p>
            <p className="text-xs text-muted">{facture.numero} — {facture.partenaire}</p>
          </div>
        </div>
        {preuve && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Proof viewer */}
      <div className="flex-1 overflow-auto p-4 bg-surface-secondary">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            {/* Un anneau tournant dessine a la main, en indigo : le composant en a un. */}
            <Spinner />
          </div>
        ) : isError ? (
          /* Echec de LECTURE. Ne jamais le confondre avec « pas encore ajoutee » : le
             premier se corrige en reessayant, le second justifierait un rejet. */
          <EtatErreur quoi="la preuve de paiement" onReessayer={onReessayer} />
        ) : !preuve ? (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucune preuve disponible</p>
            <p className="text-xs mt-1 text-muted">La preuve n&apos;a pas encore été ajoutée.</p>
          </div>
        ) : isPdf ? (
          <iframe
            src={preuve}
            className="w-full h-full rounded-lg border border-separator bg-surface"
            style={{ minHeight: '400px' }}
            title="Preuve PDF"
          />
        ) : isImage ? (
          <img
            src={preuve}
            alt="Preuve de paiement"
            className="w-full rounded-lg border border-separator object-contain bg-surface"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Format non supporté</p>
            <p className="text-xs mt-1 text-muted">
              <Button onPress={handleDownload} size="sm" variant="ghost">
                Télécharger le fichier
              </Button>
            </p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 py-4 border-t border-separator flex items-center justify-between gap-3 bg-surface">
        <div className="text-xs text-muted">
          Montant :{' '}
          <span className="font-semibold tabular-nums text-foreground">{formatMontant(facture.montant)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button isDisabled={isPending} onPress={onRejeter} size="sm" variant="danger-soft">
            <X aria-hidden="true" className="size-4" />
            Rejeter
          </Button>
          <Button isPending={isPending} onPress={onViser} size="sm" variant="primary">
            {isPending ? (
              <Spinner size="sm" />
            ) : (
              <Landmark aria-hidden="true" className="size-4" />
            )}
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
  const {
    data: listData,
    isLoading: listLoading,
    isError: listErreur,
    isFetching: listEnCours,
    refetch: rechargerListe,
  } = useFacturesRFQuery({
    periode: 'cycle',
    statut: 'En attente visa DGA',
    size: 50,
  });

  const factures = listData?.factures?.content ?? [];
  const pendingCount = listData?.factures?.totalElements ?? factures.length;

  // Fetch detail of selected facture (to get proof URL)
  // `isError` etait jete : sur panne, `preuve` restait vide et le panneau annoncait
  // « Aucune preuve disponible / La preuve n'a pas encore ete ajoutee ». C'est une
  // AFFIRMATION DE FAIT, et elle est fausse : la preuve existe, c'est la lecture du
  // detail qui est tombee. Le DGA pouvait rejeter une facture parfaitement justifiee.
  const {
    data: selectedDetail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useFactureRFQuery(selectedId ?? '');

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
      className="flex flex-col gap-4 p-4 md:p-6 md:h-[calc(100vh-11rem)]"
      style={hauteurZoneTravail ? { height: hauteurZoneTravail } : undefined}
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Vue Directeur Général Adjoint</h1>
          <p className="text-sm text-muted mt-0.5">Validation des preuves de paiement — Étape 5</p>
        </div>
        <div className="flex items-center gap-2 bg-surface rounded-xl border border-separator px-3 py-2 shadow-xs">
          <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center">
            <span className="text-xs font-bold text-accent-soft-foreground">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">{userName}</span>
        </div>
      </div>

      {/* Two-panel layout — empilé sur mobile, côte à côte ≥ lg */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left panel — Invoice list (pleine largeur sur mobile, hauteur limitée) */}
        <div className="w-full md:w-80 md:shrink-0 flex flex-col bg-surface rounded-2xl border border-separator shadow-xs overflow-hidden max-h-[45vh] md:max-h-none">
          {/* Panel header */}
          <div className="px-4 py-3.5 border-b border-separator">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">En attente de visa</p>
                <p className="text-xs text-muted mt-0.5">Étape 5 — Visa Direction</p>
              </div>
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-danger-foreground">
                {pendingCount}
              </span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Sur echec, `factures` retombait a [] et `pendingCount` a 0 :
                l'ecran annoncait qu'il n'y avait plus rien a viser alors que le
                workflow etait bloque. */}
            {listErreur ? (
              <EtatErreur
                quoi="les factures en attente de visa"
                onReessayer={() => rechargerListe()}
                enCours={listEnCours}
              />
            ) : listLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-secondary animate-pulse" />
              ))
            ) : factures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted">
                <FileText className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm text-muted">Aucune facture en attente</p>
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
          isError={detailError}
          onReessayer={() => refetchDetail()}
          onViser={handleViser}
          onRejeter={handleRejeter}
          isPending={viserMutation.isPending || rejeterMutation.isPending}
        />
      </div>

      {/* Modale rejet DGA */}
      <Modal isOpen={rejeterOpen} onOpenChange={setRejeterOpen}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-sm">
            <Modal.Header>
              <Modal.Heading>Rejeter la facture</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              {/*
               * `TextArea` n'est PAS composé en v3 : il n'expose que `Root`, il ne prend
               * pas de `label` et son `onChange` reçoit un ÉVÉNEMENT DOM, à la différence
               * de `TextField` qui reçoit la valeur.
               */}
              <div className="flex flex-col gap-1">
                <Label>Motif du rejet</Label>
                <TextArea
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Décrivez la raison du rejet…"
                  required
                  rows={3}
                  value={motif}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={rejeterMutation.isPending}
                onPress={() => setRejeterOpen(false)}
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                isDisabled={!motif.trim()}
                isPending={rejeterMutation.isPending}
                onPress={handleConfirmRejeter}
                variant="danger"
              >
                {rejeterMutation.isPending ? <Spinner size="sm" /> : null}
                Confirmer le rejet
              </Button>
            </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
      </Modal>
    </div>
  );
}
