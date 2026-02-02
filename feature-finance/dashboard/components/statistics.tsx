"use client";

import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/feature-finance/dashboard/hooks/use-dashboard-stats";
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list";
import { useCommissionFixeList } from "@/feature-finance/revenus/hooks/use-commissionfixe-list";
import { useCommissionPourcentageList } from "@/feature-finance/revenus/hooks/use-commissionpourcentage-list";
import { useRecouvrementList } from "@/feature-finance/revenus/hooks/use-recouvrement";
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list";
import { getAllChiffreAffaire } from "@/src/actions/statistiques.action";
import { DollarSign, Wallet, WalletCards, ArrowUp, ArrowDown, Receipt, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Statistics() {
    const { yearlyTotals, isLoading } = useDashboardStats(2026);
    const router = useRouter();
    
    // État pour les données de l'API statistiques (même source que le dashboard principal)
    const [chiffreAffaireData, setChiffreAffaireData] = useState<any>(null);
    
    // Récupérer les données de l'API statistiques au chargement du composant
    useEffect(() => {
        const fetchChiffreAffaire = async () => {
            try {
                const data = await getAllChiffreAffaire({
                    dates: {
                        start: null, // Pas de filtre de date pour avoir tout le mois
                        end: null,
                    }
                });
                setChiffreAffaireData(data);
                console.log('Données chiffreAffaire API:', data);
            } catch (error) {
                console.error('Erreur lors de la récupération des données chiffreAffaire:', error);
            }
        };
        
        fetchChiffreAffaire();
    }, []);
    
    // Récupérer les données pour calculer le CA correctement
    const { livraisons } = useLivraisonList({ initialData: [] });
    const { commissionsfixe } = useCommissionFixeList({ initialData: [] });
    const { commissionspourcentage } = useCommissionPourcentageList({ initialData: [] });
    
    // Récupérer les données pour les revenus encaissés (même source que la page de détail)
    const { recouvrement: recouvrementsData } = useRecouvrementList({ initialData: [] });
    const { investissements } = useInvestissementList();
    
    // Utiliser les frais de livraison du dashboard principal si disponibles, sinon utiliser les données de livraison
    const totalFraisLivraison = chiffreAffaireData?.fraisLivraisonTotalTermine || 
        livraisons?.reduce((sum: number, livraison: any) => sum + (livraison.fraisLivraison || 0), 0) || 0;
    
    // Utiliser les commissions du dashboard principal si disponibles, sinon utiliser les données des hooks
    const totalCommissions = chiffreAffaireData?.commissionChiffreAffaire || 
        chiffreAffaireData?.commissionCommande || 
        (commissionsfixe?.reduce((sum: number, commission: any) => sum + (commission.commission || 0), 0) || 0) +
        (commissionspourcentage?.reduce((sum: number, commission: any) => sum + (commission.commission || 0), 0) || 0);
    
    // CA = Frais de livraison + Commissions
    const chiffreAffaires = totalFraisLivraison + totalCommissions;
    
    // Calculer les revenus encaissés avec les mêmes données que la page de détail
    const totalRecouvrements = recouvrementsData?.reduce((sum: number, rec: any) => sum + (rec.montant || 0), 0) || 0;
    const totalInvestissements = investissements?.reduce((sum: number, inv: any) => sum + (inv.montant || 0), 0) || 0;
    const revenusEncaisses = totalRecouvrements + totalInvestissements;
    
    const sommeDepenses = yearlyTotals.totalDepenses;
    const soldeCompte = revenusEncaisses - sommeDepenses;
    const isSoldePositif = soldeCompte > 0;
    

    console.log('Données dashboard:', yearlyTotals);
    console.log('Calcul CA - Frais livraison:', totalFraisLivraison, 'Total Commissions:', totalCommissions);
    console.log('CA total calculé:', chiffreAffaires);
    
    // Logs détaillés pour déboguer les commissions
    console.log('=== DÉTAILL DES COMMISSIONS ===');
    console.log('Données commissionsfixe brutes:', commissionsfixe);
    console.log('Données commissionspourcentage brutes:', commissionspourcentage);
    console.log('Nombre de commissions fixes:', commissionsfixe?.length || 0);
    console.log('Nombre de commissions pourcentage:', commissionspourcentage?.length || 0);
    
    // Calculer les totaux pour les logs
    const totalCommissionFixe = commissionsfixe?.reduce((sum: number, commission: any) => sum + (commission.commission || 0), 0) || 0;
    const totalCommissionPourcentage = commissionspourcentage?.reduce((sum: number, commission: any) => sum + (commission.commission || 0), 0) || 0;
    
    console.log('Total Commission Fixe calculé (hooks):', totalCommissionFixe.toLocaleString(), 'FCFA');
    console.log('Total Commission Pourcentage calculé (hooks):', totalCommissionPourcentage.toLocaleString(), 'FCFA');
    console.log('Total Commissions combinées (hooks):', (totalCommissionFixe + totalCommissionPourcentage).toLocaleString(), 'FCFA');
    console.log('Total Commissions (dashboard principal):', totalCommissions.toLocaleString(), 'FCFA');
    
    // Vérifier si le dashboard principal a des données de commissions
    console.log('Données chiffreAffaire API complètes:', chiffreAffaireData);
    console.log('Commission Commande dans chiffreAffaire:', chiffreAffaireData?.commissionCommande);
    console.log('Commission Chiffre Affaire dans chiffreAffaire:', chiffreAffaireData?.commissionChiffreAffaire);
    console.log('=== FIN DÉTAILL COMMISSIONS ===');
    
    // Logs détaillés pour toutes les cartes
    console.log('=== DÉTAILL DES CARTES DASHBOARD ===');
    
    // Carte CA du Mois
    console.log('CARTE 1 - CA DU MOIS:');
    console.log('  - Total CA:', chiffreAffaires.toLocaleString(), 'FCFA');
    console.log('  - Frais de livraison:', totalFraisLivraison.toLocaleString(), 'FCFA');
    console.log('  - Commission fixe:', totalCommissionFixe.toLocaleString(), 'FCFA');
    console.log('  - Commission pourcentage:', totalCommissionPourcentage.toLocaleString(), 'FCFA');
    console.log('  - Total commissions:', (totalCommissionFixe + totalCommissionPourcentage).toLocaleString(), 'FCFA');
    console.log('  - Vérification: Frais livraison + Total commissions =', (totalFraisLivraison + totalCommissionFixe + totalCommissionPourcentage).toLocaleString(), 'FCFA');
    
    // Carte Revenus Encaissés
    console.log('CARTE 2 - REVENUS ENCAISSÉS:');
    console.log('  - Total Recouvrements (hooks directs):', totalRecouvrements.toLocaleString(), 'FCFA');
    console.log('  - Total Investissements (hooks directs):', totalInvestissements.toLocaleString(), 'FCFA');
    console.log('  - Total Revenus Encaissés:', revenusEncaisses.toLocaleString(), 'FCFA');
    console.log('  - Vérification: Recouvrements + Investissements =', (totalRecouvrements + totalInvestissements).toLocaleString(), 'FCFA');
    console.log('  - Anciennes valeurs yearlyTotals - Recouvrements:', yearlyTotals.totalRecouvrements.toLocaleString(), 'FCFA');
    console.log('  - Anciennes valeurs yearlyTotals - Investissements:', yearlyTotals.totalInvestissements.toLocaleString(), 'FCFA');
    
    // Carte Total Dépenses
    console.log('CARTE 3 - TOTAL DÉPENSES:');
    console.log('  - Total Dépenses:', sommeDepenses.toLocaleString(), 'FCFA');
    console.log('  - Source: yearlyTotals.totalDepenses =', yearlyTotals.totalDepenses.toLocaleString(), 'FCFA');
    
    // Carte Solde de Compte
    console.log('CARTE 4 - SOLDE DE COMPTE:');
    console.log('  - Revenus Encaissés:', revenusEncaisses.toLocaleString(), 'FCFA');
    console.log('  - Total Dépenses:', sommeDepenses.toLocaleString(), 'FCFA');
    console.log('  - Solde calculé:', soldeCompte.toLocaleString(), 'FCFA');
    console.log('  - Valeur absolue affichée:', Math.abs(soldeCompte).toLocaleString(), 'FCFA');
    console.log('  - Type de solde:', isSoldePositif ? 'Excédent (positif)' : 'Déficit (négatif)');
    console.log('  - Vérification: Revenus - Dépenses =', (revenusEncaisses - sommeDepenses).toLocaleString(), 'FCFA');
    
    console.log('=== FIN DES DÉTAILL ===');
    
    const stats = [
        {
            title: "CA du Mois",
            value: `${chiffreAffaires.toLocaleString()}`,
            icon: <Wallet className="w-4 h-4" />,
            color: "text-green-600",
            bgColor: "bg-green-100",
            trend: "up" as const,
        },
        {
            title: "Revenus Encaissés",
            value: `${revenusEncaisses.toLocaleString()}`,
            icon: <WalletCards className="w-4 h-4" />,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            trend: "up" as const,
            clickable: true,
            onClick: () => router.push('/finance/revenus-encaisses')
        },
        {
            title: "Total Dépenses",
            value: `${sommeDepenses.toLocaleString()}`,
            icon: <ArrowDown className="w-4 h-4" />,
            color: "text-red-600",
            bgColor: "bg-red-100",
            trend: "down" as const,
            clickable: true,
            onClick: () => router.push('/finance/depense')
        },
        {
            title: "Solde de Compte",
            value: `${Math.abs(soldeCompte).toLocaleString()}`,
            icon: <DollarSign className="w-4 h-4" />,
            color: isSoldePositif ? "text-green-600" : "text-red-600",
            bgColor: isSoldePositif ? "bg-green-100" : "bg-red-100",
            trend: isSoldePositif ? "up" as const : "down" as const,
            isCurrency: true,
        },
    ];
    

    return (
        <div className="w-full px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {/* Carte CA du Mois agrandie et décomposée */}
                <Card className="col-span-1 sm:col-span-2 md:col-span-2 p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start h-full">
                        {/* Partie 1 : CA du Mois - inchangé */}
                        <div className="flex flex-col justify-between h-full">
                            <div>
                                <h3 className="text-sm font-medium text-gray-600">CA du Mois</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-2xl font-bold text-green-600">
                                        {chiffreAffaires.toLocaleString()} FCFA
                                    </p>
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                        <ArrowUp className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Séparateur vertical */}
                        <div className="w-px bg-green-200 mx-4" />
                        
                        {/* Partie 2 : Décomposition du CA */}
                        <div className="flex flex-col justify-between h-full flex-1">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Receipt className="w-3 h-3 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">Frais Livraison</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">
                                        {totalFraisLivraison.toLocaleString()} FCFA
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <TrendingUp className="w-3 h-3 text-purple-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">Commissions</span>
                                    </div>
                                    <span className="text-sm font-bold text-purple-600">
                                        {totalCommissions.toLocaleString()} FCFA
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Icône principale */}
                        <div className="p-3 bg-green-200 rounded-full">
                            <div className="text-green-700">
                                <Wallet className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </Card>
                
                {/* Les autres cartes */}
                {stats.slice(1).map((stat, index) => (
                    <Card
                        key={index + 1}
                        className={`p-6 flex flex-col items-center justify-center rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 bg-white ${
                            stat.clickable ? 'cursor-pointer hover:scale-105' : ''
                        }`}
                        onClick={stat.onClick}
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col items-start gap-2">
                                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                                <div className="flex items-center gap-2">
                                    <p className={`text-md font-bold ${stat.color}`} mt-2>
                                        {stat.value} {stat.isCurrency !== false && "FCFA"}
                                    </p>
                                    {stat.trend && (
                                        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${stat.trend === "up" ? "bg-green-100" : "bg-red-100"}`}>
                                            {stat.trend === "up" ? (
                                                <ArrowUp className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <ArrowDown className="w-4 h-4 text-red-600" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                {stat.title === "Solde de Compte" && (
                                    <p className={`text-xs font-medium ${isSoldePositif ? "text-green-600" : "text-red-600"}`}>
                                        {isSoldePositif ? "Excédent" : "Déficit"}
                                    </p>
                                )}
                            </div>

                            <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                <div className={stat.color}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}