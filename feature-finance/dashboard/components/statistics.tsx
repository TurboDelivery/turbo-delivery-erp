"use client";

import { Card } from "@/components/ui/card";
import { useDepensesListQuery } from "@/feature-finance/depenses/queries/depense-list.query";
import { useCommissionPourcentageList } from "@/feature-finance/revenus/hooks/use-commissionpourcentage-list";
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list";
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list";
import { DollarSign, Wallet, WalletCards, ArrowUp, ArrowDown } from "lucide-react";

export default function Statistics() {
    const { livraisons } = useLivraisonList({ initialData: [] });
    const { commissionspourcentage } = useCommissionPourcentageList({ initialData: [] });
    const { investissements } = useInvestissementList({ initialData: [] });
    
    // Utilisation directe de la query pour les dépenses
    const { data: depensesData } = useDepensesListQuery({
        page: 1,
        limit: 1000, // Limite élevée pour obtenir toutes les dépenses
    });
    
    const depenses = depensesData || [];
    
    // Calcul des sommes
    const sommeLivraisons = livraisons.reduce((total: number, livraison: any) => total + livraison.fraisLivraison, 0);
    const sommeCommissions = commissionspourcentage.reduce((total: number, commission: any) => total + commission.commission, 0);
    const sommeInvestissements = investissements.reduce((total: number, investissement: any) => total + investissement.montant, 0);
    const sommeDepenses = depenses.reduce((total: number, depense: any) => total + depense.montant, 0);

    const revenus = sommeLivraisons + sommeCommissions + sommeInvestissements;
    const comptes = revenus - sommeDepenses;
    const isGain = comptes > 0;
    
    const stats = [
        {
            title: "Chiffre d'affaires",
            value: `${revenus.toLocaleString()}`,
            icon: <Wallet className="w-4 h-4" />,
            color: "text-green-600",
            bgColor: "bg-green-100",
            trend: "up" as const,
        },
        {
            title: "Total livraisons",
            value: `${sommeLivraisons.toLocaleString()}`,
            icon: <WalletCards className="w-4 h-4" />,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            trend: "down" as const,
        },
        {
            title: "Total revenus",
            value: `${sommeDepenses.toLocaleString()}`,
            icon: <WalletCards className="w-4 h-4" />,
            color: "text-red-600",
            bgColor: "bg-red-100",
            trend: "down" as const,
        },
        {
            title: "Solde des comptes   ",
            value: `${Math.abs(comptes).toLocaleString()}`,
            icon: <DollarSign className="w-4 h-4" />,
            color: isGain ? "text-green-600" : "text-red-600",
            bgColor: isGain ? "bg-green-100" : "bg-red-100",
            trend: isGain ? "up" as const : "down" as const,
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
                                {stat.title === "Solde des comptes" && (
                                    <p className={`text-xs font-medium ${isGain ? "text-green-600" : "text-red-600"}`}>
                                        {isGain ? "Gain" : "Déficit"}
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