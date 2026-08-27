"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Download, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useRecouvrementList } from "@/features/revenus/hooks/use-recouvrement";
import { useInvestissementList } from "@/features/revenus/hooks/use-investissement-list";
import { IRecouvrement } from "@/features/revenus/types/recouvrement/recouvrement.types";
import { IInvestissement } from "@/features/revenus/types/revenus.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import EtatErreur from "@/components/commons/EtatErreur";

export default function RevenusEncaissesClient() {
    const [activeTab, setActiveTab] = useState("recouvrements");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("tous");

    const {
        recouvrement: recouvrementsData,
        total: totalTransactions,
        isLoading: isLoadingRecouvrements,
        isFetching: isFetchingRecouvrements,
        isError: isErrorRecouvrements,
        refetch: refetchRecouvrements,
    } = useRecouvrementList({
        initialData: []
    });

    const {
        investissements,
        isLoading: isLoadingInvestissements,
        isFetching: isFetchingInvestissements,
        isError: isErrorInvestissements,
        refetch: refetchInvestissements,
    } = useInvestissementList();

    // Calculer les totaux
    const totalRecouvrements = recouvrementsData?.reduce((sum: number, rec: any) => sum + (rec.montant || 0), 0) || 0;
    const totalInvestissements = investissements?.reduce((sum: number, inv: any) => sum + (inv.montant || 0), 0) || 0;
    const totalGeneral = totalRecouvrements + totalInvestissements;

    // Filtrer et trier les données
    const filteredRecouvrements = recouvrementsData?.filter((rec: IRecouvrement) => {
        // Filtre par recherche
        const searchMatch = !searchTerm || 
            rec.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.nomRestaurant?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par date
        let dateMatch = true;
        if (dateFilter !== "tous" && rec.dateRecouvrement) {
            const recDate = new Date(rec.dateRecouvrement);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch (dateFilter) {
                case "aujourd'hui":
                    const todayEnd = new Date(today);
                    todayEnd.setHours(23, 59, 59, 999);
                    dateMatch = recDate >= today && recDate <= todayEnd;
                    break;
                case "semaine":
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    dateMatch = recDate >= weekStart && recDate <= weekEnd;
                    break;
                case "mois":
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    monthEnd.setHours(23, 59, 59, 999);
                    dateMatch = recDate >= monthStart && recDate <= monthEnd;
                    break;
                case "annee":
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    const yearEnd = new Date(today.getFullYear(), 11, 31);
                    yearEnd.setHours(23, 59, 59, 999);
                    dateMatch = recDate >= yearStart && recDate <= yearEnd;
                    break;
            }
        }
        
        return searchMatch && dateMatch;
    }) || [];

    const filteredInvestissements = investissements?.filter((inv: IInvestissement) => {
        // Filtre par recherche
        const searchMatch = !searchTerm || 
            inv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.nomInvestisseur?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par date
        let dateMatch = true;
        if (dateFilter !== "tous" && inv.dateInvestissement) {
            const invDate = new Date(inv.dateInvestissement);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch (dateFilter) {
                case "aujourd'hui":
                    const todayEnd = new Date(today);
                    todayEnd.setHours(23, 59, 59, 999);
                    dateMatch = invDate >= today && invDate <= todayEnd;
                    break;
                case "semaine":
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    dateMatch = invDate >= weekStart && invDate <= weekEnd;
                    break;
                case "mois":
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    monthEnd.setHours(23, 59, 59, 999);
                    dateMatch = invDate >= monthStart && invDate <= monthEnd;
                    break;
                case "annee":
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    const yearEnd = new Date(today.getFullYear(), 11, 31);
                    yearEnd.setHours(23, 59, 59, 999);
                    dateMatch = invDate >= yearStart && invDate <= yearEnd;
                    break;
            }
        }
        
        return searchMatch && dateMatch;
    }) || [];

    // Trier les investissements : PDG en premier, puis par date décroissante
    const sortedInvestissements = [...filteredInvestissements].sort((a, b) => {
        // Mettre les investissements du PDG en premier
        const aIsPDG = a.nomInvestisseur?.toLowerCase().includes('pdg') || 
                       a.nomInvestisseur?.toLowerCase().includes('président') ||
                       a.nomInvestisseur?.toLowerCase().includes('directeur général');
        const bIsPDG = b.nomInvestisseur?.toLowerCase().includes('pdg') || 
                       b.nomInvestisseur?.toLowerCase().includes('président') ||
                       b.nomInvestisseur?.toLowerCase().includes('directeur général');
        
        if (aIsPDG && !bIsPDG) return -1;
        if (!aIsPDG && bIsPDG) return 1;
        
        // Ensuite, trier par date décroissante
        const dateA = new Date(a.dateInvestissement || 0);
        const dateB = new Date(b.dateInvestissement || 0);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <div className="p-6 space-y-6">
            {/* En-tête */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Historique des Revenus Encaissés</h1>
                        <p className="text-gray-600 mt-2">
                            Consultez l'historique complet des recouvrements et investissements
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            onClick={() => window.location.href = '/finance/recouvrement'}
                        >
                            <TrendingUp className="w-5 h-5" />
                            Gestion Recouvrement
                        </Button>
                        <Button 
                            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            onClick={() => window.location.href = '/finance/revenue/investissement'}
                        >
                            <DollarSign className="w-5 h-5" />
                            Gestion Investissement
                        </Button>
                        {/* <Button className="flex items-center gap-2 px-4 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200">
                            <Download className="w-5 h-5" />
                            Exporter
                        </Button> */}
                    </div>
                </div>

                {/* Cartes de statistiques */}
                {/* Les totaux sont sommes cote client : si une des deux listes n'a pas pu
                    etre lue, « 0 FCFA » s'affiche comme un vrai zero. */}
                {isErrorRecouvrements || isErrorInvestissements ? (
                    <Card>
                        <CardContent className="p-0">
                            <EtatErreur
                                quoi="les revenus encaissés"
                                onReessayer={() => {
                                    if (isErrorRecouvrements) refetchRecouvrements();
                                    if (isErrorInvestissements) refetchInvestissements();
                                }}
                                enCours={isFetchingRecouvrements || isFetchingInvestissements}
                            />
                        </CardContent>
                    </Card>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-600 text-sm font-medium">Total Recouvrements</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {totalRecouvrements.toLocaleString()} FCFA
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs text-blue-600">
                                            {/* Total SERVEUR, pas la longueur du tableau rendu. */}
                                            {totalTransactions} transactions
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-200 rounded-full">
                                    <Wallet className="w-6 h-6 text-blue-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-600 text-sm font-medium">Total Investissements</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {totalInvestissements.toLocaleString()} FCFA
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                                        <span className="text-xs text-green-600">
                                            {sortedInvestissements.length} investissements
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-200 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-600 text-sm font-medium">Total Général</p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {totalGeneral.toLocaleString()} FCFA
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <DollarSign className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs text-purple-600">
                                            {(filteredRecouvrements.length + sortedInvestissements.length)} opérations
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-200 rounded-full">
                                    <DollarSign className="w-6 h-6 text-purple-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                )}

                {/* Filtres */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher par référence, restaurant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filtrer par date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tous">Toutes les dates</SelectItem>
                            <SelectItem value="aujourd'hui">Aujourd'hui</SelectItem>
                            <SelectItem value="semaine">Cette semaine</SelectItem>
                            <SelectItem value="mois">Ce mois</SelectItem>
                            <SelectItem value="annee">Cette année</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Onglets */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                        <TabsTrigger 
                            value="recouvrements" 
                            className={`flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 ${
                                activeTab === "recouvrements" ? "bg-red-500 text-white shadow-lg" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <span>Recouvrements</span>
                            <Badge variant={activeTab === "recouvrements" ? "secondary" : "outline"} className={
                                activeTab === "recouvrements" ? "bg-white text-red-500" : ""
                            }>
                                {filteredRecouvrements.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="investissements" 
                            className={`flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 ${
                                activeTab === "investissements" ? "bg-red-500 text-white shadow-lg" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <span>Investissements</span>
                            <Badge variant={activeTab === "investissements" ? "secondary" : "outline"} className={
                                activeTab === "investissements" ? "bg-white text-red-500" : ""
                            }>
                                {sortedInvestissements.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recouvrements" className="space-y-4">
                        <div className="grid gap-4">
                            {isErrorRecouvrements ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <EtatErreur
                                            quoi="les recouvrements"
                                            onReessayer={() => refetchRecouvrements()}
                                            enCours={isFetchingRecouvrements}
                                        />
                                    </CardContent>
                                </Card>
                            ) : filteredRecouvrements.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-gray-500">Aucun recouvrement trouvé</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredRecouvrements.map((recouvrement: IRecouvrement) => (
                                    <Card key={recouvrement.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-blue-100 rounded-full">
                                                        <Wallet className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {/* <h3 className="font-semibold">{recouvrement.id}</h3> */}
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                                                                Validé
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{recouvrement.nomRestaurant}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {recouvrement.dateRecouvrement && format(new Date(recouvrement.dateRecouvrement), 'PPP', { locale: fr })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-blue-600">
                                                        {recouvrement.montant?.toLocaleString()} FCFA
                                                    </p>
                                                    
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="investissements" className="space-y-4">
                        <div className="grid gap-4">
                            {isErrorInvestissements ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <EtatErreur
                                            quoi="les investissements"
                                            onReessayer={() => refetchInvestissements()}
                                            enCours={isFetchingInvestissements}
                                        />
                                    </CardContent>
                                </Card>
                            ) : filteredInvestissements.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-gray-500">Aucun investissement trouvé</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                sortedInvestissements.map((investissement: IInvestissement) => (
                                    <Card key={investissement.id} className={`hover:shadow-md transition-shadow ${
                                        investissement.nomInvestisseur?.toLowerCase().includes('pdg') || 
                                        investissement.nomInvestisseur?.toLowerCase().includes('président') ||
                                        investissement.nomInvestisseur?.toLowerCase().includes('directeur général') 
                                        ? 'border-2 border-purple-200 bg-purple-50' 
                                        : ''
                                    }`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-green-100 rounded-full">
                                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                           
                                                            {investissement.nomInvestisseur?.toLowerCase().includes('pdg') || 
                                                             investissement.nomInvestisseur?.toLowerCase().includes('président') ||
                                                             investissement.nomInvestisseur?.toLowerCase().includes('directeur général') ? (
                                                                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                                                                    👔 PDG
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-green-600 border-green-200">
                                                                    Actif
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{investissement.nomInvestisseur}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {investissement.dateInvestissement && format(new Date(investissement.dateInvestissement), 'PPP', { locale: fr })}
                                                        </p>
                                                        {investissement.deadline && (
                                                            <p className="text-xs text-orange-600">
                                                                📅 Échéance: {format(new Date(investissement.deadline), 'PPP', { locale: fr })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-green-600">
                                                        {investissement.montant?.toLocaleString()} FCFA
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Investissement personnel
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
