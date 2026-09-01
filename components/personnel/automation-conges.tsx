import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useEligibleEmployeeQuery, useCongesQuery } from '@/features/conge/queries/conge.query';
import { IEmployee } from '@/features/personnel/types/types';
import { CongeStatut, IConge } from '@/features/conge/types/conge.type';
import EtatErreur from '@/components/commons/EtatErreur';

// Fonction pour calculer l'ancienneté
const calculateSeniority = (entryDate: string): { years: number; months: number; label: string } => {
  const entry = new Date(entryDate);
  const today = new Date();

  // Calculer les années et les mois
  let years = today.getFullYear() - entry.getFullYear();
  let months = today.getMonth() - entry.getMonth();

  // Ajuster si le mois actuel est avant le mois d'entrée
  if (months < 0) {
    years--;
    months += 12;
  }

  console.log('Date entrée:', entry, "Aujourd'hui:", today, 'Années:', years, 'Mois:', months);

  return {
    years,
    months,
    label: years === 0 ? `${months} mois` : `${years} an${years > 1 ? 's' : ''}`,
  };
};

// Fonction pour calculer les droits de congés
const calculateLeaveRights = (years: number, months: number): number => {
  console.log('Calcul droits pour ancienneté:', years, 'ans', months, 'mois');

  if (years >= 1) {
    return 30; // 30 jours après 1 an complet
  } else {
    // Calcul proratisé : 2.5 jours par mois travaillé
    const proratedRights = Math.floor(months * 2.5);
    console.log('Droits proratisés:', proratedRights, 'jours pour', months, 'mois');
    return proratedRights;
  }
};

// Interface pour les statuts de congé
interface CongeStatusEntry {
  id: string;
  statut: string;
  statutType: string;
  statutString: string;
  statutValue: string;
}

// Fonction pour extraire les statuts disponibles des congés d'un employé
const getAvailableStatuses = (employeeConges: IConge[]): CongeStatusEntry[] => {
  return employeeConges.map((c) => ({
    id: c.id,
    statut: c.statut,
    statutType: typeof c.statut,
    statutString: String(c.statut),
    statutValue: c.statut,
  }));
};

// Fonction pour formater la date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function AutomatisationConges() {
  console.log('🚀 AutomatisationConges component mounted');

  const employesQuery = useEligibleEmployeeQuery({ limit: 1000 });
  const congesQuery = useCongesQuery({ limit: 1000 });
  const { data: employeesData } = employesQuery;
  const { data: congesData } = congesQuery;
  // Les deux lectures comptent : sans les employes la grille est vide, sans les
  // conges chaque carte annonce « 0 jour pris », ce qui est faux et invisible.
  const lectureEnEchec = employesQuery.isError || congesQuery.isError;

  const employees = Array.isArray(employeesData) ? employeesData : [];
  console.log('Employés éligibles reçus pour les congés:', employees);
  const conges = congesData?.content || [];
  console.log('Congés reçus:', conges);
  console.log('Pagination congés - Total:', congesData?.totalElements, 'Page:', congesData?.number, 'Taille:', congesData?.size);

  // Préparer les données des employés avec calculs
  const employeesWithLeaveData = employees.map((employee: IEmployee) => {
    console.log('Traitement employé:', employee.name, 'ID:', employee.id);
    const seniority = calculateSeniority(employee.entryDate);
    const rights = calculateLeaveRights(seniority.years, seniority.months);

    // Calculer les congés pris pour cet employé
    const employeeConges = conges.filter((conge: IConge) => conge.employeeId === employee.id);
    console.log('Congés trouvés pour', employee.name, ':', employeeConges);

    // Extraire les statuts disponibles avec la fonction dédiée
    const availableStatuses = getAvailableStatuses(employeeConges);
    console.log('Statuts disponibles pour', employee.name, ':', availableStatuses);

    const pris = employeeConges.reduce((total: number, conge: IConge) => total + (conge.duration || 0), 0);
    const restant = Math.max(0, rights - pris);

    // Vérifier si l'employé est actuellement en congé
    const currentLeave = employeeConges.find((conge: IConge) => conge.statut === CongeStatut.EN_COURS || String(conge.statut).toLowerCase().includes('cours'));

    const isOnLeave = !!currentLeave;

    // Alerte uniquement si :
    // 1. L'employé a des droits de congés (>= 5 jours)
    // 2. ET il lui reste peu de jours (<= 5 jours restants)
    // 3. OU il a pris beaucoup de jours (>= 25 jours pris)
    const warning = rights >= 5 && (restant <= 5 || pris >= 25);

    // Message spécial pour les employés non éligibles
    const notEligible = rights < 5;

    return {
      name: employee.name,
      embauche: formatDate(employee.entryDate),
      anciennete: seniority.label,
      droits: rights,
      pris: pris,
      restant: restant,
      warning: warning,
      notEligible: notEligible,
      isOnLeave: isOnLeave,
    };
  });

  return (
    <div className="p-6 bg-gray-100">
      {/* Header */}
      <div className="bg-gray-200 rounded-xl p-4 mb-6">
        <h1 className="text-lg font-semibold mb-1">Automatisation des congés</h1>
        <p className="text-sm text-gray-600">Le système calcule automatiquement les droits aux congés basé sur la date d&#39;embauche :</p>
        <ul className="text-sm text-gray-700 mt-2 list-disc ml-5">
          <li>
            <strong>Après 1 an d&#39;ancienneté :</strong> 30 jours de congés annuels
          </li>
          <li>
            <strong>Première année :</strong> 2,5 jours par mois travaillé (proratisé)
          </li>
        </ul>
      </div>

      {/* Grid — l'echec remplace la grille : sans cela l'ecran se contentait de
          n'afficher aucune carte, ce qui se lit comme « aucun employe ». */}
      {lectureEnEchec ? (
        <EtatErreur
          quoi="les droits aux congés"
          onReessayer={() => {
            employesQuery.refetch();
            congesQuery.refetch();
          }}
          enCours={employesQuery.isFetching || congesQuery.isFetching}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employeesWithLeaveData.map((emp, index) => (
            <Card key={index} className="rounded-2xl shadow-xs">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-2 flex items-center gap-2">
                  {emp.name}
                  {emp.isOnLeave && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">🏖️ En congé</span>}
                </h2>

                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p>📅 Embauche: {emp.embauche}</p>
                  <p>Ancienneté: {emp.anciennete}</p>
                </div>

                <div className="bg-gray-100 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Droits congés</span>
                    <span className="font-medium">{emp.droits} jours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pris</span>
                    <span>{emp.pris} jours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restant</span>
                    <span className={`font-semibold ${emp.restant <= 5 ? 'text-green-600' : emp.warning ? 'text-red-500' : 'text-orange-500'}`}>{emp.restant} jours</span>
                  </div>
                </div>

                {emp.warning && (
                  <div className="mt-3 flex items-center gap-2 bg-red-100 text-red-600 text-xs px-3 py-2 rounded-lg">
                    <AlertTriangle size={14} />
                    Doit prendre des congés rapidement
                  </div>
                )}

                {emp.restant >= 20 && (
                  <div className="mt-3 flex items-center gap-2 bg-blue-100 text-blue-600 text-xs px-3 py-2 rounded-lg">
                    <AlertTriangle size={14} />
                    Doit prendre ses congés cette année
                  </div>
                )}

                {emp.notEligible && (
                  <div className="mt-3 flex items-center gap-2 bg-blue-100 text-blue-600 text-xs px-3 py-2 rounded-lg">
                    <AlertTriangle size={14} />
                    En période d&#39;éligibilité ({emp.anciennete})
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
