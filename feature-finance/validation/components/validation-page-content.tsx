'use client';

import { useMemo, useState } from 'react';
import { Bell, CheckCircle2, Clock, FileText, Receipt, Settings, User } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useActionChargeVariableMutation } from '@/feature-finance/charges/queries/charge-variable.mutation';
import { useActionChargeFixeMutation } from '@/feature-finance/charges/queries/charge-fixe.mutation';
import { useChargesVariablesQuery } from '@/feature-finance/charges/queries/charges-variables.query';
import { useChargesFixesQuery } from '@/feature-finance/charges/queries/charges-fixes.query';
import { IDepense } from '@/features/depenses/types/depense.type';
import {
  chargeFixeToDepense,
  chargeVariableToDepense,
  isComptablePending,
  isDGAPending,
  isDGPending,
  Role,
  ROLE_ACCEPT_ACTION,
  ROLE_REJECT_ACTION,
  S_APPROUVE,
  S_DECAISSE,
  S_EN_ATTENTE_DG,
  S_VERIFIE_DGA,
  S_VUE_DGA,
  STATUTS_TERMINAUX,
  SubTab,
} from './validation.constants';
import { ValidationCard } from './validation-card';
import { HistoryRow } from './history-row';
import { ValidationStats } from './validation-stats';

