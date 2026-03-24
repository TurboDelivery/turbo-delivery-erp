import { IConge, CongeType, CongeStatut, DurationType } from '../types/conge.type';

export class CongeUtils {
  // Formater une date
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatDate:', error);
      return dateString;
    }
  }

  // Obtenir le libellé du type de congé
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

  // Obtenir le libellé du statut
  static getCongeStatutLabel(statut: CongeStatut): string {
    switch (statut) {
      case CongeStatut.EN_ATTENTE:
        return 'En attente';
      case CongeStatut.APPROUVEE:
        return 'Approuvée';
      case CongeStatut.EN_COURS:
        return 'En cours';
      case CongeStatut.TERMINE:
        return 'Terminé';
      case CongeStatut.REJETEE:
        return 'Rejetée';
      default:
        return statut;
    }
  }

  // Obtenir la couleur du statut
  static getCongeStatutColor(statut: CongeStatut): string {
    switch (statut) {
      case CongeStatut.EN_ATTENTE:
        return 'text-yellow-600 bg-yellow-50';
      case CongeStatut.APPROUVEE:
        return 'text-green-600 bg-green-50';
      case CongeStatut.EN_COURS:
        return 'text-blue-600 bg-blue-50';
      case CongeStatut.TERMINE:
        return 'text-gray-600 bg-gray-50';
      case CongeStatut.REJETEE:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  // Calculer la durée en jours
  static calculateDuration(startDate: string, endDate: string): number {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Erreur calculateDuration:', error);
      return 0;
    }
  }

  // Calculer les dates en fonction du type de durée
  static calculateDatesFromDuration(durationType: DurationType, startDate?: Date): { startDate: Date; endDate: Date } {
    const now = startDate || new Date();
    let startDateCalc = new Date(now);
    let endDateCalc = new Date(now);

    switch (durationType) {
      case DurationType.MOIS:
        // 30 jours à partir de maintenant
        endDateCalc = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        break;
        
      case DurationType.QUINZAINE:
        // 15 jours à partir de maintenant
        endDateCalc = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000));
        break;
        
      case DurationType.SEMAINE:
        // 7 jours à partir de maintenant
        endDateCalc = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        break;
        
      case DurationType.PERSONNALISE:
        // Ne change pas les dates
        break;
        
      default:
        break;
    }

    return {
      startDate: startDateCalc,
      endDate: endDateCalc
    };
  }

  // Vérifier si un congé est en cours
  static isCongeEnCours(conge: IConge): boolean {
    const now = new Date();
    const start = new Date(conge.startDate);
    const end = new Date(conge.endDate);
    return now >= start && now <= end && conge.statut === CongeStatut.APPROUVEE;
  }

  // Vérifier si un congé est à venir
  static isCongeAVenir(conge: IConge): boolean {
    const now = new Date();
    const start = new Date(conge.startDate);
    return now < start && conge.statut === CongeStatut.APPROUVEE;
  }

  // Obtenir les initiales de l'employé
  static getEmployeeInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Valider les dates
  static validateDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { isValid: false, error: 'Dates invalides' };
      }
      
      if (start >= end) {
        return { isValid: false, error: 'La date de fin doit être après la date de début' };
      }
      
      if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
        return { isValid: false, error: 'La date de début ne peut être dans le passé' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Erreur lors de la validation des dates' };
    }
  }

  // Filtrer les congés
  static filterConges(conges: IConge[], filters: {
    search?: string;
    type?: CongeType;
    statut?: CongeStatut;
  }): IConge[] {
    return conges.filter(conge => {
      // Filtre de recherche
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          conge.employeeName.toLowerCase().includes(searchTerm) ||
          conge.type.toLowerCase().includes(searchTerm) ||
          (conge.reason && conge.reason.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }
      
      // Filtre de type
      if (filters.type && conge.type !== filters.type) {
        return false;
      }
      
      // Filtre de statut
      if (filters.statut && conge.statut !== filters.statut) {
        return false;
      }
      
      return true;
    });
  }

  // Trier les congés
  static sortConges(conges: IConge[], sortBy: string, direction: 'asc' | 'desc' = 'desc'): IConge[] {
    return [...conges].sort((a, b) => {
      let aValue: any = a[sortBy as keyof IConge];
      let bValue: any = b[sortBy as keyof IConge];

      if (aValue === undefined || bValue === undefined) {
        return 0;
      }

      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Obtenir les types uniques
  static getUniqueTypes(conges: IConge[]): CongeType[] {
    const types = conges.map(conge => conge.type);
    return [...new Set(types)];
  }

  // Obtenir les statuts uniques
  static getUniqueStatuts(conges: IConge[]): CongeStatut[] {
    const statuts = conges.map(conge => conge.statut);
    return [...new Set(statuts)];
  }
}
