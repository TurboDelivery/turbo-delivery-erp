'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  Settings,
  User,
  FileText,
  Eye,
  Receipt,
  Clock,
  CheckCircle2,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  TrendingUp,
  Pencil,
} from 'lucide-react';
import { Spinner } from '@heroui/react';
// import { useDepensesListQuery } from '@/feature-finance/depenses/queries/depense-list.query';
import { useModifierStatutDepenseMutation } from '@/feature-finance/depenses/queries/depense.mutation';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { IDepense } from '@/features/depenses/types/depense.type';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Statuts workflow ──────────────────────────────────────────────────────────
const S_EN_ATTENTE_DGA = 'En attente validation DGA';
const S_EN_ATTENTE_DG  = 'En attente validation DG';
const S_VUE_DGA        = 'Viré par DGA';
const S_VERIFIE_DGA    = 'Vérifié par DGA';
const S_APPROUVE       = 'Approuvé pour paiement';
const S_DECAISSE       = 'Décaissé';
const S_REJETE_DGA     = 'Annulé par DGA';
const S_REJETE_DG      = 'Rejeté par DG';

// Statuts terminaux (plus rien à faire)
const STATUTS_TERMINAUX = [S_DECAISSE, S_VUE_DGA, S_REJETE_DGA, S_REJETE_DG];

// ─── Fake data (à remplacer par l'API) ─────────────────────────────────────────
const FAKE_DEPENSES: IDepense[] = [
  {
    id: '1',
    libelle: 'Fournitures de bureau - Papeterie',
    montant: 28500,
    description: 'Achat fournitures Q1 2026',
    dateDepense: '2026-03-28',
    typeDepense: 'VARIABLE',
    sourcePaiement: 'Caisse',
    statut: S_REJETE_DGA,
    categorie: { id: 'c1', nomCategorie: 'Fournitures de bureau', description: '' },
    createdAt: '2026-03-28T08:00:00Z',
    updatedAt: '2026-03-28T08:00:00Z',
  },
  {
    id: '2',
    libelle: 'Loyer Bureaux Mars 2026',
    montant: 350000,
    description: '',
    dateDepense: '2026-03-28',
    typeDepense: 'PAIE',
    sourcePaiement: 'Virement',
    statut: S_VUE_DGA,
    categorie: { id: 'c2', nomCategorie: 'Loyer', description: '' },
    createdAt: '2026-03-28T09:00:00Z',
    updatedAt: '2026-03-28T09:00:00Z',
  },
  {
    id: '3',
    libelle: 'Réparation Climatisation Salle Réunion',
    montant: 45000,
    description: 'Facture réparation climatisation',
    dateDepense: '2026-03-30',
    typeDepense: 'VARIABLE',
    sourcePaiement: 'Caisse',
    statut: S_EN_ATTENTE_DGA,
    categorie: { id: 'c3', nomCategorie: 'Réparation', description: '' },
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
  },
  {
    id: '4',
    libelle: 'Salaires Equipe Mars 2026',
    montant: 1250000,
    description: '',
    dateDepense: '2026-03-27',
    typeDepense: 'PAIE',
    sourcePaiement: 'Virement',
    statut: S_APPROUVE,
    categorie: { id: 'c4', nomCategorie: 'Salaires', description: '' },
    createdAt: '2026-03-27T08:00:00Z',
    updatedAt: '2026-03-27T08:00:00Z',
  },
  {
    id: '5',
    libelle: 'Fournitures de bureau - Papeterie',
    montant: 28500,
    description: 'Commande papeterie mars',
    dateDepense: '2026-03-29',
    typeDepense: 'VARIABLE',
    sourcePaiement: 'Caisse',
    statut: S_VERIFIE_DGA,
    categorie: { id: 'c1', nomCategorie: 'Fournitures de bureau', description: '' },
    createdAt: '2026-03-29T11:00:00Z',
    updatedAt: '2026-03-29T11:00:00Z',
  },
  {
    id: '6',
    libelle: 'Internet Fibre Mars 2026',
    montant: 35000,
    description: '',
    dateDepense: '2026-03-28',
    typeDepense: 'FIXE',
    sourcePaiement: 'Prélèvement',
    statut: S_DECAISSE,
    categorie: { id: 'c5', nomCategorie: 'Internet', description: '' },
    createdAt: '2026-03-28T07:00:00Z',
    updatedAt: '2026-03-28T07:00:00Z',
  },
];