export default function ValidationPageContent() {
  const [userRole, setUserRole] = useState<Role>('comptable');
  const [activeTab, setActiveTab] = useState<SubTab>('validation');
  const [currentIdx, setCurrentIdx] = useState(0);

  const { data: chargesVariablesData, isLoading: isLoadingVariables } = useChargesVariablesQuery({ page: 0, size: 100 });
  const { data: chargesFixesData, isLoading: isLoadingFixes } = useChargesFixesQuery({ page: 0, size: 100 });

  const isLoading = isLoadingVariables || isLoadingFixes;

  const { data: session } = useSession();
  const actionVariableMutation = useActionChargeVariableMutation();
  const actionFixeMutation = useActionChargeFixeMutation();

  const allDepenses = useMemo<IDepense[]>(() => {
    const variables = (chargesVariablesData?.content ?? []).map(chargeVariableToDepense);
    const fixes = (chargesFixesData?.content ?? []).map(chargeFixeToDepense);
    return [...variables, ...fixes];
  }, [chargesVariablesData, chargesFixesData]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => {
    const aDecaisser = allDepenses.filter((d) => isComptablePending(d.statut));
    const decaissesCeMois = allDepenses.filter((d) => [S_DECAISSE, S_VUE_DGA].includes(d.statut) && new Date(d.dateDepense) >= startOfMonth);
    const enAttenteDGA = allDepenses.filter((d) => isDGAPending(d.statut));
    const viseesDGA = allDepenses.filter((d) => [S_VUE_DGA, S_VERIFIE_DGA, S_EN_ATTENTE_DG].includes(d.statut));
    const approuveesDG = allDepenses.filter((d) => d.statut === S_APPROUVE);
    const enAttenteDG = allDepenses.filter((d) => isDGPending(d.statut));
    const approuveesAll = allDepenses.filter((d) => d.statut === S_APPROUVE);
    return {
      comptable: {
        total: allDepenses.length,
        aDecaisser: aDecaisser.length,
        decaisse: decaissesCeMois.reduce((s, d) => s + d.montant, 0),
      },
      dga: {
        enAttente: enAttenteDGA.length,
        visees: viseesDGA.length,
        approuveesDG: approuveesDG.length,
        montant: enAttenteDGA.reduce((s, d) => s + d.montant, 0),
      },
      dg: {
        enAttente: enAttenteDG.length,
        approuvees: approuveesAll.length,
        montant: enAttenteDG.reduce((s, d) => s + d.montant, 0),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDepenses]);

  const validationList = useMemo(() => {
    if (userRole === 'comptable') {
      const pending = allDepenses.filter((d) => isComptablePending(d.statut));
      const others = allDepenses.filter((d) => !isComptablePending(d.statut) && !STATUTS_TERMINAUX.includes(d.statut));
      return [...pending, ...others];
    }
    if (userRole === 'dga') {
      const pending = allDepenses.filter((d) => isDGAPending(d.statut));
      const others = allDepenses.filter((d) => !isDGAPending(d.statut) && !STATUTS_TERMINAUX.includes(d.statut));
      return [...pending, ...others];
    }
    if (userRole === 'dg') {
      const pending = allDepenses.filter((d) => isDGPending(d.statut));
      const others = allDepenses.filter((d) => !isDGPending(d.statut) && !STATUTS_TERMINAUX.includes(d.statut));
      return [...pending, ...others];
    }
    return allDepenses;
  }, [userRole, allDepenses]);

  const pendingCount = useMemo(() => {
    if (userRole === 'comptable') return allDepenses.filter((d) => isComptablePending(d.statut)).length;
    if (userRole === 'dga') return allDepenses.filter((d) => isDGAPending(d.statut)).length;
    if (userRole === 'dg') return allDepenses.filter((d) => isDGPending(d.statut)).length;
    return 0;
  }, [userRole, allDepenses]);

  const safeIdx = Math.min(currentIdx, Math.max(0, validationList.length - 1));
  const currentDep = validationList[safeIdx];

  const canAct =
    !!currentDep &&
    ((userRole === 'comptable' && isComptablePending(currentDep.statut)) || (userRole === 'dga' && isDGAPending(currentDep.statut)) || (userRole === 'dg' && isDGPending(currentDep.statut)));

  const acceptLabel: Record<Role, string> = { comptable: 'DÃ©caisser', dga: 'Viser', dg: 'Approuver' };
  const roleLabel: Record<Role, string> = { comptable: 'Comptable', dga: 'DGA', dg: 'DG' };
  const roleDescription: Record<Role, string> = {
    comptable: 'Saisie des dépenses',
    dga: 'Validation des dépenses',
    dg: 'Approbation des dépenses',
  };
  const handleAccept = (id: string) => {
    const dto = { par: session?.user?.name ?? 'Inconnu', commentaire: '' };
    if (currentDep?.typeDepense === 'FIXE') {
      actionFixeMutation.mutate({ id, action: ROLE_ACCEPT_ACTION[userRole], dto });
    } else {
      actionVariableMutation.mutate({ id, action: ROLE_ACCEPT_ACTION[userRole], dto });
    }
  };

  const handleReject = (id: string) => {
    const dto = { par: session?.user?.name ?? 'Inconnu', commentaire: '' };
    if (currentDep?.typeDepense === 'FIXE') {
      actionFixeMutation.mutate({ id, action: ROLE_REJECT_ACTION[userRole], dto });
    } else {
      actionVariableMutation.mutate({ id, action: ROLE_REJECT_ACTION[userRole], dto });
    }
  };

  const handleModifier = (_id: string, _updates: Partial<IDepense>) => {
    // TODO: appeler l'API de modification de charge variable quand l'endpoint est prÃªt
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                {pendingCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
              <div className="hidden items-center gap-2 text-sm text-gray-600 md:flex">
                <span className="font-medium">{roleLabel[userRole]}</span>
                <span className="text-gray-400">|</span>
                <span>{roleDescription[userRole]}</span>
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
        <div className="mb-6 flex gap-2">
          {(['comptable', 'dga', 'dg'] as Role[]).map((role) => {
            const active = userRole === role;
            const dotColor = role === 'dga' ? 'bg-orange-500' : role === 'dg' ? 'bg-blue-500' : null;
            const textColor = role === 'dga' ? 'text-orange-600' : role === 'dg' ? 'text-blue-600' : 'text-gray-600';
            const label = role === 'comptable' ? 'Comptable' : role.toUpperCase();
            return (
              <button
                key={role}
                onClick={() => {
                  setUserRole(role);
                  setCurrentIdx(0);
                  setActiveTab('validation');
                }}
                className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  active ? 'bg-black text-white' : `border border-gray-200 bg-white ${textColor} hover:bg-gray-100`
                }`}
              >
                {dotColor && !active && <span className={`h-2 w-2 rounded-full ${dotColor}`} />}
                {label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            <ValidationStats role={userRole} stats={stats} />

            <div className="rounded-t-xl border border-b-0 border-gray-200 bg-white">
              <div className="flex border-b border-gray-200">
                {(['validation', 'historique'] as SubTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors capitalize ${
                      activeTab === tab ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'validation' ? <Clock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {tab === 'validation' ? `Validation (${pendingCount})` : 'Historique'}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'validation' ? (
              validationList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-b-xl border border-t-0 border-gray-200 bg-white py-16 text-gray-400">
                  <CheckCircle2 className="mb-2 h-10 w-10" />
                  <p className="text-sm">Aucune dÃ©pense dans le systÃ¨me</p>
                </div>
              ) : (
                <ValidationCard
                  depense={validationList[safeIdx]}
                  current={safeIdx}
                  total={validationList.length}
                  onPrev={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  onNext={() => setCurrentIdx((i) => Math.min(validationList.length - 1, i + 1))}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onModifier={handleModifier}
                  acceptLabel={acceptLabel[userRole]}
                  canAct={canAct}
                  isDGA={userRole === 'dga'}
                  isPending={actionVariableMutation.isPending || actionFixeMutation.isPending}
                />
              )
            ) : (
              <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Receipt className="h-5 w-5 text-red-500" />
                    Historique de toutes les dÃ©penses
                  </h2>
                </div>
                {allDepenses.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Aucune dÃ©pense enregistrÃ©e</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {allDepenses.map((d) => (
                      <HistoryRow key={d.id} depense={d} />
                    ))}
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
