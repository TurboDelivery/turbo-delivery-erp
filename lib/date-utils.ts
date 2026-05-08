import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
};

export const toDateInputValue = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateInput = (): string => {
  return toDateInputValue(new Date());
};

export const formatDateFr = (value: unknown, dateFormat = 'dd MMM yyyy'): string => {
  const date = toDate(value);
  return date ? format(date, dateFormat, { locale: fr }) : '-';
};

export const computeEndDateFromDays = (dateDebut: unknown, days: unknown): string => {
  const startDate = toDate(dateDebut);
  const daysNumber = typeof days === 'number' ? days : Number(days);

  if (!startDate || Number.isNaN(daysNumber) || daysNumber <= 0) {
    return '';
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysNumber - 1);
  return toDateInputValue(endDate);
};

export const calculateDaysInclusive = (dateDebut: string, dateFin: string): number => {
  const start = new Date(`${dateDebut}T00:00:00`);
  const end = new Date(`${dateFin}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
};