type Role    = 'comptable' | 'dga' | 'dg';
type SubTab  = 'validation' | 'historique';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return d;
  }
}

function isDGAPending(statut: string) {
  return statut === S_EN_ATTENTE_DGA || statut === 'PENDING';
}
function isDGPending(statut: string) {
  return statut === S_EN_ATTENTE_DG;
}
function isComptablePending(statut: string) {
  return statut === S_APPROUVE;
}

// ─── Badges ────────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const t = (type ?? '').toUpperCase();
  const cls =
    t === 'VARIABLE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : t === 'PAIE'   ? 'bg-blue-100   text-blue-700   border-blue-200'
                     : 'bg-gray-100   text-gray-700   border-gray-200';
  return (
    <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {t || 'N/A'}
    </span>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    [S_APPROUVE]:      'bg-green-100 text-green-600',
    [S_EN_ATTENTE_DGA]:'bg-yellow-100 text-yellow-600',
    [S_EN_ATTENTE_DG]: 'bg-yellow-100 text-yellow-600',
    [S_VUE_DGA]:       'bg-blue-100  text-blue-600',
    [S_VERIFIE_DGA]:   'bg-blue-100  text-blue-600',
    [S_DECAISSE]:      'bg-gray-100  text-gray-600',
    [S_REJETE_DGA]:    'bg-red-100   text-red-600',
    [S_REJETE_DG]:     'bg-red-100   text-red-600',
    PAID:              'bg-green-100 text-green-600',
    PENDING:           'bg-gray-100  text-gray-600',
  };
  const cls = map[statut] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{statut}</span>
  );
}

// ─── Stepper ───────────────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  { label: 'Comptable', sub: 'Saisie' },
  { label: 'DGA',       sub: 'Validation' },
  { label: 'DG',        sub: 'Approbation' },
  { label: 'Paiement',  sub: 'Décaissement' },
];

function stepFromStatut(statut: string): number {
  if ([S_REJETE_DGA, S_REJETE_DG].includes(statut)) return -1;
  if ([S_DECAISSE, S_VUE_DGA].includes(statut))      return 4;
  if (statut === S_APPROUVE)                          return 3;
  if (statut === S_EN_ATTENTE_DG || statut === S_VERIFIE_DGA) return 2;
  // PENDING, EN_ATTENTE_DGA, unknown → DGA step
  return 1;
}

