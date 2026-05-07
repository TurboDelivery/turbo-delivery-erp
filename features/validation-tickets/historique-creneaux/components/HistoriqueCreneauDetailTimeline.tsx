import { AlertTriangle, CheckCircle2, CreditCard, FileText, Send, XCircle } from 'lucide-react';
import type { ICreneauTimelineEvent, TimelineEventType } from '../types/historique-creneaux.type';

const EVENT_CONFIG: Record<
  TimelineEventType,
  { icon: React.ElementType; iconClass: string; ringClass: string }
> = {
  creation:   { icon: FileText,      iconClass: 'text-gray-500',  ringClass: 'bg-gray-100' },
  soumission: { icon: Send,          iconClass: 'text-blue-500',  ringClass: 'bg-blue-50' },
  rejet:      { icon: XCircle,       iconClass: 'text-red-500',   ringClass: 'bg-red-50' },
  renvoi:     { icon: AlertTriangle, iconClass: 'text-amber-500', ringClass: 'bg-amber-50' },
  validation: { icon: CheckCircle2,  iconClass: 'text-green-500', ringClass: 'bg-green-50' },
  paiement:   { icon: CreditCard,    iconClass: 'text-green-500', ringClass: 'bg-green-50' },
};

interface Props {
  events: ICreneauTimelineEvent[];
}

export default function HistoriqueCreneauDetailTimeline({ events }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Timeline du Créneau</h2>
        <p className="text-xs text-red-500 mt-0.5">{events.length} événements enregistrés</p>
      </div>

      <div className="flex flex-col gap-4">
        {events.map((event) => {
          const cfg = EVENT_CONFIG[event.type];
          const Icon = cfg.icon;
          return (
            <div key={event.id} className="flex gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.ringClass}`}>
                <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{event.titre}</p>
                  <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{event.date}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-medium text-gray-700">{event.acteurNom}</span>
                  <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-px">{event.acteurRole}</span>
                </div>
                {event.commentaire && (
                  <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700 leading-relaxed">
                    {event.commentaire}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
