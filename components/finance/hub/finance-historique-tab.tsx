'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chip, Pagination, Select, SelectItem, Spinner } from '@heroui/react';
import { CheckCircle2, PenLine, ShieldCheck, Wallet } from 'lucide-react';
import { fmtFcfa, unifiedStatut, FinanceStatut } from '@/features/finances-hub';
import {
  useActeursHistoriqueQuery,
  useHistoriqueChargesQuery,
} from '@/features/charges/queries/historique-charge.query';
import { IHistoriqueCharge } from '@/features/charges/types/historique-charge.type';

const PAGE_SIZE = 12;

const STATUT: Record<FinanceStatut, { label: string; color: 'warning' | 'primary' | 'secondary' | 'success' | 'danger' }> = {
  pending: { label: 'En attente', color: 'warning' },
  vise: { label: 'Visé DGA', color: 'primary' },
  approuve: { label: 'Approuvé DG', color: 'secondary' },
  paye: { label: 'Payé', color: 'success' },
  rejete: { label: 'Rejeté', color: 'danger' },
};

// ISO → « 07/04 · 14h30 » (ou « 07/04 » sans l'heure).
const fmtDate = (iso?: string | null, avecHeure = false): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const jour = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (!avecHeure) return jour;
  return `${jour} · ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Onglet « Mon historique » — actions menées sur les dépenses (création / visa DGA /
 * accord DG). L'utilisateur voit SES actions ; l'admin voit tout le monde et peut
 * filtrer par utilisateur. Le nom d'acteur = session.user.name (cf. useFinancesHub).
 */
export function FinanceHistoriqueTab({
  debut,
  fin,
  isAdmin,
  moi,
}: {
  debut?: string;
  fin?: string;
  isAdmin: boolean;
  moi: string;
}) {
  const [page, setPage] = useState(1);
  // Admin : '' = tout le monde ; sinon un acteur ciblé. Non-admin : toujours « moi ».
  const [utilisateur, setUtilisateur] = useState('');

  const par = isAdmin ? (utilisateur || undefined) : moi;

  // Liste des acteurs pour le filtre admin.
  const { data: acteurs } = useActeursHistoriqueQuery(isAdmin);

  const { data, isLoading, isFetching } = useHistoriqueChargesQuery({
    page: page - 1,
    size: PAGE_SIZE,
    debut,
    fin,
    par,
  });

  const rows: IHistoriqueCharge[] = (data as any)?.content ?? [];
  const totalPages = Math.max(1, (data as any)?.totalPages ?? 1);
  const totalElements = (data as any)?.totalElements ?? rows.length;

  // Retour page 1 quand le filtre change.
  useEffect(() => { setPage(1); }, [par, debut, fin]);
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  const options = useMemo(() => acteurs ?? [], [acteurs]);

  return (
    <div className="space-y-3">
      {/* Barre filtre (admin uniquement) */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label="Filtrer par utilisateur"
            size="sm"
            className="w-full sm:w-72"
            placeholder="Tous les utilisateurs"
            selectedKeys={utilisateur ? [utilisateur] : []}
            onSelectionChange={(keys) => setUtilisateur(String(Array.from(keys as Set<string>)[0] ?? ''))}
          >
            {[
              <SelectItem key="" value="">Tous les utilisateurs</SelectItem>,
              ...options.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              )),
            ]}
          </Select>
          <span className="text-xs text-default-400">
            {totalElements} action{totalElements > 1 ? 's' : ''}
          </span>
        </div>
      )}
      {!isAdmin && (
        <p className="text-sm text-default-500">
          Vos actions sur les dépenses (création, visa, accord) — <span className="font-semibold">{moi}</span>.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner color="primary" label="Chargement…" /></div>
      ) : (
        <div className="rounded-xl border border-default-200 bg-content1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="bg-default-100 text-left text-[11px] uppercase tracking-wide text-default-600">
                  <th className="px-3 py-2.5">Désignation</th>
                  <th className="px-3 py-2.5">Catégorie</th>
                  <th className="px-3 py-2.5 text-right">Montant</th>
                  <th className="px-3 py-2.5">Statut</th>
                  <th className="px-3 py-2.5">Actions menées</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-default-400">Aucune action sur cette période.</td></tr>
                )}
                {rows.map((r) => {
                  const st = unifiedStatut(r.statut);
                  return (
                    <tr key={`${r.type}-${r.id}`} className="border-b border-default-100 hover:bg-default-50">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-foreground">{r.designation}</div>
                        <div className="text-[11px] text-default-400">{r.type === 'FIXE' ? 'Charge fixe' : 'Dépense variable'}</div>
                      </td>
                      <td className="px-3 py-2.5 text-default-500">{r.categorie?.nomCategorie ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmtFcfa(r.montant)}</td>
                      <td className="px-3 py-2.5"><Chip size="sm" variant="flat" color={STATUT[st].color} className="h-5">{STATUT[st].label}</Chip></td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1 text-[12px]">
                          {r.creerPar && (
                            <span className="inline-flex items-center gap-1.5 text-default-600">
                              <PenLine className="h-3.5 w-3.5 text-default-400" />Créé par <b>{r.creerPar}</b>
                              {r.createdAt && <span className="text-default-400">· {fmtDate(r.createdAt, true)}</span>}
                            </span>
                          )}
                          {r.validePar && (
                            <span className="inline-flex items-center gap-1.5 text-primary-600">
                              <ShieldCheck className="h-3.5 w-3.5" />Visé par <b>{r.validePar}</b>
                              {r.dateValidationDGA && <span className="text-default-400">· {fmtDate(r.dateValidationDGA, true)}</span>}
                            </span>
                          )}
                          {r.approuvePar && (
                            <span className="inline-flex items-center gap-1.5 text-secondary-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />Approuvé par <b>{r.approuvePar}</b>
                              {r.dateApprobationDG && <span className="text-default-400">· {fmtDate(r.dateApprobationDG, true)}</span>}
                            </span>
                          )}
                          {r.dateDecaissement && (
                            <span className="inline-flex items-center gap-1.5 text-success-600">
                              <Wallet className="h-3.5 w-3.5" />Décaissé <span className="text-default-400">· {fmtDate(r.dateDecaissement, true)}</span>
                            </span>
                          )}
                          {!r.creerPar && !r.validePar && !r.approuvePar && !r.dateDecaissement && (
                            <span className="text-default-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default-200 px-4 py-3">
            <span className="text-xs text-default-400">
              {totalElements} action{totalElements > 1 ? 's' : ''}{isFetching ? ' · actualisation…' : ''}
            </span>
            {totalPages > 1 && (
              <Pagination total={totalPages} page={page} onChange={setPage} size="sm" color="primary" showControls />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