function WorkflowStepper({ statut }: { statut: string }) {
  const active = stepFromStatut(statut);
  return (
    <div className="flex items-center py-4">
      {WORKFLOW_STEPS.map((step, i) => {
        const done    = active > i;
        const current = active === i;
        const last    = i === WORKFLOW_STEPS.length - 1;
        return (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
                done    ? 'border-green-500 bg-green-500 text-white'
                : current ? 'border-blue-500  bg-white      text-blue-500'
                          : 'border-gray-200  bg-white      text-gray-400'
              }`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium ${done ? 'text-green-600' : current ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
              <span className="text-[10px] text-gray-400">{step.sub}</span>
            </div>
            {!last && <div className={`h-0.5 flex-1 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Formulaire de modification inline (DGA) ──────────────────────────────────
function ModifierForm({
  depense,
  onSave,
  onCancel,
}: {
  depense: IDepense;
  onSave: (updates: Partial<IDepense>) => void;
  onCancel: () => void;
}) {
  const [libelle, setLibelle]       = useState(depense.libelle);
  const [montant, setMontant]       = useState(String(depense.montant));
  const [description, setDescription] = useState(depense.description ?? '');
  const [dateDepense, setDateDepense] = useState(depense.dateDepense);

  const handleSave = () => {
    const montantNum = parseFloat(montant.replace(/[^0-9.]/g, ''));
    if (!libelle.trim() || isNaN(montantNum)) return;
    onSave({ libelle: libelle.trim(), montant: montantNum, description, dateDepense });
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-gray-700">Modifier la dépense</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Désignation</label>
          <input
            type="text"
            value={libelle}
            onChange={e => setLibelle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Montant (FCFA)</label>
          <input
            type="number"
            value={montant}
            onChange={e => setMontant(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
          <input
            type="date"
            value={dateDepense}
            onChange={e => setDateDepense(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── ValidationCard ────────────────────────────────────────────────────────────
function ValidationCard({
  depense, current, total,
  onPrev, onNext,
  onAccept, onReject, onModifier,
  acceptLabel, canAct, isDGA, isPending,
}: {
  depense: IDepense;
  current: number; total: number;
  onPrev: () => void; onNext: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onModifier: (id: string, updates: Partial<IDepense>) => void;
  acceptLabel: string; canAct: boolean; isDGA: boolean; isPending: boolean;
}) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">
            {acceptLabel === 'Viser' ? 'Validation DGA' : acceptLabel === 'Approuver' ? 'Approbation DG' : 'Décaissement Comptable'}
          </h2>
          <p className="text-sm text-gray-400">Dépense {current + 1} sur {total}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={current === 0}         className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft  className="h-4 w-4" /></button>
          <button onClick={onNext} disabled={current === total - 1} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-gray-500">{fmtDate(depense.dateDepense)}</span>
          </div>
          <span className="text-xl font-bold text-[#E8541E]">{formatCFA(depense.montant)}</span>
        </div>

        <p className="mb-0.5 font-semibold text-gray-900">{depense.libelle}</p>
        <p className="mb-3 text-sm text-blue-500">{depense.categorie?.nomCategorie}</p>

        <WorkflowStepper statut={depense.statut} />

        <div className="mt-2 grid grid-cols-2 rounded-lg bg-gray-50 p-3">
          <div>
            <p className="text-xs text-gray-400">Créé par</p>
            <p className="text-sm font-medium text-gray-700">Comptable</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Date de création</p>
            <p className="text-sm font-medium text-gray-700">{fmtDate(depense.createdAt ?? depense.dateDepense)}</p>
          </div>
          <div className="col-span-2 mt-2 flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer hover:text-gray-800">
            <FileText className="h-4 w-4" />
            <span>Voir le justificatif en grand</span>
          </div>
        </div>
      </div>

      {/* Formulaire modifier inline */}
      {showEdit && (
        <ModifierForm
          depense={depense}
          onSave={(updates) => {
            onModifier(depense.id, updates);
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      )}

      {/* Actions */}
      {canAct ? (
        isDGA ? (
          // DGA : 3 actions — Rejeter | Modifier | Viser
          <div className="grid grid-cols-3 border-t border-gray-200">
            <button
              onClick={() => { onReject(depense.id); setShowEdit(false); }}
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-gray-200 transition-colors"
            >
              <X className="h-4 w-4" /> Rejeter
            </button>
            <button
              onClick={() => setShowEdit(v => !v)}
              disabled={isPending}
              className={`flex items-center justify-center gap-1.5 py-4 text-sm font-medium transition-colors border-r border-gray-200 ${
                showEdit ? 'bg-orange-50 text-orange-600' : 'text-orange-500 hover:bg-orange-50'
              } disabled:opacity-50`}
            >
              <Pencil className="h-4 w-4" /> Modifier
            </button>
            <button
              onClick={() => { onAccept(depense.id); setShowEdit(false); }}
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-br-xl bg-green-500 py-4 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" /> Viser
            </button>
          </div>
        ) : (
          // Comptable / DG : 2 actions
          <div className="grid grid-cols-2 border-t border-gray-200">
            <button
              onClick={() => onReject(depense.id)} disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-bl-xl py-4 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 border-r border-gray-200 transition-colors"
            >
              <X className="h-4 w-4" /> Rejeter
            </button>
            <button
              onClick={() => onAccept(depense.id)} disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-br-xl bg-green-500 py-4 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" /> {acceptLabel}
            </button>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-b-xl border-t border-gray-100 py-3 text-sm text-gray-400">
          <StatusBadge statut={depense.statut} />
        </div>
      )}
    </div>
  );
}

// ─── HistoryRow ────────────────────────────────────────────────────────────────
function HistoryRow({ depense }: { depense: IDepense }) {
  return (
    <div className="p-5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-gray-500">{fmtDate(depense.dateDepense)}</span>
          </div>
          <h3 className="mb-1 font-semibold text-gray-900">{depense.libelle}</h3>
          <p className="mb-3 text-sm text-gray-500">{depense.categorie?.nomCategorie}</p>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-blue-600">{formatCFA(depense.montant)}</span>
            <StatusBadge statut={depense.statut} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {depense.description && (
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Justificatif</span>
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Détails</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, value, isText }: {
  icon: React.ReactNode; iconBg: string; label: string;
  value: number | string; isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="mb-2 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${iconBg}`}>{icon}</div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className={`font-bold text-gray-900 ${isText ? 'text-xl' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────────
export default function ValidationPageContent() {
  const [userRole, setUserRole]   = useState<Role>('comptable');
  const [activeTab, setActiveTab] = useState<SubTab>('validation');
  const [currentIdx, setCurrentIdx] = useState(0);

  // ── TODO: remplacer FAKE_DEPENSES par le vrai hook quand l'endpoint est prêt ──
  // const { data: depensesData, isLoading } = useDepensesListQuery({ page: 1, limit: 100 });
  // const allDepenses: IDepense[] = depensesData?.content ?? [];
  const isLoading = false;
  const modifierStatutMutation = useModifierStatutDepenseMutation();

  const [allDepenses, setAllDepenses] = useState<IDepense[]>(FAKE_DEPENSES);

  // ── Statistiques ─────────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => {
    const aDecaisser      = allDepenses.filter(d => isComptablePending(d.statut));
    const decaissesCeMois = allDepenses.filter(d => [S_DECAISSE, S_VUE_DGA].includes(d.statut) && new Date(d.dateDepense) >= startOfMonth);

    const enAttenteDGA  = allDepenses.filter(d => isDGAPending(d.statut));
    const viseesDGA     = allDepenses.filter(d => [S_VUE_DGA, S_VERIFIE_DGA, S_EN_ATTENTE_DG].includes(d.statut));
    const approuveesDG  = allDepenses.filter(d => d.statut === S_APPROUVE);

    const enAttenteDG   = allDepenses.filter(d => isDGPending(d.statut));
    const approuveesAll = allDepenses.filter(d => d.statut === S_APPROUVE);

    return {
      comptable: {
        total: allDepenses.length,
        aDecaisser: aDecaisser.length,
        decaisse: decaissesCeMois.reduce((s, d) => s + d.montant, 0),
      },
      dga: {
        enAttente:   enAttenteDGA.length,
        visees:      viseesDGA.length,
        approuveesDG: approuveesDG.length,
        montant:     enAttenteDGA.reduce((s, d) => s + d.montant, 0),
      },
      dg: {
        enAttente:  enAttenteDG.length,
        approuvees: approuveesAll.length,
        montant:    enAttenteDG.reduce((s, d) => s + d.montant, 0),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDepenses]);

  // ── Dépenses à afficher dans la ValidationCard ────────────────────────────────
  // On montre les pendantes EN PREMIER, puis les non-terminales pour que le
  // card ne soit jamais vide si des dépenses existent.
  const validationList = useMemo(() => {
    if (userRole === 'comptable') {
      const pending  = allDepenses.filter(d => isComptablePending(d.statut));
      const others   = allDepenses.filter(d => !isComptablePending(d.statut) && !STATUTS_TERMINAUX.includes(d.statut));
      return [...pending, ...others];
    }
    if (userRole === 'dga') {
      const pending  = allDepenses.filter(d => isDGAPending(d.statut));
      const others   = allDepenses.filter(d => !isDGAPending(d.statut) && !STATUTS_TERMINAUX.includes(d.statut));
      return [...pending, ...others];
    }
    if (userRole === 'dg') {
      const pending  = allDepenses.filter(d => isDGPending(d.statut));
      const others   = allDepenses.filter(d => !isDGPending(d.statut) && !STATUTS_TERMINAUX.includes(d.statut));
      return [...pending, ...others];
    }
    return allDepenses;
  }, [userRole, allDepenses]);

  // Nombre d'items vraiment en attente d'action (pour le badge du tab)
  const pendingCount = useMemo(() => {
    if (userRole === 'comptable') return allDepenses.filter(d => isComptablePending(d.statut)).length;
    if (userRole === 'dga')      return allDepenses.filter(d => isDGAPending(d.statut)).length;
    if (userRole === 'dg')       return allDepenses.filter(d => isDGPending(d.statut)).length;
    return 0;
  }, [userRole, allDepenses]);

  const safeIdx    = Math.min(currentIdx, Math.max(0, validationList.length - 1));
  const currentDep = validationList[safeIdx];

  // Est-ce que la dépense courante nécessite une action du rôle actif ?
  const canAct = !!currentDep && (
    (userRole === 'comptable' && isComptablePending(currentDep.statut)) ||
    (userRole === 'dga'       && isDGAPending(currentDep.statut))       ||
    (userRole === 'dg'        && isDGPending(currentDep.statut))
  );

  const acceptLabel: Record<Role, string> = { comptable: 'Décaisser', dga: 'Viser', dg: 'Approuver' };

  const handleAccept = (id: string) => {
    const newStatut = userRole === 'comptable' ? S_DECAISSE : userRole === 'dga' ? S_EN_ATTENTE_DG : S_APPROUVE;
    setAllDepenses(prev => prev.map(d => d.id === id ? { ...d, statut: newStatut } : d));
    // modifierStatutMutation.mutate({ id, statut: newStatut });
  };
  const handleReject = (id: string) => {
    const newStatut = userRole === 'dga' ? S_REJETE_DGA : S_REJETE_DG;
    setAllDepenses(prev => prev.map(d => d.id === id ? { ...d, statut: newStatut } : d));
    // modifierStatutMutation.mutate({ id, statut: newStatut });
  };
  const handleModifier = (id: string, updates: Partial<IDepense>) => {
    setAllDepenses(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    // TODO: appeler l'API de modification quand l'endpoint est prêt
  };

  // ── Stats renderer ───────────────────────────────────────────────────────────
  const renderStats = () => {
    if (userRole === 'comptable') return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={<FileText  className="h-5 w-5 text-blue-600"  />} iconBg="bg-blue-50"   label="Dépenses totales"  value={stats.comptable.total} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} iconBg="bg-green-50"  label="À décaisser"      value={stats.comptable.aDecaisser} />
        <StatCard icon={<Receipt   className="h-5 w-5 text-orange-600"/>} iconBg="bg-orange-50" label="Décaissé ce mois"  value={formatCFA(stats.comptable.decaisse)} isText />
      </div>
    );
    if (userRole === 'dga') return (
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={<Clock       className="h-5 w-5 text-yellow-600"/>} iconBg="bg-yellow-50" label="En attente"        value={stats.dga.enAttente} />
        <StatCard icon={<FileText    className="h-5 w-5 text-blue-600"  />} iconBg="bg-blue-50"   label="Visées"           value={stats.dga.visees} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600"/>} iconBg="bg-green-50"  label="Approuvées DG"    value={stats.dga.approuveesDG} />
        <StatCard icon={<TrendingUp  className="h-5 w-5 text-orange-600"/>} iconBg="bg-orange-50" label="Montant en attente" value={formatCFA(stats.dga.montant)} isText />
      </div>
    );
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={<Clock       className="h-5 w-5 text-yellow-600"/>} iconBg="bg-yellow-50" label="En attente DG"    value={stats.dg.enAttente} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-600"/>} iconBg="bg-green-50"  label="Approuvées"       value={stats.dg.approuvees} />
        <StatCard icon={<TrendingUp  className="h-5 w-5 text-orange-600"/>} iconBg="bg-orange-50" label="Montant en attente" value={formatCFA(stats.dg.montant)} isText />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-red-600">Finance &amp; Workflow</h1>
              <p className="mt-0.5 text-sm text-gray-500">Gestion des flux financiers</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative rounded-full p-2 hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="hidden items-center gap-2 text-sm text-gray-600 md:flex">
                <span className="font-medium">Comptable</span>
                <span className="text-gray-400">|</span>
                <span>Saisie des dépenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Role tabs ──────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-2">
          {(['comptable', 'dga', 'dg'] as Role[]).map((role) => {
            const active    = userRole === role;
            const dotColor  = role === 'dga' ? 'bg-orange-500' : role === 'dg' ? 'bg-blue-500' : null;
            const textColor = role === 'dga' ? 'text-orange-600' : role === 'dg' ? 'text-blue-600' : 'text-gray-600';
            const label     = role === 'comptable' ? 'Comptable' : role.toUpperCase();
            return (
              <button
                key={role}
                onClick={() => { setUserRole(role); setCurrentIdx(0); setActiveTab('validation'); }}
                className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-black text-white'
                    : `border border-gray-200 bg-white ${textColor} hover:bg-gray-100`
                }`}
              >
                {dotColor && !active && <span className={`h-2 w-2 rounded-full ${dotColor}`} />}
                {label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            {renderStats()}

            {/* ── Sub-tabs ─────────────────────────────────────────────────── */}
            <div className="rounded-t-xl border border-b-0 border-gray-200 bg-white">
              <div className="flex border-b border-gray-200">
                {(['validation', 'historique'] as SubTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors capitalize ${
                      activeTab === tab
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'validation' ? <Clock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {tab === 'validation' ? `Validation (${pendingCount})` : 'Historique'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Contenu ──────────────────────────────────────────────────── */}
            {activeTab === 'validation' ? (
              validationList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-b-xl border border-t-0 border-gray-200 bg-white py-16 text-gray-400">
                  <CheckCircle2 className="mb-2 h-10 w-10" />
                  <p className="text-sm">Aucune dépense dans le système</p>
                </div>
              ) : (
                <ValidationCard
                  depense={validationList[safeIdx]}
                  current={safeIdx}
                  total={validationList.length}
                  onPrev={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  onNext={() => setCurrentIdx(i => Math.min(validationList.length - 1, i + 1))}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onModifier={handleModifier}
                  acceptLabel={acceptLabel[userRole]}
                  canAct={canAct}
                  isDGA={userRole === 'dga'}
                  isPending={modifierStatutMutation.isPending}
                />
              )
            ) : (
              <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Receipt className="h-5 w-5 text-red-500" />
                    Historique de toutes les dépenses
                  </h2>
                </div>
                {allDepenses.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Aucune dépense enregistrée</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {allDepenses.map(d => <HistoryRow key={d.id} depense={d} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
