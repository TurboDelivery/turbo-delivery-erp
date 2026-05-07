import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ISignataire } from '../types/approbation-finale.type';

function formatHorodatageShort(iso: string) {
  return format(new Date(iso), 'd MMM HH:mm', { locale: fr });
}

interface Props {
  signataires: ISignataire[];
}

export default function ApprobationFinaleSignatures({ signataires }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 w-[300px] shrink-0 self-start sticky top-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
        Chaîne de signatures
      </p>
      <ol className="flex flex-col gap-4">
        {signataires.map((s, idx) => (
          <li key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={[
                  'h-2.5 w-2.5 rounded-full shrink-0',
                  s.statut === 'done' ? 'bg-green-500' : 'bg-blue-500',
                ].join(' ')}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">{s.nom}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.role}</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
              {formatHorodatageShort(s.horodatage)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
