'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Banknote, CheckCircle2, ListChecks, RefreshCw, Search, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import EtatErreur from '@/components/commons/EtatErreur';
import { normalizeRole } from '@/lib/casl/ability';
import { formatMontant } from '@/utils/format.utils';

import {
  useApprouverLotRegulMutation,
  useGenererLotRegulMutation,
  useRecapRegularisationQuery,
  useSoumettreLotRegulMutation,
  useViserLotRegulMutation,
} from '../queries/regularisation-paiement.query';

const fmt = (n?: number | null) =>
  n === null || n === undefined ? '—' : `${formatMontant(Math.round(n))}`;

const LOT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'Lot créé',
  CALCUL_EN_COURS: 'Prêt à soumettre',
  SOUMIS_DGA: 'Soumis — attente visa DGA',
  VALIDE_DGA: 'Visé — attente approbation DG',
  APPROUVE_DG: 'Approuvé — paiement lancé',
  PAIEMENT_EN_COURS: 'Paiements Wave en cours',
  REJETE: 'Rejeté — re-générer pour corriger',
  SOLDE: 'Payé (soldé)',
};

/**
 * Point PAR LIVREUR des tickets régularisés (saisis après clôture puis approuvés)
 * + paiement par lot REGULARISATION suivant la chaîne CONTRÔLÉE existante :
 * génération (net = brut × 0,6) → soumission Comptable → visa DGA → approbation DG
 * (déclenche les virements Wave). ON NE PAIE QUE LES INDÉPENDANTS (défaut).
 */
export function RegularisationRecapPanel() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const role = normalizeRole(
    (session?.user?.role as unknown as string | { libelle?: string } | null | undefined) ?? null,
  );
  const peutViser = role === 'DGA' || role === 'DG';
  const peutApprouver = role === 'DG';

  const { data: creneauList } = useCreneauxListQuery();
  const creneaux = useMemo(() => creneauList?.content ?? [], [creneauList]);
  const [creneauId, setCreneauId] = useState<string | undefined>(undefined);
  // Défaut : le créneau clôturé le plus récent (la régularisation concerne les créneaux passés).
  useEffect(() => {
    if (creneauId || creneaux.length === 0) return;
    const clos = creneaux.find((c: any) => String(c.statut ?? '').startsWith('VERROUILLE') || c.statut === 'SOLDE');
    setCreneauId((clos ?? creneaux[0])?.id);
  }, [creneaux, creneauId]);

  const { data: recap, isLoading, isFetching, isError, refetch } =
    useRecapRegularisationQuery(creneauId);
  const generer = useGenererLotRegulMutation();
  const soumettre = useSoumettreLotRegulMutation();
  const viser = useViserLotRegulMutation();
  const approuver = useApprouverLotRegulMutation();
  const busy = generer.isPending || soumettre.isPending || viser.isPending || approuver.isPending;

  const [filtre, setFiltre] = useState('');
  const lignes = useMemo(() => {
    const all = recap?.lignes ?? [];
    const q = filtre.trim().toLowerCase();
    return q ? all.filter((l) => l.nom.toLowerCase().includes(q)) : all;
  }, [recap, filtre]);

  const statut = recap?.lotStatut ?? null;
  const lotId = recap?.lotId ?? null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Banknote className="h-4 w-4 text-emerald-600" />
            Point par livreur — paiement des régularisations
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Tickets approuvés en retard · net = brut × 0,6 · seuls les indépendants sont payés ·
            chaîne Comptable → DGA → DG → Wave.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={creneauId}
            onSelectCreneau={(id: string | undefined) => setCreneauId(id)}
            disabled={busy}
          />
        </div>
      </header>

      {!creneauId || isLoading ? (
        <p className="px-5 py-10 text-center text-sm text-gray-400">Chargement…</p>
      ) : isError ? (
        /* Un echec de chargement ne doit pas se lire comme « rien a payer » : le
           comptable en concluait qu'aucune regularisation n'attendait de virement. */
        <EtatErreur
          quoi="les régularisations à payer"
          onReessayer={() => refetch()}
          enCours={isFetching}
        />
      ) : (recap?.lignes.length ?? 0) === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-400">
          Aucun ticket régularisé en attente de paiement sur ce créneau.
        </p>
      ) : (
        <>
          {/* Filtre + statut du lot */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={filtre}
                onChange={(e) => setFiltre(e.target.value)}
                placeholder="Filtrer par livreur…"
                className="w-48 bg-transparent text-sm focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {statut && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {LOT_LABEL[statut] ?? statut}
                </span>
              )}
              {(recap?.ticketsHorsLot ?? 0) > 0 && lotId && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {recap?.ticketsHorsLot} nouveau(x) ticket(s) à intégrer
                </span>
              )}
              {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-300" />}
            </div>
          </div>

          {/* Tableau par livreur */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-2.5">Livreur</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5 text-right">Tickets</th>
                  <th className="px-3 py-2.5 text-right">Brut</th>
                  <th className="px-3 py-2.5 text-right">Net (× 0,6)</th>
                  <th className="px-3 py-2.5">N° Wave</th>
                  <th className="px-3 py-2.5">Payé ?</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.turboyId} className="border-b border-gray-100">
                    <td className="px-5 py-2.5 font-medium text-gray-800">{l.nom}</td>
                    <td className="px-3 py-2.5 text-gray-500">{l.typeLivreur ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{l.nbTickets}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(l.brut)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                      {fmt(l.net)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {l.numeroWave || <span className="text-amber-600">manquant</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {l.inclusDansPaie ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Inclus
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                          Non payé
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total + chaîne d'actions */}
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Total à payer (indépendants) :{' '}
              <span className="text-base font-bold text-emerald-700">{fmt(recap?.totalAPayer)}</span>
              <span className="ml-2 text-xs text-gray-400">{recap?.nbTickets} ticket(s)</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(!lotId || statut === 'REJETE' || (recap?.ticketsHorsLot ?? 0) > 0) && (
                <Button
                  onClick={() => creneauId && generer.mutate({ creneauId, userId })}
                  disabled={busy || !userId}
                  variant="outline"
                  className="flex items-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                >
                  <ListChecks className="h-4 w-4" />
                  {generer.isPending
                    ? 'Génération…'
                    : statut === 'REJETE'
                      ? 'Re-générer le lot'
                      : lotId
                        ? 'Actualiser le lot'
                        : 'Générer le lot de paiement'}
                </Button>
              )}
              {lotId && (statut === 'CALCUL_EN_COURS' || statut === 'EN_ATTENTE') && (
                <Button
                  onClick={() => creneauId && soumettre.mutate({ lotId, userId, creneauId })}
                  disabled={busy || !userId}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  {soumettre.isPending ? 'Envoi…' : 'Soumettre au DGA'}
                </Button>
              )}
              {lotId && statut === 'SOUMIS_DGA' && peutViser && (
                <Button
                  onClick={() => creneauId && viser.mutate({ lotId, userId, creneauId })}
                  disabled={busy || !userId}
                  className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {viser.isPending ? 'Visa…' : 'Viser (DGA)'}
                </Button>
              )}
              {lotId && statut === 'VALIDE_DGA' && peutApprouver && (
                <Button
                  onClick={() => creneauId && approuver.mutate({ lotId, userId, creneauId })}
                  disabled={busy || !userId}
                  className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {approuver.isPending ? 'Approbation…' : 'Approuver → paiement Wave'}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
