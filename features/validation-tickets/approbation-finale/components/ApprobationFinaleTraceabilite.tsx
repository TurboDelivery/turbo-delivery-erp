import { Globe } from 'lucide-react';
import { ITraceabilite } from '../types/approbation-finale.type';
import { formatHorodatage } from '../utils/approbation-finale.utils';

export default function ApprobationFinaleTraceabilite({ traceabilite }: { traceabilite: ITraceabilite }) {
  return (
    <div className="flex items-center gap-5 rounded-lg border border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 text-gray-400" />
        <span className="font-semibold text-gray-600">Traçabilité</span>
      </div>
      <span>Action : <span className="font-medium text-gray-700">{traceabilite.action}</span></span>
      <span>Agent : <span className="font-medium text-gray-700">{traceabilite.agent}</span></span>
      <span>Rôle : <span className="font-medium text-gray-700">{traceabilite.role}</span></span>
      <span>
        Horodatage :{' '}
        <span className="font-medium text-gray-700">{formatHorodatage(traceabilite.horodatage)}</span>
      </span>
      <span>IP : <span className="font-medium text-gray-700">{traceabilite.ip}</span></span>
    </div>
  );
}
