'use client';

import { useMemo, useState, useRef } from 'react';
import { ColumnDef, getCoreRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { AlertCircle, CheckCircle2, AlertTriangle, HelpCircle, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne, StatutLignePaiement, TypeLivreur } from '../types/grille-paiement.type';
import FichePaieButton from './FichePaieButton';

interface Props {
  lignes: IGrillePaiementLigne[];
  onRowClick: (ligne: IGrillePaiementLigne) => void;
  onUpdateWave: (turboyId: string, value: string) => void;
  onValiderLigne: (ligne: IGrillePaiementLigne) => void;
  /**
   * V54 (2026-05) — Demande d'override Comptable sur l'inclusion d'une
   * ligne dans le "Total à payer". {@code nextValue} = état cible que la
   * checkbox veut atteindre. La modale de justification est ouverte par
   * le parent ; on ne mute pas directement ici.
   */
  onToggleInclusion?: (ligne: IGrillePaiementLigne, nextValue: boolean) => void;
  /**
   * V54 (2026-05) — true si l'utilisateur courant est Comptable (les
   * autres rôles voient la colonne en lecture seule).
   */
  canEditInclusion?: boolean;
  waveManquants: number;
  creneauDebut: Date;
  creneauFin: Date;
  readOnly?: boolean;
}

/**
 * V54 (2026-05) — Détermine l'inclusion effective dans le totalAPayer en
 * appliquant la même règle que le backend : si {@code inclusDansPaie} est
 * explicitement set (override Comptable), on l'utilise ; sinon défaut basé
 * sur le type ({@code INDEPENDANT} → true, {@code JOURNALIER/SUPERVISEUR_LIVREUR}
 * → false, null → false aussi en attendant la catégorisation RH).
 */
function effectiveInclusion(ligne: IGrillePaiementLigne): boolean {
  if (ligne.inclusDansPaie !== null && ligne.inclusDansPaie !== undefined) {
    return ligne.inclusDansPaie;
  }
  return ligne.typeLivreur === 'INDEPENDANT';
}

function typeLivreurBadge(type: TypeLivreur | null | undefined) {
  switch (type) {
    case 'INDEPENDANT':
      return { label: 'Indépendant', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'JOURNALIER':
      return { label: 'Journalier', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'SUPERVISEUR_LIVREUR':
      return { label: 'Superviseur-livreur', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: 'À catégoriser', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}

function WaveReadOnlyCell({ ligne }: { ligne: IGrillePaiementLigne }) {
  return ligne.numeroWave ? (
    <span className="text-gray-700">{ligne.numeroWave}</span>
  ) : (
    <span className="italic text-gray-400">non renseigné</span>
  );
}

function WaveCell({ ligne, onUpdateWave }: { ligne: IGrillePaiementLigne; onUpdateWave: (turboyId: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ligne.numeroWave ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    onUpdateWave(ligne.turboy.id, draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(ligne.numeroWave ?? ''); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="N° Wave…"
        
      />
    );
  }

  return (
    <div
      className="group flex items-center gap-1.5 cursor-text"
      onClick={(e) => { e.stopPropagation(); setDraft(ligne.numeroWave ?? ''); setEditing(true); }}
    >
      {ligne.numeroWave ? (
        <span className="text-gray-700">{ligne.numeroWave}</span>
      ) : (
        <span className="italic text-gray-400">non renseigné</span>
      )}
      <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

/**
 * V54 (2026-05) — Bascule d'inclusion dans le « Total à payer ». Extraite pour
 * être réutilisée à l'identique par la colonne du tableau et la carte mobile
 * (même règle d'override Comptable, même rendu). Le clic ouvre la modale
 * justification dans le parent — pas de mutation directe ici.
 */
function InclusionToggle({
  ligne,
  canEditInclusion,
  readOnly,
  onToggleInclusion,
}: {
  ligne: IGrillePaiementLigne;
  canEditInclusion: boolean;
  readOnly: boolean;
  onToggleInclusion?: (ligne: IGrillePaiementLigne, nextValue: boolean) => void;
}) {
  const included = effectiveInclusion(ligne);
  const isOverride = ligne.inclusDansPaie !== null && ligne.inclusDansPaie !== undefined;
  const canEdit = canEditInclusion && !readOnly && onToggleInclusion;
  return (
    <label
      className={`relative inline-flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
      title={
        isOverride
          ? 'Override Comptable (cf. journal)'
          : included
            ? 'Inclus par défaut (Indépendant)'
            : 'Exclu par défaut (Journalier/Superviseur/À catégoriser)'
      }
    >
      <input
        type="checkbox"
        checked={included}
        disabled={!canEdit}
        onChange={() => onToggleInclusion?.(ligne, !included)}
        className="sr-only peer"
      />
      <div
        className={`w-9 h-5 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 ${
          included
            ? 'bg-emerald-500 peer-disabled:bg-emerald-300'
            : 'bg-gray-300 peer-disabled:bg-gray-200'
        } ${isOverride ? 'ring-2 ring-offset-1 ring-amber-300' : ''}`}
      />
    </label>
  );
}

/** Badge statut OK / Wave manquant — partagé colonne + carte mobile. */
function StatutBadge({ statut }: { statut?: StatutLignePaiement }) {
  return statut === 'OK' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
      <CheckCircle2 className="h-3 w-3" />
      OK
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
      <AlertTriangle className="h-3 w-3" />
      Wave
    </span>
  );
}

export default function GrillePaiementTable({
  lignes,
  onRowClick,
  onUpdateWave,
  onValiderLigne,
  onToggleInclusion,
  canEditInclusion = false,
  waveManquants,
  creneauDebut,
  creneauFin,
  readOnly = false,
}: Props) {
  const columns = useMemo<ColumnDef<IGrillePaiementLigne>[]>(
    () => [
      {
        id: 'turboy',
        header: 'Turboy',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold  text-gray-900">{row.original.turboy.nom}</p>
            <p className="text-[11px] text-gray-400">{row.original.turboy.code}</p>
          </div>
        ),
      },
      // V54 (2026-05) — Type de collaborateur. Badge couleur par type ;
      // "À catégoriser" en orange pour signaler une action RH requise.
      {
        id: 'typeLivreur',
        header: 'Type',
        cell: ({ row }) => {
          const badge = typeLivreurBadge(row.original.typeLivreur);
          const isACategoriser = !row.original.typeLivreur;
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
            >
              {isACategoriser && <HelpCircle className="h-3 w-3" />}
              {badge.label}
            </span>
          );
        },
      },
      // V54 (2026-05) — Inclusion dans le "Total à payer". Checkbox éditable
      // uniquement si Comptable + lot pas verrouillé ; sinon lecture seule.
      // Le clic ouvre la modale justification dans le parent — pas de mutation
      // directe ici pour éviter une bascule sans audit.
      {
        id: 'inclusion',
        header: () => <div className="w-full text-center">Inclus</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <InclusionToggle
              ligne={row.original}
              canEditInclusion={canEditInclusion}
              readOnly={readOnly}
              onToggleInclusion={onToggleInclusion}
            />
          </div>
        ),
      },
      {
        id: 'tickets',
        header: () => <div className="w-full text-right">Tickets</div>,
        cell: ({ row }) => <div className="text-right font-medium text-gray-700">{row.original.tickets}</div>,
      },
      {
        id: 'totalFraisLivraison',
        header: () => <div className="w-full text-right">Total realise</div>,
        cell: ({ row }) => <div className="text-right text-gray-700">{formatNumber(row.original.totalFraisLivraison ?? 0)}</div>,
      },
      {
        id: 'taux',
        header: () => <div className="w-full text-right">Taux</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-gray-700">{row.original.taux}%</span>
          </div>
        ),
      },
      {
        id: 'net',
        header: () => <div className="w-full text-right">Commission</div>,
        cell: ({ row }) => <div className="text-right font-semibold text-emerald-600">{formatNumber(row.original.netAPayer)}</div>,
      },
      {
        id: 'wave',
        header: 'N° Wave',
        cell: ({ row }) =>
          readOnly ? <WaveReadOnlyCell ligne={row.original} /> : <WaveCell ligne={row.original} onUpdateWave={onUpdateWave} />,
      },
      {
        id: 'statut',
        header: () => <div className="w-full text-center">Statut</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <StatutBadge statut={row.original.statut} />
          </div>
        ),
      },
      {
        id: 'action',
        header: '',
        cell: ({ row }) =>
          row.original.flagAttente && !readOnly ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 text-xs" onClick={() => onValiderLigne(row.original)}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Valider
              </Button>
            </div>
          ) : null,
      },
      {
        id: 'fiche',
        header: '',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <FichePaieButton
              turboyId={row.original.turboy.id}
              turboyNom={row.original.turboy.nom}
              creneauDebut={creneauDebut}
              creneauFin={creneauFin}
            />
          </div>
        ),
      },
      {
        id: 'arrow',
        header: '',
        cell: () => <span className="text-gray-300">›</span>,
      },
    ],
    [onUpdateWave, onValiderLigne, onToggleInclusion, canEditInclusion, creneauDebut, creneauFin, readOnly],
  );

  const table = useReactTable({
    data: lignes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto">
      {!readOnly && waveManquants > 0 && (
        <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {waveManquants} numéro{waveManquants > 1 ? 's' : ''} Wave manquant{waveManquants > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Le Créneau ne peut pas être soumis tant que toutes les lignes ne sont pas validées.
            </p>
          </div>
        </div>
      )}

      {/* Tableau — desktop uniquement (≥ md) */}
      <Table
        removeWrapper
        aria-label="Grille de paiement"
        classNames={{
          base: 'hidden md:block text-sm',
          th: 'text-[10px] font-semibold uppercase tracking-wider text-gray-600 bg-gray-300 border-b border-gray-100 px-4 py-3',
          td: 'px-4 py-3 border-b border-gray-50',
          tr: 'transition-colors',
        }}
      >
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="Aucune ligne">
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className={cn(
                'cursor-pointer hover:bg-gray-50',
                row.original.flagAttente && 'bg-amber-50 hover:bg-amber-100',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {/* Total row — désactivé temporairement
        <tfoot>
          <tr className="font-bold text-sm [&>td]:bg-red-600 [&>td]:text-white">
            <td className="px-4 py-3" />
            <td className="px-4 py-3 uppercase tracking-wide">Total</td>
            <td className="px-4 py-3 text-right">{totaux.tickets}</td>
            <td className="px-4 py-3 text-right">{formatNumber(totaux.brut)}</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right">
              {totaux.deductions !== 0 ? `−${formatNumber(Math.abs(totaux.deductions))}` : '–'}
            </td>
            <td className="px-4 py-3 text-right">{formatNumber(totaux.net)}</td>
            <td colSpan={3} />
          </tr>
        </tfoot>
        */}
      </Table>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {lignes.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucune ligne</p>
        ) : (
          lignes.map((ligne) => {
            const badge = typeLivreurBadge(ligne.typeLivreur);
            const isACategoriser = !ligne.typeLivreur;
            return (
              <div
                key={ligne.turboy.id}
                onClick={() => onRowClick(ligne)}
                className={cn(
                  'bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 cursor-pointer active:bg-gray-50',
                  ligne.flagAttente && 'border-amber-200 bg-amber-50 active:bg-amber-100',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{ligne.turboy.nom}</p>
                    <p className="text-[11px] text-gray-400">{ligne.turboy.code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatutBadge statut={ligne.statut} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Type</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                  >
                    {isACategoriser && <HelpCircle className="h-3 w-3" />}
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Tickets</span>
                  <span className="text-right text-sm font-medium text-gray-700">{ligne.tickets}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Total réalisé</span>
                  <span className="text-right text-sm text-gray-700">{formatNumber(ligne.totalFraisLivraison ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Taux</span>
                  <span className="text-right text-sm text-gray-700">{ligne.taux}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Commission</span>
                  <span className="text-right text-sm font-semibold text-emerald-600">{formatNumber(ligne.netAPayer)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Inclus</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <InclusionToggle
                      ligne={ligne}
                      canEditInclusion={canEditInclusion}
                      readOnly={readOnly}
                      onToggleInclusion={onToggleInclusion}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">N° Wave</span>
                  <div className="min-w-0 text-right" onClick={(e) => e.stopPropagation()}>
                    {readOnly ? (
                      <WaveReadOnlyCell ligne={ligne} />
                    ) : (
                      <WaveCell ligne={ligne} onUpdateWave={onUpdateWave} />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {ligne.flagAttente && !readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-full gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 text-xs"
                      onClick={() => onValiderLigne(ligne)}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Valider
                    </Button>
                  )}
                  <FichePaieButton
                    turboyId={ligne.turboy.id}
                    turboyNom={ligne.turboy.nom}
                    creneauDebut={creneauDebut}
                    creneauFin={creneauFin}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
