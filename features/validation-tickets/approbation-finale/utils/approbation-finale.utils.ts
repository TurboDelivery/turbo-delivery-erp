import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatPeriode(debut: string, fin: string): string {
  return `${format(new Date(debut), 'd MMMM', { locale: fr })} → ${format(new Date(fin), 'd MMMM yyyy', { locale: fr })}`;
}

export function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return `${format(d, 'd MMMM yyyy', { locale: fr })} — ${format(d, "HH'h'mm")}`;
}

export function formatHorodatage(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: fr });
}
