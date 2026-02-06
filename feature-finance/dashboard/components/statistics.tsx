"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp, Download, Receipt, TrendingUp, Wallet, WalletCards, DollarSign, ArrowDown } from 'lucide-react';
import { useDashboardStats } from '@/feature-finance/dashboard/hooks/use-dashboard-stats';
import { useCAExport } from '@/feature-finance/dashboard/hooks/use-ca-export';
import { useRouter } from "next/navigation";
import DateFilterInput from '@/components/finance/date-filter-input';
import { DateRange } from 'react-day-picker';
import { startOfMonth } from 'date-fns';

export default function Statistics() {
    const { yearlyTotals, isLoading, chartData } = useDashboardStats(2026);
    const router = useRouter();
    
    // État pour le filtre par plage de dates
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date()
    });
    
    // État pour les données de l'API statistiques globales
    const [globalStats, setGlobalStats] = useState<any>(null);
    
    // Récupérer les données de l'API statistiques globales au chargement du composant
    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const baseUrl = '/api/finance/global/stats';
                const searchParams = new URLSearchParams();
                
                if (dateRange?.from) {
                    searchParams.append('debut', dateRange.from.toISOString().split('T')[0]);
                }
                if (dateRange?.to) {
                    searchParams.append('fin', dateRange.to.toISOString().split('T')[0]);
                }
                
                const url = `${baseUrl}?${searchParams.toString()}`;
                const response = await fetch(url);
                const data = await response.json();
                setGlobalStats(data);
            } catch (error) {
                console.error('Erreur lors de la récupération des données globales:', error);
            }
        };
        
        fetchGlobalStats();
    }, [dateRange]);
    
    // Utiliser les données de l'API globale pour les statistiques
    const chiffreAffaires = globalStats?.chiffreAffaire || 0;
    const revenusEncaisses = globalStats?.revenuEncaisse || 0;
    const sommeDepenses = globalStats?.depenses || 0;
    const soldeCompte = globalStats?.solde || 0;
    const isSoldePositif = soldeCompte > 0;
    
    // Titre dynamique pour la carte CA
    const caTitle = dateRange ? "CA de la Période" : "CA du Mois";
    
    // Hook pour l'exportation Excel du CA
    const { exportCAToExcel, isLoadingCAExport } = useCAExport();
    
    // Fonction pour télécharger les détails du CA en Excel
    const handleDownloadDetails = () => {
        // Utiliser la plage de dates sélectionnée
        const debut = dateRange?.from;
        const fin = dateRange?.to;
        
        // Appeler l'exportation Excel
        exportCAToExcel({
            debut,
            fin,
            selectedMonth: null,
            selectedYear: debut?.getFullYear() || new Date().getFullYear()
        });
    };
    
    const stats = [
        {
            title: caTitle,
            value: `${chiffreAffaires.toLocaleString('fr-FR')} FCFA`,
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
            {/* En-tête avec filtre */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tableau de bord financier</h2>
                <DateFilterInput 
                    filters={{
                        debut: dateRange?.from,
                        fin: dateRange?.to
                    }}
                    handleDateChange={setDateRange}
                />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {/* Carte CA du Mois sur toute la largeur */}
                <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start h-full">
                        {/* Partie 1 : CA du Mois */}
                        <div className="flex flex-col justify-between h-full">
                            <div>
                                <h3 className="text-sm font-medium text-gray-600">{caTitle}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-2xl font-bold text-green-600">
                                        {chiffreAffaires.toLocaleString()} FCFA
                                    </p>
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                        <ArrowUp className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>
                                {/* Bouton Télécharger les détails */}
                                <button
                                    onClick={handleDownloadDetails}
                                    disabled={isLoadingCAExport}
                                    className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:shadow-sm disabled:cursor-not-allowed"
                                >
                                    {isLoadingCAExport ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Téléchargement...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-3 h-3" />
                                            Télécharger les détails
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* Séparateur vertical */}
                        <div className="w-px bg-green-200 mx-4" />
                        
                        {/* Partie 2 : Décomposition du CA */}
                        <div className="flex items-center gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Receipt className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-700">Frais Livraison</span>
                                        <div className="text-sm font-bold text-blue-600">
                                            {(chiffreAffaires * 0.7).toLocaleString()} FCFA
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 rounded-full">
                                        <TrendingUp className="w-3 h-3 text-purple-600" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-700">Commissions</span>
                                        <div className="text-sm font-bold text-purple-600">
                                            {(chiffreAffaires * 0.3).toLocaleString()} FCFA
                                        </div>
                                    </div>
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
                
                {/* Les 3 autres cartes sur la ligne du dessous */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
    );
}