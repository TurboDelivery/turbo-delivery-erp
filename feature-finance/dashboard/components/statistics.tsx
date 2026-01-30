"use client";

import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/feature-finance/dashboard/hooks/use-dashboard-stats";
import { DollarSign, Wallet, WalletCards, ArrowUp, ArrowDown } from "lucide-react";

export default function Statistics() {
    const { yearlyTotals, isLoading } = useDashboardStats(2026);
    
    // Utiliser les données de l'API dashboard
    const chiffreAffaires = yearlyTotals.totalRevenus; // CA du mois
    const revenusEncaisses = yearlyTotals.totalRecouvrements + yearlyTotals.totalInvestissements;
    const sommeDepenses = yearlyTotals.totalDepenses;
    const soldeCompte = revenusEncaisses - sommeDepenses;
    const isSoldePositif = soldeCompte > 0;
    

    console.log('Données dashboard:', yearlyTotals);
    
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
        },
        {
            title: "Total Dépenses",
            value: `${sommeDepenses.toLocaleString()}`,
            icon: <ArrowDown className="w-4 h-4" />,
            color: "text-red-600",
            bgColor: "bg-red-100",
            trend: "down" as const,
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
                {stats.map((stat, index) => (
                    <Card
                        key={index}
                        className="p-6 flex flex-col items-center justify-center rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
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