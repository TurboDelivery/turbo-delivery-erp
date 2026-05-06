import { Check } from 'lucide-react';
import { IEtapeValidation } from '../types/visa-dga.type';

interface Props {
  etapes: IEtapeValidation[];
}

export default function VisaDgaChaineValidation({ etapes }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 w-[300px] shrink-0 self-start sticky top-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
        Chaîne de validation
      </p>
      <p className="text-[11px] text-gray-400 mb-5">Statuts traversés par le créneau</p>

      <ol className="flex flex-col gap-0">
        {etapes.map((etape, idx) => {
          const isLast = idx === etapes.length - 1;
          return (
            <li key={etape.numero} className="flex gap-3">
              {/* Indicateur + ligne verticale */}
              <div className="flex flex-col items-center">
                <StepIcon etape={etape} />
                {!isLast && (
                  <div
                    className={[
                      'w-px flex-1 mt-1',
                      etape.statut === 'done' ? 'bg-green-300' : 'bg-gray-200',
                    ].join(' ')}
                    style={{ minHeight: '20px' }}
                  />
                )}
              </div>

              {/* Contenu */}
              <div
                className={[
                  'pb-5 flex-1',
                  etape.statut === 'current'
                    ? 'rounded-lg bg-blue-50 px-3 py-2 -mt-1 -mr-1 mb-2'
                    : '',
                ].join(' ')}
              >
                <p
                  className={[
                    'text-sm font-semibold leading-tight',
                    etape.statut === 'done'
                      ? 'text-gray-700'
                      : etape.statut === 'current'
                        ? 'text-blue-700'
                        : 'text-gray-400',
                  ].join(' ')}
                >
                  {etape.label}
                </p>
                <p
                  className={[
                    'text-[11px] mt-0.5',
                    etape.statut === 'done'
                      ? 'text-gray-400'
                      : etape.statut === 'current'
                        ? 'text-blue-500 font-medium'
                        : 'text-gray-300',
                  ].join(' ')}
                >
                  {etape.agent}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepIcon({ etape }: { etape: IEtapeValidation }) {
  if (etape.statut === 'done') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </div>
    );
  }
  if (etape.statut === 'current') {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
        {etape.numero}
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 text-gray-300 text-xs font-bold">
      {etape.numero}
    </div>
  );
}
