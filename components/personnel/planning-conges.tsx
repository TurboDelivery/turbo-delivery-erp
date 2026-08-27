'use client';

import { useState } from 'react';
import { useEligibleEmployeeQuery, useCongesQuery } from '@/features/conge/queries/conge.query';
import { IEmployee } from '@/features/personnel/types/types';
import { IConge } from '@/features/conge/types/conge.type';

export default function PlanningConges() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Navigation entre les mois
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Obtenir le nombre de jours dans le mois
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);

  // Récupérer les données réelles
  const { data: employeesData, isLoading: employeesLoading } = useEligibleEmployeeQuery({ limit: 1000 });
  const { data: congesData, isLoading: congesLoading } = useCongesQuery({ limit: 1000 });

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const conges = congesData?.content || [];
  conges.forEach((conge: IConge, index: number) => {
    console.log(
      `  ${index + 1}. ${conge.employeeName} - statut: "${conge.statut}" - type: "${conge.type}" - EN_COURS: ${(conge.statut as string) === 'EN_COURS'} - APPROUVEE: ${(conge.statut as string) === 'APPROUVEE'}`,
    );
  });

  // Extraire uniquement les employés qui sont en congé
  const employeesOnLeave = conges
    .filter((conge: IConge) => {
      return (conge.statut as string) === 'EN_COURS' || (conge.statut as string) === 'APPROUVEE';
    })
    .map(
      (conge: IConge) =>
        ({
          id: conge.employeeId,
          name: conge.employeeName,
          department: 'Non spécifié',
          email: '',
          position: '',
        }) as IEmployee,
    );

  const eligibleEmployees = employeesOnLeave.filter((employee: IEmployee, index: number, self: IEmployee[]) => index === self.findIndex((e: IEmployee) => e.id === employee.id));

  // Grouper les employés par département
  const employeesByDepartment = eligibleEmployees.reduce(
    (acc: Record<string, IEmployee[]>, employee: IEmployee) => {
      const dept = employee.department || 'Non spécifié';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(employee);
      return acc;},

    {} as Record<string, IEmployee[]>,
  );

  // Fonction pour vérifier si un employé est en congé un jour donné
  const isOnLeave = (employee: IEmployee, day: number) => {
    console.log(`🔍 Checking leave for ${employee.name} (ID: ${employee.id}) on day ${day}`);

    const employeeConges = conges.filter((conge: IConge) => {
      console.log(`  - Comparing with conge: ${conge.employeeName} (ID: ${conge.employeeId}) - Match: ${conge.employeeId === employee.id}`);
      return conge.employeeId === employee.id && ((conge.statut as string) === 'EN_COURS' || (conge.statut as string) === 'APPROUVEE');
    });

    console.log(`  - Found ${employeeConges.length} matching conges for ${employee.name}`);
    return employeeConges.some((conge: IConge) => {
      const startDate = new Date(conge.startDate);
      const endDate = new Date(conge.endDate);
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      console.log(
        `  - Checking date range: ${currentDate.toDateString()} between ${startDate.toDateString()} and ${endDate.toDateString()} - In range: ${currentDate >= startDate && currentDate <= endDate}`,
);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  // Fonction pour obtenir le type de congé
  // Note: Comparaison avec les chaînes 'EN_COURS' et 'APPROUVEE' (pas l'énumération)
  const getLeaveType = (employee: IEmployee, day: number) => {
    const employeeConges = conges.filter((conge: IConge) => {
      return conge.employeeId === employee.id && ((conge.statut as string) === 'EN_COURS' || (conge.statut as string) === 'APPROUVEE');
    });
    for (const conge of employeeConges) {
      const startDate = new Date(conge.startDate);
      const endDate = new Date(conge.endDate);
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

      if (currentDate >= startDate && currentDate <= endDate) {
        return conge.type;
      }
    }
    return null;
  };

  // Couleur selon le type de congé
  const getLeaveColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'annuel':
        return 'bg-red-400';
      case 'maladie':
        return 'bg-orange-400';
      case 'maternite':
      case 'maternité':
        return 'bg-blue-400';
      case 'accident':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (employeesLoading || congesLoading) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="text-center py-8">
          <div className="text-gray-500">Chargement du planning...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="bg-white rounded-xl shadow p-6">
        {/* Titre et contrôles */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Planning des Congés</h2>
          <div className="flex items-center gap-4">
            {/* Navigation entre les mois */}
            <div className="flex items-center gap-2">
              <button onClick={previousMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Mois précédent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-[150px] text-center">{currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Mois suivant">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Header jours */}
        <div className="flex text-xs text-gray-400 mb-2 overflow-x-auto scrollbar-hide">
          <div className="w-[200px] font-medium text-gray-500 flex-shrink-0">Employé</div>
          <div className="flex flex-1">
            {days.map((day) => {
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <div key={day} className={`w-8 text-center flex-shrink-0 ${isToday ? 'bg-red-100 text-red-500 rounded font-bold' : ''}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Afficher les employés par département */}
        {(Object.entries(employeesByDepartment) as [string, IEmployee[]][]).map(([department, deptEmployees]) => (
          <div key={department}>
            {/* Section département */}
            <div className="text-xs text-gray-400 font-semibold mb-1 mt-4">{department.toUpperCase()}</div>

            {/* Lignes des employés */}
            {deptEmployees.map((employee: IEmployee) => (
              <div key={employee.id} className="flex items-center mb-2 overflow-x-auto scrollbar-hide">
                <div className="w-[200px] text-sm text-gray-600 truncate flex-shrink-0" title={employee.name}>
                  {employee.name}
                </div>
                <div className="flex flex-1">
                  {days.map((day) => (
                    <div key={day} className="w-8 h-6 flex items-center flex-shrink-0">
                      {isOnLeave(employee, day) && <div className={`w-full h-3 rounded ${getLeaveColor(getLeaveType(employee, day) || '')}`} title={`${getLeaveType(employee, day)} - Jour ${day}`} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Légende */}
        <div className="flex gap-6 mt-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-400 rounded-full"></span>
            Congé annuel
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
            Congé maladie
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
            Congé maternité
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            Congé accident de travail
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              {/* Affichait `congesData.content.length`, soit un nombre de CONGES
                  sous le libelle « Total employes » : deux erreurs a la fois, la
                  mauvaise grandeur et le plafond de la page. */}
              <div className="text-2xl font-bold text-gray-800">{employees.length}</div>
              <div className="text-xs text-gray-500">Total employés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {conges.filter((c: IConge) => c.type?.toLowerCase().includes('annuel') && ((c.statut as string) === 'APPROUVEE' || (c.statut as string) === 'EN_COURS')).length}
              </div>
              <div className="text-xs text-gray-500">Congés annuels</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {conges.filter((c: IConge) => c.type?.toLowerCase().includes('maladie') && ((c.statut as string) === 'APPROUVEE' || (c.statut as string) === 'EN_COURS')).length}
              </div>
              <div className="text-xs text-gray-500">Congés maladie</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {
                  conges.filter(
                    (c: IConge) =>
                      (c.type?.toLowerCase().includes('maternite') || c.type?.toLowerCase().includes('maternité')) && ((c.statut as string) === 'APPROUVEE' || (c.statut as string) === 'EN_COURS'),
                  ).length
                }
              </div>
              <div className="text-xs text-gray-500">Congés maternité</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {conges.filter((c: IConge) => c.type?.toLowerCase().includes('sans_solde') && ((c.statut as string) === 'APPROUVEE' || (c.statut as string) === 'EN_COURS')).length}
              </div>
              <div className="text-xs text-gray-500">Congés sans solde</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
