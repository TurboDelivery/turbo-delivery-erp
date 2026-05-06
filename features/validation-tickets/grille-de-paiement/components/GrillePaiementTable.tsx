import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

interface Props {
  lignes: IGrillePaiementLigne[];
  checkedIds: Set<string>;
  allChecked: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onRowClick: (ligne: IGrillePaiementLigne) => void;
  totaux: { tickets: number; brut: number; deductions: number; net: number };
  waveManquants: number;
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

export default function GrillePaiementTable({
  lignes,
  checkedIds,
  allChecked,
  onToggle,
  onToggleAll,
  onRowClick,
  totaux,
  waveManquants,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200  bg-white overflow-hidden">
      {waveManquants > 0 && (
        <div className="flex items-start gap-3  border-b border-red-100 bg-red-50 px-5 py-3">
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

      <table className="w-full mt-8 text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <th className="px-4 py-3 text-left">
              <Checkbox
                checked={allChecked}
                onCheckedChange={onToggleAll}
                className="border-gray-300"
              />
            </th>
            <th className="px-4 py-3 text-left">Turboy</th>
            <th className="px-4 py-3 text-right">Tickets</th>
            <th className="px-4 py-3 text-right">Brut</th>
            <th className="px-4 py-3 text-right">Taux</th>
            <th className="px-4 py-3 text-right">Déductions</th>
            <th className="px-4 py-3 text-right">Net à payer</th>
            <th className="px-4 py-3 text-left">N° Wave</th>
            <th className="px-4 py-3 text-center">Statut</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr
              key={ligne.id}
              onClick={() => onRowClick(ligne)}
              className={cn(
                'border-b border-gray-50 transition-colors hover:bg-gray-50 cursor-pointer',
                checkedIds.has(ligne.id) && 'bg-gray-50/70',
              )}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={checkedIds.has(ligne.id)}
                  onCheckedChange={() => onToggle(ligne.id)}
                  className="border-gray-300"
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-900">{ligne.turboy.nom}</p>
                <p className="text-[11px] text-gray-400">{ligne.turboy.code}</p>
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-700">{ligne.tickets}</td>
              <td className="px-4 py-3 text-right text-gray-700">{formatNumber(ligne.brut)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-gray-700">{ligne.taux}%</span>
                  {ligne.tauxManuel && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                      C
                    </span>
                  )}
                  {ligne.bonus && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      BONUS
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {ligne.deductions !== 0 ? (
                  <span className="text-red-500">−{formatNumber(Math.abs(ligne.deductions))}</span>
                ) : (
                  <span className="text-gray-300">–</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                {formatNumber(ligne.netAPayer)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {ligne.numeroWave ?? (
                  <span className="italic text-gray-400">non renseigné</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {ligne.statut === 'OK' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    Wave
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-300">›</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-sm font-bold [&>td]:bg-red-600 [&>td]:text-white">
            <td className="px-4 py-3" />
            <td className="px-4 py-3 uppercase tracking-wide ">Total</td>
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
      </table>
    </div>
  );
}
