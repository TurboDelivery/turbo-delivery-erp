import { IConge, CongeType, DurationType } from '../types/conge.type';

export class CongeUtils {
  // Calculate duration between two dates
  static calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  // Calculate end date based on start date and duration type
  static calculateEndDate(startDate: string, durationType: DurationType): string {
    const start = new Date(startDate);
    let daysToAdd = 0;
    
    switch (durationType) {
      case DurationType.MOIS:
        daysToAdd = 30;
        break;
      case DurationType.QUINZAINE:
        daysToAdd = 15;
        break;
      case DurationType.SEMAINE:
        daysToAdd = 7;
        break;
      case DurationType.PERSONNALISE:
        // For custom duration, we'll need the end date to be provided
        return startDate;
      default:
        daysToAdd = 30;
    }
    
    const end = new Date(start);
    end.setDate(start.getDate() + daysToAdd - 1);
    return end.toISOString().split('T')[0];
  }

  // Format date for display
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Format date range for display
  static formatDateRange(startDate: string, endDate: string): string {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    return `${start} - ${end}`;
  }

  // Get duration type label
  static getDurationTypeLabel(durationType: DurationType): string {
    switch (durationType) {
      case DurationType.MOIS:
        return 'Mois (30j)';
      case DurationType.QUINZAINE:
        return 'Quinzaine (15j)';
      case DurationType.SEMAINE:
        return 'Semaine (7j)';
      case DurationType.PERSONNALISE:
        return 'Personnalisé';
      default:
        return 'Personnalisé';
    }
  }

  // Get conge type label
  static getCongeTypeLabel(type: CongeType): string {
    switch (type) {
      case CongeType.ANNUEL:
        return 'Congé annuel';
      case CongeType.MALADIE:
        return 'Congé maladie';
      case CongeType.SANS_SOLDE:
        return 'Congé sans solde';
      default:
        return type;
    }
  }

  // Get status color for UI
  static getStatusColor(statut: string): string {
    switch (statut) {
      case 'En cours':
        return 'orange';
      case 'Terminé':
        return 'green';
      case 'En attente':
        return 'yellow';
      case 'Approuvée':
        return 'blue';
      case 'Rejetée':
        return 'red';
      default:
        return 'gray';
    }
  }

  // Check if date is in the past
  static isDateInPast(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // Check if date is in the future
  static isDateInFuture(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  // Check if date is today
  static isDateToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Check if conge is currently active
  static isCongeActive(conge: IConge): boolean {
    const today = new Date();
    const start = new Date(conge.startDate);
    const end = new Date(conge.endDate);
    return today >= start && today <= end;
  }

  // Check if conge is upcoming
  static isCongeUpcoming(conge: IConge): boolean {
    const today = new Date();
    const start = new Date(conge.startDate);
    return start > today;
  }

  // Check if conge is completed
  static isCongeCompleted(conge: IConge): boolean {
    const today = new Date();
    const end = new Date(conge.endDate);
    return today > end;
  }

  // Calculate remaining days from leave balance
  static calculateRemainingBalance(totalBalance: number, usedDays: number): number {
    return Math.max(0, totalBalance - usedDays);
  }

  // Validate date range
  static validateDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Les dates de début et de fin sont requises' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (start > end) {
      return { isValid: false, error: 'La date de début doit être antérieure à la date de fin' };
    }

    if (start < today) {
      return { isValid: false, error: 'La date de début ne peut être dans le passé' };
    }

    return { isValid: true };
  }

  // Generate a summary string for conge
  static generateSummary(conge: IConge): string {
    const typeLabel = this.getCongeTypeLabel(conge.type);
    const dateRange = this.formatDateRange(conge.startDate, conge.endDate);
    const duration = conge.duration;
    
    return `${typeLabel} - ${dateRange} (${duration} jour${duration > 1 ? 's' : ''})`;
  }
}
