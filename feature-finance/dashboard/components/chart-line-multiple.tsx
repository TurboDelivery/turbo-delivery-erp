'use client';

import React, { useEffect, useState } from 'react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { useRecouvrementList } from '@/feature-finance/revenus/hooks/use-recouvrement';
import { useInvestissementList } from '@/feature-finance/revenus/hooks/use-investissement-list';
import { getAllChiffreAffaire } from '@/src/actions/statistiques.action';
import { YearFilter } from './year-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

const chartConfig = {
  revenus: {
    label: 'Revenus',
    color: '#10b981', // Vert émeraude
  },
  depenses: {
    label: 'Dépenses',
    color: '#ef4444', // Rouge vif
  },
  recouvrements: {
    label: 'Recouvrements',
    color: '#3b82f6', // Bleu vif
  },
  investissements: {
    label: 'Investissements',
    color: '#f59e0b', // Orange ambre
  },
  comptes: {
    label: 'Comptes',
    color: '#8b5cf6', // Violet
  },
} satisfies ChartConfig;

export function ChartLineMultiple() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth);
  const { chartData, yearlyTotals, isLoading, isError } = useDashboardStats(selectedYear);

  // État pour les données de l'API statistiques (même source que le dashboard principal)
  const [chiffreAffaireData, setChiffreAffaireData] = useState<any>(null);

  // Hooks pour les données de recouvrements et investissements
  const { recouvrement: recouvrementsData } = useRecouvrementList({ initialData: [] });
  const { investissements } = useInvestissementList();

  // Fonction pour filtrer les données par mois
  const filterDataByMonth = (data: any[], dateField: string) => {
    if (!selectedMonth) return data;

    return data.filter((item) => {
      const date = new Date(item[dateField]);
      return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    });
  };

  // Fonction pour filtrer les revenus totaux par mois (basé sur les données du dashboard)
  const filterRevenusByMonth = () => {
    if (!selectedMonth && chartData?.length) {
      // Si aucun mois sélectionné (bouton "Année"), utiliser les données de l'API directement
      console.log('Utilisation des données de l API pour l année');
      return {
        totalFraisLivraison: chiffreAffaireData?.fraisLivraisonTotalTermine || 0,
        totalCommissions: chiffreAffaireData?.commissionChiffreAffaire || chiffreAffaireData?.commissionCommande || 0,
      };
    }

    if (!selectedMonth || !chartData.length) {
      console.log('Pas de mois sélectionné ou pas de données chartData');
      // Si aucun mois sélectionné, utiliser les données de l'API
      return {
        totalFraisLivraison: chiffreAffaireData?.fraisLivraisonTotalTermine || 0,
        totalCommissions: chiffreAffaireData?.commissionChiffreAffaire || chiffreAffaireData?.commissionCommande || 0,
      };
    }

    // Afficher tous les mois disponibles dans chartData
    console.log('Mois disponibles dans chartData:');
    chartData.forEach((item, index) => {
      console.log(`  ${index}: "${item.month}" -> revenus: ${item.revenus}, depenses: ${item.depenses}`);
    });

    // Utiliser les noms abrégés qui correspondent à chartData
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const selectedMonthName = monthNames[selectedMonth - 1];
    console.log('Mois recherché:', `"${selectedMonthName}"`);

    // Chercher le mois correspondant dans les données du graphique
    const monthData = chartData.find((item) => {
      console.log(`Comparaison: "${item.month}" === "${selectedMonthName}" => ${item.month === selectedMonthName}`);
      return item.month === selectedMonthName;
    });

    console.log(`Données du mois ${selectedMonth} (${selectedMonthName}):`, monthData);

    if (monthData) {
      // Utiliser les données exactes du graphique pour la cohérence
      const revenusDuMois = monthData.revenus || 0;
      const depensesDuMois = monthData.depenses || 0;

      console.log(`Revenus du graphique pour le mois: ${revenusDuMois.toLocaleString()}`);
      console.log(`Dépenses du graphique pour le mois: ${depensesDuMois.toLocaleString()}`);

      // Pour les revenus totaux, on utilise la valeur "revenus" du graphique
      // qui correspond au CA du mois (frais livraison + commissions)
      console.log('=== FIN FILTRE REVENUS PAR MOIS (TROUVÉ) ===');
      return {
        totalFraisLivraison: revenusDuMois, // Le CA total du mois
        totalCommissions: 0, // Pas besoin de séparer car revenus contient déjà le total
      };
    }

    // Fallback : utiliser 0 si pas de données pour ce mois
    console.log(`Pas de données trouvées pour le mois ${selectedMonth}, utilisation de 0`);
    console.log('=== FIN FILTRE REVENUS PAR MOIS (NON TROUVÉ) ===');
    return {
      totalFraisLivraison: 0,
      totalCommissions: 0,
    };
  };

  // Fonction pour filtrer les dépenses par mois
  const filterDepensesByMonth = () => {
    if (!selectedMonth && chartData?.length) {
      // Si aucun mois sélectionné (bouton "Année"), calculer la somme de toutes les dépenses de l'année
      const totalDepenses = chartData.reduce((sum, item) => sum + (item.depenses || 0), 0);
      console.log('Total dépenses annuelles:', totalDepenses);
      return totalDepenses;
    }

    if (!selectedMonth || !chartData.length) {
      // Si aucun mois sélectionné, utiliser les totaux complets
      return yearlyTotals.totalDepenses;
    }

    // Utiliser les noms abrégés qui correspondent à chartData
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const selectedMonthName = monthNames[selectedMonth - 1];

    // Chercher le mois correspondant dans les données du graphique
    const monthData = chartData.find((item) => item.month === selectedMonthName);

    if (monthData) {
      const depensesDuMois = monthData.depenses || 0;
      console.log(`Dépenses du graphique pour ${selectedMonthName}: ${depensesDuMois.toLocaleString()}`);
      return depensesDuMois;
    }

    // Fallback : utiliser 0 si pas de données pour ce mois
    console.log(`Pas de dépenses trouvées pour ${selectedMonthName}, utilisation de 0`);
    return 0;
  };

  // Récupérer les données des API au chargement du composant
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Données de l'API statistiques
        const chiffreAffaire = await getAllChiffreAffaire({
          dates: {
            start: null,
            end: null,
          },
        });
        setChiffreAffaireData(chiffreAffaire);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, [recouvrementsData, investissements]);

  // Filtrer les données par mois si un mois est sélectionné
  const filteredRecouvrements = selectedMonth ? filterDataByMonth(recouvrementsData || [], 'dateRecouvrement') : recouvrementsData || [];
  const filteredInvestissements = selectedMonth ? filterDataByMonth(investissements || [], 'dateInvestissement') : investissements || [];

  // Calculer les revenus corrects avec filtrage par mois
  const filteredRevenus = filterRevenusByMonth();
  const totalFraisLivraison = filteredRevenus.totalFraisLivraison;
  const totalCommissions = filteredRevenus.totalCommissions;
  const totalRevenus = totalFraisLivraison + totalCommissions;

  // Filtrer les dépenses par mois aussi
  const totalDepensesFiltered = filterDepensesByMonth();

  // Calculer les revenus encaissés avec les données filtrées
  const totalRecouvrements = filteredRecouvrements.reduce((sum: number, rec: any) => sum + (rec.montant || 0), 0) || 0;
  const totalInvestissements = filteredInvestissements.reduce((sum: number, inv: any) => sum + (inv.montant || 0), 0) || 0;
  const totalRevenusEncaisses = totalRecouvrements + totalInvestissements;

  // Calculer le solde avec les dépenses filtrées
  const soldeComptes = totalRevenusEncaisses - totalDepensesFiltered;

  // Filtrer les données du graphique selon le mois sélectionné
  const getFilteredChartData = () => {
    if (!selectedMonth || !chartData.length) {
      return chartData; // Afficher toutes les données si "Tous"
    }

    // Si un mois est sélectionné, afficher toutes les données mais mettre en évidence le mois sélectionné
    return chartData.map((item) => {
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      const isSelectedMonth = item.month === monthNames[selectedMonth - 1];

      return {
        ...item,
        // Mettre en évidence le mois sélectionné avec des valeurs plus visibles
        revenus: isSelectedMonth ? item.revenus : item.revenus * 0.3, // 30% de l'opacité pour les autres mois
        depenses: isSelectedMonth ? item.depenses : item.depenses * 0.3,
        recouvrements: isSelectedMonth ? item.recouvrements : item.recouvrements * 0.3,
        investissements: isSelectedMonth ? item.investissements : item.investissements * 0.3,
        comptes: isSelectedMonth ? item.comptes : item.comptes * 0.3,
        // Ajouter une propriété pour identifier le mois sélectionné
        isSelected: isSelectedMonth,
      };
    });
  };

  const filteredChartData = getFilteredChartData();

  if (isError) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-red-500">Erreur lors du chargement des statistiques</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Évolution financière mensuelle</h3>
          </div>
          <div className="flex gap-2">
            <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} isLoading={isLoading} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Cartes de résumé */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#10b98120' }}>
            <p className="text-sm font-medium" style={{ color: '#10b981' }}>
              Revenus totaux
            </p>
            <p className="text-xl font-bold" style={{ color: '#047857' }}>
              {formatCFA(totalRevenus)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#ef444420' }}>
            <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
              Dépenses totales
            </p>
            <p className="text-xl font-bold" style={{ color: '#dc2626' }}>
              {formatCFA(totalDepensesFiltered)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#3b82f620' }}>
            <p className="text-sm font-medium" style={{ color: '#3b82f6' }}>
              Revenus encaissés
            </p>
            <p className="text-xl font-bold" style={{ color: '#2563eb' }}>
              {formatCFA(totalRecouvrements)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f59e0b20' }}>
            <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
              Investissements
            </p>
            <p className="text-xl font-bold" style={{ color: '#d97706' }}>
              {formatCFA(totalInvestissements)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#8b5cf620' }}>
            <p className="text-sm font-medium" style={{ color: '#8b5cf6' }}>
              En cours
            </p>
            <p className="text-xl font-bold" style={{ color: '#7c3aed' }}>
              {formatCFA(soldeComptes)}
            </p>
          </div>
        </div>

        {/* Graphique */}
        <div className="h-[400px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Chargement des statistiques...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aucune donnée disponible pour {selectedYear}</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} defaultIndex={1} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenus"
                  stroke={chartConfig.revenus.color}
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSelected) {
                      return <circle cx={cx} cy={cy} r={8} fill={chartConfig.revenus.color} stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill={chartConfig.revenus.color} />;
                  }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="depenses"
                  stroke={chartConfig.depenses.color}
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSelected) {
                      return <circle cx={cx} cy={cy} r={8} fill={chartConfig.depenses.color} stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill={chartConfig.depenses.color} />;
                  }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="recouvrements"
                  stroke={chartConfig.recouvrements.color}
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSelected) {
                      return <circle cx={cx} cy={cy} r={8} fill={chartConfig.recouvrements.color} stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill={chartConfig.recouvrements.color} />;
                  }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="investissements"
                  stroke={chartConfig.investissements.color}
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSelected) {
                      return <circle cx={cx} cy={cy} r={8} fill={chartConfig.investissements.color} stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill={chartConfig.investissements.color} />;
                  }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="comptes"
                  stroke={chartConfig.comptes.color}
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSelected) {
                      return <circle cx={cx} cy={cy} r={8} fill={chartConfig.comptes.color} stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill={chartConfig.comptes.color} />;
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
