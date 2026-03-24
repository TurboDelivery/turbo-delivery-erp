import { IConge, CongeType, CongeStatut, ICongesParams } from '../types/conge.type';

export class CongeFilter {
  static applyFilters(conges: IConge[], params: ICongesParams): IConge[] {
    return conges.filter((conge) => {
      // Employee filter
      if (params.employeeId && conge.employeeId !== params.employeeId) {
        return false;
      }

      // Type filter
      if (params.type && conge.type !== params.type) {
        return false;
      }

      // Status filter
      if (params.statut && conge.statut !== params.statut) {
        return false;
      }

      // Date range filter
      if (params.startDate) {
        const congeStartDate = new Date(conge.startDate);
        const filterStartDate = new Date(params.startDate);
        if (congeStartDate < filterStartDate) {
          return false;
        }
      }

      if (params.endDate) {
        const congeEndDate = new Date(conge.endDate);
        const filterEndDate = new Date(params.endDate);
        if (congeEndDate > filterEndDate) {
          return false;
        }
      }

      return true;
    });
  }

  static searchConges(conges: IConge[], searchTerm: string): IConge[] {
    if (!searchTerm) {
      return conges;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return conges.filter((conge) => 
      conge.employeeName.toLowerCase().includes(lowerSearchTerm) ||
      conge.type.toLowerCase().includes(lowerSearchTerm) ||
      (conge.reason && conge.reason.toLowerCase().includes(lowerSearchTerm)) ||
      conge.statut.toLowerCase().includes(lowerSearchTerm)
    );
  }

  static sortConges(conges: IConge[], sortBy: keyof IConge, direction: 'asc' | 'desc' = 'desc'): IConge[] {
    return [...conges].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === undefined || bValue === undefined) {
        return 0;
      }

      let comparison = 0;
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } 
      // Handle number comparison
      else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      // Handle date comparison (check if they are date strings)
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          comparison = aDate.getTime() - bDate.getTime();
        } else {
          comparison = aValue.localeCompare(bValue);
        }
      }
      // Default fallback
      else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  static getUniqueTypes(conges: IConge[]): CongeType[] {
    const types = conges.map(conge => conge.type);
    return [...new Set(types)];
  }

  static getUniqueStatuts(conges: IConge[]): CongeStatut[] {
    const statuts = conges.map(conge => conge.statut);
    return [...new Set(statuts)];
  }

  static getUniqueEmployees(conges: IConge[]): Array<{ id: string; name: string }> {
    const employees = conges.map(conge => ({
      id: conge.employeeId,
      name: conge.employeeName
    }));
    
    // Remove duplicates
    const uniqueEmployees = employees.filter((emp, index, self) => 
      index === self.findIndex(e => e.id === emp.id)
    );
    
    return uniqueEmployees;
  }
}
