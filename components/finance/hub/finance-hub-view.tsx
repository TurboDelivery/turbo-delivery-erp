'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  useDisclosure,
} from '@heroui/react';
import { Banknote, CheckCircle2, Clock, Download, FileText, Pencil, Plus, ShieldCheck, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/confirm-modal';
import { useAbility } from '@/hooks/use-ability';
import { useSupprimerChargeFixeMutation } from '@/features/charges/queries/charge-fixe.mutation';
import { useSupprimerChargeVariableMutation } from '@/features/charges/queries/charge-variable.mutation';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import {
  FinanceStatut,
  IFinanceItem,
  fmtFcfa,
  generateFinancesPdf,
  generateFinancesXlsx,
  nextAction,
  steps,
  useFinancesHub,
} from '@/features/finances-hub';
import { buildMonthOptions, monthKeyToRange } from '@/features/charges/utils/month-filter.utils';
import AddChargeFixeModal from '@/features/charges/components/add-charge-fixe-modal';
import AddDepenseVariableModal from '@/features/charges/components/add-depense-variable-modal';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import RepartitionDepense from '@/features/depenses/components/repartition';
import { Can } from '@/components/auth/Can';

const NOW = new Date();
const CUR_MONTH_KEY = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;
// monthKey = "YYYY-MM" → date d'arrêté "YYYY-MM-DD"
const buildDate = (monthKey: string, jour: number) =>
  `${monthKey}-${String(jour).padStart(2, '0')}`;
// Jours réels du mois (28/29/30/31) — le curseur doit atteindre le vrai dernier
// jour, sinon le CA cumulé exclut le 31 sur les mois de 31 jours.
const daysInMonth = (monthKey: string) => {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

const STATUT: Record<FinanceStatut, { label: string; color: 'warning' | 'primary' | 'secondary' | 'success' | 'danger' }> = {
  pending: { label: 'En attente', color: 'warning' },
  vise: { label: 'Visé DGA', color: 'primary' },
  approuve: { label: 'Approuvé DG', color: 'secondary' },
  paye: { label: 'Payé', color: 'success' },
  rejete: { label: 'Rejeté', color: 'danger' },
};

function Stepper({ item, seuil }: { item: IFinanceItem; seuil: number }) {
  const st = steps(item, seuil);
  const cur = nextAction(item, seuil);
  const node = (done: boolean, current = false, skip = false) => (
    <span
      className={`flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border-2 ${
        done
          ? 'border-emerald-600 bg-emerald-600'
          : current
            ? 'border-primary ring-2 ring-primary/20'
            : skip
              ? 'border-dashed border-default-300 bg-default-100'
              : 'border-default-300 bg-white'
      }`}
    >
      {done && <span className="h-1 w-1 rounded-full bg-white" />}
    </span>
  );
  const line = (done: boolean) => <span className={`h-0.5 flex-1 ${done ? 'bg-emerald-600' : 'bg-default-200'}`} />;
  return (
    <div className="flex min-w-[140px] items-center" title="Saisie → Visa DGA → Accord DG → Payé">
      <span className="flex flex-1 items-center">{node(st.saisie)}{line(st.visa)}</span>
      <span className="flex flex-1 items-center">{node(st.visa, cur === 'vise')}{line(st.dg === true)}</span>
      <span className="flex flex-1 items-center">{node(st.dg === true, cur === 'approuve', st.dg === 'skip')}{line(st.paye)}</span>
      <span className="flex items-center">{node(st.paye, cur === 'pay')}</span>
    </div>
  );
}

const TABS = [
  { k: 'fixe', label: 'Charges fixes' },
  { k: 'variable', label: 'Dépenses variables' },
  { k: 'bap', label: 'Bon à payer' },
  { k: 'all', label: 'Toutes' },
] as const;

const PAGE_SIZE = 12;

export function FinanceHubView() {
  const [monthKey, setMonthKey] = useState(CUR_MONTH_KEY);
  const [jour, setJour] = useState(Math.min(NOW.getDate(), daysInMonth(CUR_MONTH_KEY)));
  const [dateArret, setDateArret] = useState(buildDate(CUR_MONTH_KEY, Math.min(NOW.getDate(), daysInMonth(CUR_MONTH_KEY))));
  const [tab, setTab] = useState<(typeof TABS)[number]['k']>('fixe');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  // Filtre catégorie partagé (nuqs) — même source que le graphique de répartition.
  const { filters: depenseFilters, handleCategoriesChange } = useDepenseDashboardFilters();
  const categorieFilter = depenseFilters.categoriesDepense ?? [];
  // Deep-link email : /finance/dashboard?depense=<id>&mois=<YYYY-MM> → cibler la dépense.
  const [focus, setFocus] = useState<{ depense?: string; mois?: string }>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusDoneRef = useRef(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setFocus({ depense: sp.get('depense') ?? undefined, mois: sp.get('mois') ?? undefined });
  }, []);
  const [isFixeModalOpen, setIsFixeModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  // Édition / suppression admin (quel que soit le statut visé/approuvé/décaissé).
  const [chargeFixeToEdit, setChargeFixeToEdit] = useState<IChargeFixe | null>(null);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);
  const [itemToDelete, setItemToDelete] = useState<IFinanceItem | null>(null);
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  // Seul l'admin/direction peut modifier ou supprimer une dépense déjà avancée
  // dans le workflow (le backend l'autorise via X-User-Roles, RBAC désactivé).
  const ability = useAbility();
  const isAdmin = ability.can('manage', 'all');
  const delFixe = useSupprimerChargeFixeMutation();
  const delVar = useSupprimerChargeVariableMutation();

  // Période = le mois sélectionné (debut/fin), appliquée CÔTÉ SERVEUR au tableau + au graphique.
  const { debut: periodeDebut, fin: periodeFin } = monthKeyToRange(monthKey);
  const { items, rawFixes, rawVariables, seuil, nbJours, renta, isLoading, busy, runAction } = useFinancesHub(
    dateArret,
    periodeDebut,
    periodeFin,
    categorieFilter,
  );

  // Édition : retrouve l'objet BRUT (IChargeFixe / IChargeVariable) à partir de la
  // ligne unifiée pour ré-alimenter le formulaire de la modale.
  const openEdit = (item: IFinanceItem) => {
    if (item.type === 'fixe') {
      const raw = rawFixes.find((c: any) => c.id === item.id);
      if (raw) setChargeFixeToEdit(raw as IChargeFixe);
    } else {
      const raw = rawVariables.find((c: any) => c.id === item.id);
      if (raw) setChargeVariableToEdit(raw as IChargeVariable);
    }
  };
  const confirmDelete = () => {
    if (!itemToDelete) return;
    const opts = { onSuccess: () => setItemToDelete(null) };
    if (itemToDelete.type === 'fixe') delFixe.mutate(itemToDelete.id, opts);
    else delVar.mutate(itemToDelete.id, opts);
  };
  // Dates (objets) mémoïsées pour le graphique — stables tant que le mois ne change pas.
  const chartDebut = useMemo(() => new Date(periodeDebut), [periodeDebut]);
  const chartFin = useMemo(() => new Date(periodeFin), [periodeFin]);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  // Changement de mois : on repositionne le curseur (jour courant si mois en
  // cours, sinon fin de mois) et on recalcule la date d'arrêté → la rentabilité
  // et le prorata reflètent le mois choisi (cf. RentabiliteService back : la
  // fenêtre est dérivée du mois de dateArret).
  const changeMonth = (key: string) => {
    if (!key) return;
    const dim = daysInMonth(key);
    const day = key === CUR_MONTH_KEY ? Math.min(NOW.getDate(), dim) : dim;
    setMonthKey(key);
    setJour(day);
    setDateArret(buildDate(key, day));
  };

  // Deep-link (mail) : applique le mois de la dépense ciblée, une seule fois.
  useEffect(() => {
    if (focus.mois) changeMonth(focus.mois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.mois]);

  // Deep-link : dès que les données du mois sont là, cible la dépense —
  // bon onglet + bonne page + scroll + surbrillance temporaire.
  useEffect(() => {
    if (!focus.depense || focusDoneRef.current || isLoading || items.length === 0) return;
    const it = items.find((i) => i.id === focus.depense);
    if (!it) return; // pas dans ce mois (on attend le refetch) ou déjà traitée
    focusDoneRef.current = true;
    const targetTab = (nextAction(it, seuil) === 'pay' ? 'bap' : it.type) as (typeof TABS)[number]['k'];
    const targetList = targetTab === 'bap'
      ? items.filter((i) => nextAction(i, seuil) === 'pay')
      : items.filter((i) => i.type === targetTab);
    const idx = targetList.findIndex((i) => i.id === it.id);
    setTab(targetTab);
    setPage(idx >= 0 ? Math.floor(idx / PAGE_SIZE) + 1 : 1);
    setHighlightId(it.id);
    setTimeout(() => document.getElementById(`dep-row-${it.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    setTimeout(() => setHighlightId(null), 4500);
  }, [focus.depense, isLoading, items, seuil]);

  const [payTargets, setPayTargets] = useState<IFinanceItem[]>([]);
  const [acc, setAcc] = useState('Caisse physique');
  const [moy, setMoy] = useState('Espèces');

  // KPI / prorata depuis l'API rentabilité
  const k = {
    ca: renta?.caCumule ?? 0,
    dep: renta?.totalCumule ?? 0,
    profit: renta?.profit ?? 0,
    marge: renta?.marge ?? true,
    coutJour: renta?.coutJournalier ?? 0,
    fixeProrata: renta?.fixeProrata ?? 0,
    variableReel: renta?.variableReel ?? 0,
    fixeMensuel: renta?.chargesFixesMensuelles ?? 0,
    jours: renta?.joursEcoules ?? jour,
    // Décomposition du CA + rubriques (réplique du tableau de bord principal)
    fraisLivraison: renta?.fraisLivraison ?? 0,
    commission: renta?.commission ?? 0,
    commissionFixe: renta?.commissionFixe ?? 0,
    commissionPct: renta?.commissionPourcentage ?? 0,
    revenuEncaisse: renta?.revenuEncaisse ?? 0,
    investissement: renta?.investissement ?? 0,
  };
  // Encours = CA pas encore encaissé (cf. tableau de bord principal).
  const encours = Math.max(0, k.ca - k.revenuEncaisse);
  const realDays = daysInMonth(monthKey); // borne du curseur = vrai dernier jour du mois
  // `items` est DÉJÀ filtré par mois + catégorie côté serveur (useFinancesHub).
  const bap = useMemo(() => items.filter((i) => nextAction(i, seuil) === 'pay'), [items, seuil]);
  const bapTotal = bap.reduce((s, i) => s + i.montant, 0);

  const list = useMemo(() => {
    if (tab === 'fixe') return items.filter((i) => i.type === 'fixe');
    if (tab === 'variable') return items.filter((i) => i.type === 'variable');
    if (tab === 'bap') return bap;
    return items;
  }, [items, tab, bap]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paged = useMemo(() => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [list, page]);

  const catKey = categorieFilter.join(',');
  // Changement d'onglet : on efface juste la sélection (la page reste, utile pour le deep-link).
  useEffect(() => { setSel(new Set()); }, [tab]);
  // Changement de filtre (catégorie / mois) : on repart page 1.
  useEffect(() => { setSel(new Set()); setPage(1); }, [catKey, monthKey]);
  useEffect(() => { if (page > pageCount) setPage(1); }, [page, pageCount]);

  // Sélection multiple (par id) + actions groupées sur la sélection de l'onglet.
  const selItems = useMemo(() => list.filter((i) => sel.has(i.id)), [list, sel]);
  const selByAction = (a: 'vise' | 'approuve' | 'pay') => selItems.filter((i) => nextAction(i, seuil) === a);
  const pageIds = paged.map((i) => i.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => sel.has(id));
  const togglePage = (v: boolean) =>
    setSel((p) => { const n = new Set(p); pageIds.forEach((id) => (v ? n.add(id) : n.delete(id))); return n; });
  const toggleOne = (id: string, v: boolean) =>
    setSel((p) => { const n = new Set(p); v ? n.add(id) : n.delete(id); return n; });

  const act = async (item: IFinanceItem, action: 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser', label: string, comment?: string) => {
    try {
      await runAction(item, action, comment);
      toast.success(`${label} · ${item.designation}`);
    } catch (e) {
      toast.error("Action impossible", { description: e instanceof Error ? e.message : 'Erreur' });
    }
  };
  const onReject = (item: IFinanceItem) =>
    act(item, item.statut === 'vise' ? 'rejeter-dg' : 'rejeter-dga', 'Rejeté');

  const openPay = (targets: IFinanceItem[]) => {
    if (!targets.length) return;
    setPayTargets(targets);
    onOpen();
  };
  const confirmPay = async () => {
    const comment = `${acc} · ${moy}`;
    for (const item of payTargets) {
      // eslint-disable-next-line no-await-in-loop
      await act(item, 'decaisser', 'Décaissé', comment);
    }
    onClose();
    setSel(new Set());
    toast.success(`Décaissé ${fmtFcfa(payTargets.reduce((s, i) => s + i.montant, 0))} depuis ${acc}`);
  };

  // Actions GROUPÉES sur la sélection : chaque bouton n'agit que sur le sous-ensemble
  // éligible (à viser / à approuver / à décaisser), quel que soit l'onglet.
  const bulkViser = async () => {
    for (const it of selByAction('vise')) {
      // eslint-disable-next-line no-await-in-loop
      await act(it, 'valider-dga', 'Visa DGA');
    }
    setSel(new Set());
  };
  const bulkApprouver = async () => {
    for (const it of selByAction('approuve')) {
      // eslint-disable-next-line no-await-in-loop
      await act(it, 'approuver-dg', 'Accord DG');
    }
    setSel(new Set());
  };
  const bulkDecaisser = () => openPay(selByAction('pay'));

  // Métadonnées d'en-tête communes aux exports (période + KPI du mois sélectionné).
  const exportMeta = () => ({
    monthLabel: monthOptions.find((m) => m.key === monthKey)?.label ?? monthKey,
    jours: k.jours,
    nbJours,
    ca: k.ca,
    dep: k.dep,
    profit: k.profit,
    marge: k.marge,
    bapTotal,
  });

  // Excel : vrai fichier .xlsx (Synthèse + Dépenses), montants en nombres sommables.
  const exportXlsx = () => {
    const data = generateFinancesXlsx(items, exportMeta());
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finances_${monthKey}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF : document HTML isolé imprimé dans une nouvelle fenêtre (pas la page entière).
  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Autorisez les pop-ups pour exporter en PDF.');
      return;
    }
    w.document.write(generateFinancesPdf(items, exportMeta()));
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  const countFor = (kk: string) =>
    kk === 'fixe' ? items.filter((i) => i.type === 'fixe').length
    : kk === 'variable' ? items.filter((i) => i.type === 'variable').length
    : kk === 'bap' ? bap.length : items.length;

  const pf = k.dep ? (k.fixeProrata / k.dep) * 100 : 50;

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-primary sm:text-xl">Finances — Dépenses, Décaissement & Rentabilité</h1>
          <p className="text-sm text-default-500">
            Module unifié : charges fixes & variables · validation en cascade · prorata temps réel · décaissement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Can I="create" a="ChargeFixe">
            <Button size="sm" color="danger" variant="flat" startContent={<Plus className="h-4 w-4" />} onPress={() => setIsFixeModalOpen(true)}>Charge fixe</Button>
          </Can>
          <Can I="create" a="ChargeVariable">
            <Button size="sm" color="danger" variant="flat" startContent={<Plus className="h-4 w-4" />} onPress={() => setIsVariableModalOpen(true)}>Dépense</Button>
          </Can>
          <Select
            aria-label="Période (mois)"
            size="sm"
            className="w-[170px]"
            selectedKeys={[monthKey]}
            onSelectionChange={(keys) => changeMonth(String(Array.from(keys as Set<string>)[0] ?? CUR_MONTH_KEY))}
          >
            {monthOptions.map((m) => (
              <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
            ))}
          </Select>
          <Button size="sm" variant="bordered" startContent={<Download className="h-4 w-4" />} onPress={exportXlsx}>Excel</Button>
          <Button size="sm" className="bg-foreground text-background" startContent={<FileText className="h-4 w-4" />} onPress={exportPdf}>PDF</Button>
        </div>
      </div>

      {/* Curseur date d'arrêté */}
      <Card shadow="none" className="border border-default-200">
        <CardBody className="gap-2">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-default-500">
            <span>Date d&apos;arrêté (jour du mois) — pilote le prorata</span>
            <span className="font-bold text-primary">J{jour} / {realDays}</span>
          </div>
          <input
            type="range" min={1} max={realDays} value={jour}
            onChange={(e) => setJour(Number(e.target.value))}
            onMouseUp={(e) => setDateArret(buildDate(monthKey, Number((e.target as HTMLInputElement).value)))}
            onTouchEnd={(e) => setDateArret(buildDate(monthKey, Number((e.target as HTMLInputElement).value)))}
            className="w-full accent-primary"
          />
        </CardBody>
      </Card>

      {/* CA cumulé + décomposition (réplique du tableau de bord principal) */}
      <Card shadow="none" className="border border-emerald-200 bg-emerald-50/40">
        <CardBody className="gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-default-500">CA cumulé</span>
            <div className="text-2xl font-bold tabular-nums text-emerald-700">{fmtFcfa(k.ca)}</div>
            <span className="text-xs text-default-400">Frais de livraison + commissions + entrées de caisse</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <CaPart label="Frais de livraison" value={fmtFcfa(k.fraisLivraison)} />
            <CaPart label="Commissions" value={fmtFcfa(k.commission)} hint={`Fixe ${fmtFcfa(k.commissionFixe)} · Pourcentage ${fmtFcfa(k.commissionPct)}`} />
          </div>
        </CardBody>
      </Card>

      {/* Rubriques (réplique du tableau de bord principal) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenus encaissés" value={fmtFcfa(k.revenuEncaisse)} icon={Banknote} />
        <Kpi label="Investissements" value={fmtFcfa(k.investissement)} icon={TrendingUp} />
        <Kpi label="Encours" value={fmtFcfa(encours)} sub="CA non encore encaissé" icon={Clock} />
        <Kpi label="Bon à payer" value={fmtFcfa(bapTotal)} sub={`${bap.length} dépense${bap.length > 1 ? 's' : ''} prête${bap.length > 1 ? 's' : ''}`} icon={Wallet} />
      </div>

      {/* Dépenses cumulées (détail) + marge */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="gap-1 p-4">
            <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-default-500">Dépenses cumulées<Banknote className="h-4 w-4 text-default-300" /></span>
            <span className="text-xl font-bold tabular-nums text-foreground">{fmtFcfa(k.dep)}</span>
            <span className="text-xs text-default-400">Charges fixes (prorata) {fmtFcfa(k.fixeProrata)} · Dépenses variables {fmtFcfa(k.variableReel)}</span>
          </CardBody>
        </Card>
        <Card shadow="none" className={`border ${k.marge ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <CardBody className="gap-1 p-4">
            <span className="text-[11px] font-medium uppercase tracking-wide text-default-500">{k.marge ? 'Marge actuelle' : 'Déficit actuel'}</span>
            <span className={`text-2xl font-bold tabular-nums ${k.marge ? 'text-emerald-700' : 'text-rose-700'}`}>{k.profit >= 0 ? '+' : ''}{fmtFcfa(k.profit)}</span>
            <span className={`mt-0.5 inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${k.marge ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{k.marge ? 'Rentable à ce stade' : 'En déficit à ce stade'}</span>
          </CardBody>
        </Card>
      </div>

      {/* Décomposition prorata */}
      <Card shadow="none" className="border border-default-200">
        <CardBody>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-default-700"><span className="h-2 w-2 rounded-full bg-primary" />Décomposition au prorata (à J{k.jours})</p>
          <div className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
            <Cell l="Coût journalier" v={fmtFcfa(k.coutJour)} s={`${fmtFcfa(k.fixeMensuel)} ÷ ${nbJours} j`} />
            <Cell l="Charges fixes prorata" v={fmtFcfa(k.fixeProrata)} s={`${fmtFcfa(k.coutJour)} × ${Math.min(k.jours, nbJours)} j`} />
            <Cell l="Dépenses variables réelles" v={fmtFcfa(k.variableReel)} s={`Jusqu'à J${k.jours}`} />
            <Cell l="Total dépenses" v={fmtFcfa(k.dep)} s="Prorata + variable" accent />
          </div>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-default-200">
            <div className="bg-primary" style={{ width: `${pf}%` }} />
            <div className="bg-foreground/80" style={{ width: `${100 - pf}%` }} />
          </div>
          <div className="mt-1.5 flex gap-4 text-xs text-default-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Charges fixes au prorata</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-foreground/80" />Dépenses variables réelles</span>
          </div>
        </CardBody>
      </Card>

      {/* Graphiques — section « Répartition des dépenses » complète (résumé récurrentes/
          non récurrentes + Top 10 catégories + évolution), déplacée depuis /finance/charges
          et câblée sur le mois + le filtre catégorie du dashboard. */}
      <RepartitionDepense debut={chartDebut} fin={chartFin} />

      {/* Filtre catégorie (à gauche) + onglets */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <CategoriesSelectFilter
            selectedCategories={categorieFilter}
            onCategoriesChange={handleCategoriesChange}
          />
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === t.k ? 'bg-content1 text-foreground shadow-sm ring-1 ring-default-200' : 'text-default-500 hover:text-foreground'}`}>
              {t.label}<span className={`rounded-full px-1.5 text-[11px] font-bold ${tab === t.k ? 'bg-primary/10 text-primary' : 'bg-default-100 text-default-500'}`}>{countFor(t.k)}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner color="primary" label="Chargement…" /></div>
      ) : (
        <Card shadow="none" className="border border-default-200">
          {/* Barre d'actions GROUPÉES sur la sélection (tous les onglets) */}
          {sel.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default-200 bg-primary/5 px-4 py-2.5">
              <span className="text-sm font-medium text-default-600">{sel.size} sélectionné{sel.size > 1 ? 's' : ''}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {selByAction('vise').length > 0 && (
                  <Button size="sm" variant="flat" color="primary" isLoading={busy} startContent={<ShieldCheck className="h-4 w-4" />} onPress={bulkViser}>
                    Viser ({selByAction('vise').length})
                  </Button>
                )}
                {selByAction('approuve').length > 0 && (
                  <Button size="sm" variant="flat" color="secondary" isLoading={busy} startContent={<CheckCircle2 className="h-4 w-4" />} onPress={bulkApprouver}>
                    Approuver ({selByAction('approuve').length})
                  </Button>
                )}
                {selByAction('pay').length > 0 && (
                  <Button size="sm" color="success" isLoading={busy} startContent={<Banknote className="h-4 w-4" />} onPress={bulkDecaisser}>
                    Décaisser ({selByAction('pay').length})
                  </Button>
                )}
                <Button size="sm" variant="light" onPress={() => setSel(new Set())}>Effacer</Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="bg-default-100 text-left text-[11px] uppercase tracking-wide text-default-600">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      size="sm"
                      isSelected={allPageSelected}
                      isIndeterminate={!allPageSelected && pageIds.some((id) => sel.has(id))}
                      onValueChange={togglePage}
                      aria-label="Tout sélectionner (page)"
                    />
                  </th>
                  <th className="px-3 py-2.5">Désignation</th>
                  <th className="px-3 py-2.5">{tab === 'bap' ? 'Type' : 'Catégorie'}</th>
                  <th className="px-3 py-2.5 text-right">Montant</th>
                  <th className="px-3 py-2.5">Échéance</th>
                  {tab !== 'bap' && <th className="px-3 py-2.5">Validation</th>}
                  <th className="px-3 py-2.5">Statut</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-10 text-center text-default-400">Aucune dépense ici.</td></tr>
                )}
                {paged.map((item) => {
                  const a = nextAction(item, seuil);
                  return (
                    <tr id={`dep-row-${item.id}`} key={`${item.type}-${item.id}`} className={`border-b border-default-100 hover:bg-default-50 ${highlightId === item.id ? 'bg-primary/10 ring-2 ring-inset ring-primary' : ''}`}>
                      <td className="px-3 py-2.5">
                        <Checkbox size="sm" isSelected={sel.has(item.id)} onValueChange={(v) => toggleOne(item.id, v)} aria-label={`Sélectionner ${item.designation}`} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-foreground">{item.designation}{item.dyn && <span className="ml-1.5 rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-teal-700">RH dyn.</span>}</div>
                        <div className="text-[11px] text-default-400">{item.src} · {item.justif ? 'Reçu' : 'sans pièce'}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        {tab === 'bap'
                          ? <Chip size="sm" variant="flat" color={item.type === 'fixe' ? 'default' : 'warning'} className="h-5">{item.type === 'fixe' ? 'Fixe' : 'Variable'}</Chip>
                          : <span className="text-default-500">{item.categorie}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmtFcfa(item.montant)}</td>
                      <td className="px-3 py-2.5 text-default-500">{item.echeance}</td>
                      {tab !== 'bap' && <td className="px-3 py-2.5"><Stepper item={item} seuil={seuil} /></td>}
                      <td className="px-3 py-2.5"><Chip size="sm" variant="flat" color={STATUT[item.statut].color} className="h-5">{STATUT[item.statut].label}</Chip></td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          {a === 'vise' && <Button size="sm" variant="flat" color="primary" isLoading={busy} onPress={() => act(item, 'valider-dga', 'Visa DGA')}>Viser</Button>}
                          {a === 'approuve' && <Button size="sm" variant="flat" color="secondary" isLoading={busy} onPress={() => act(item, 'approuver-dg', 'Accord DG')}>Approuver</Button>}
                          {a === 'pay' && <Button size="sm" color="success" isLoading={busy} onPress={() => openPay([item])}>Décaisser</Button>}
                          {a && item.statut !== 'paye' && <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => onReject(item)} title="Rejeter">✕</Button>}
                          {item.statut === 'paye' && <span className="text-[11px] text-default-400">Payé</span>}
                          {/* Admin : modifier / supprimer QUEL QUE SOIT le statut (hors charges système RH). */}
                          {isAdmin && !item.dyn && (
                            <>
                              <Button size="sm" variant="light" isIconOnly onPress={() => openEdit(item)} title="Modifier" aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => setItemToDelete(item)} title="Supprimer" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default-200 px-4 py-3">
            <span className="text-xs text-default-400">
              {list.length} ligne{list.length > 1 ? 's' : ''}
              {sel.size > 0 ? ` · ${sel.size} sélectionnée${sel.size > 1 ? 's' : ''}` : ''}
            </span>
            {pageCount > 1 && (
              <Pagination total={pageCount} page={page} onChange={setPage} size="sm" color="primary" showControls />
            )}
          </div>
        </Card>
      )}

      {/* Modal décaissement */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="bg-emerald-600 text-white">Décaisser {payTargets.length > 1 ? `la sélection (${payTargets.length})` : 'cette dépense'}</ModalHeader>
              <ModalBody className="gap-4 py-4">
                <div className="rounded-lg bg-default-100 p-3 text-sm">
                  {payTargets.length === 1
                    ? <>{payTargets[0]?.designation}<br />Montant : <b>{fmtFcfa(payTargets[0]?.montant)}</b></>
                    : <>{payTargets.length} dépenses · Total : <b>{fmtFcfa(payTargets.reduce((s, i) => s + i.montant, 0))}</b></>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Compte débité" size="sm" selectedKeys={[acc]} onSelectionChange={(ks) => setAcc(String(Array.from(ks)[0] ?? 'Caisse physique'))}>
                    <SelectItem key="Caisse physique" value="Caisse physique">Caisse physique</SelectItem>
                    <SelectItem key="Banque" value="Banque">Banque</SelectItem>
                  </Select>
                  <Select label="Moyen de paiement" size="sm" selectedKeys={[moy]} onSelectionChange={(ks) => setMoy(String(Array.from(ks)[0] ?? 'Espèces'))}>
                    {['Espèces', 'Chèque', 'Mobile Money', 'Virement'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </Select>
                </div>
                <p className="text-xs text-default-400">Le passage en « Payé » crée la sortie de trésorerie (compte + moyen tracés).</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Annuler</Button>
                <Button color="success" isLoading={busy} onPress={confirmPay}>Confirmer le décaissement</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modales de création (reprises de la page Charges, désormais pilotées ici) */}
      <AddChargeFixeModal isOpen={isFixeModalOpen} onClose={() => setIsFixeModalOpen(false)} chargeToEdit={null} />
      <AddDepenseVariableModal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} chargeToEdit={null} />

      {/* Modales d'ÉDITION admin (pré-remplies avec l'objet brut) */}
      <AddChargeFixeModal isOpen={!!chargeFixeToEdit} onClose={() => setChargeFixeToEdit(null)} chargeToEdit={chargeFixeToEdit} />
      <AddDepenseVariableModal isOpen={!!chargeVariableToEdit} onClose={() => setChargeVariableToEdit(null)} chargeToEdit={chargeVariableToEdit} />

      {/* Confirmation de SUPPRESSION admin (charge fixe ou dépense variable) */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Supprimer la dépense"
        isLoading={delFixe.isPending || delVar.isPending}
        actions={[
          { label: 'Annuler', variant: 'bordered', onPress: () => setItemToDelete(null) },
          { label: 'Supprimer', color: 'danger', onPress: confirmDelete },
        ]}
      >
        <p className="text-sm text-gray-700">
          Voulez-vous vraiment supprimer <span className="font-semibold">{itemToDelete?.designation}</span> ? Cette action est irréversible.
        </p>
      </ConfirmModal>
    </div>
  );
}

function CaPart({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white/70 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-default-500">{label}</div>
      <div className="text-sm font-bold tabular-nums text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-default-400">{hint}</div>}
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: typeof Wallet }) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="gap-1 p-4">
        <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-default-500">
          {label}{Icon && <Icon className="h-4 w-4 text-default-300" />}
        </span>
        <span className="text-xl font-bold tabular-nums text-foreground">{value}</span>
        {sub && <span className="text-xs text-default-400">{sub}</span>}
      </CardBody>
    </Card>
  );
}

function Cell({ l, v, s, accent }: { l: string; v: string; s: string; accent?: boolean }) {
  return (
    <div className="px-1">
      <div className="text-[11px] font-medium uppercase tracking-wide text-default-500">{l}</div>
      <div className={`mt-1 text-lg font-bold tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>{v}</div>
      <div className="text-[11px] text-default-400">{s}</div>
    </div>
  );
}
