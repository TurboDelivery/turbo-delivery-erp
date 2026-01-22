"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Edit, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddInvestModal } from "../creer-invest/add-invest-modal"
import { InvestDetailModal } from "./invest-detail-modal"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { ModifierInvestModal } from "../modifier/modifier-invest-modal"
import InvestisseurNameFilter from "../filtres/filtre-nom-investisseur"
import InvestissementDateFilter from "../filtres/filtres-par-date"
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list";
import SupprimerInvestModal from "../supprimer/supprimer-invest-modal"

export default function InvestissementList() {
    const { investissements, isLoading, isError, error } = useInvestissementList();

    const formatDate = (dateString: string) => {
        if (!dateString) return "";

        try {
            const date = parseISO(dateString);
            return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
        } catch (error) {
            console.warn("Erreur de formatage de date:", error);
            return dateString;
        }
    };

    const formatDateForMobile = (dateString: string) => {
        if (!dateString) return "";

        try {
            const date = parseISO(dateString);
            return format(date, "dd/MM/yy", { locale: fr });
        } catch (error) {
            return dateString.split('T')[0];
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Chargement des investissements...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center p-8">
                <p className="text-red-500">Erreur lors du chargement des investissements</p>
            </div>
        );
    }

    return (
        <div className="">
            <Card className="shadow-lg border-0">
                <CardHeader>
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm md:text-xl lg:text-2xl">Liste des investissements</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-normal font-exo text-sm">
                                <InvestissementDateFilter />
                                <InvestisseurNameFilter />
                                <AddInvestModal />
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Version Desktop */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-red-500 hover:bg-red-600">
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Date</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Investisseur</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Montant du pret</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Echéance</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {investissements?.map((investissement: any) => (
                                    <TableRow key={investissement.id} className="transition-colors">
                                        <TableCell className="font-medium text-center border-b-2">
                                            {formatDate(investissement.dateInvestissement)}
                                        </TableCell>
                                        <TableCell className="text-center border-b-2">
                                            <span className="font-semibold rounded-full px-2 py-1 text-center">
                                                {investissement.nomInvestisseur}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center border-b-2">
                                            {investissement.montant} FCFA
                                        </TableCell>
                                        <TableCell className="text-center border-b-2">
                                            {formatDate(investissement.deadline)}
                                        </TableCell>
                                        <TableCell className="text-center border-b-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button className="bg-red-400 hover:bg-red-600 cursor-pointer">
                                                        <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <InvestDetailModal investissement={investissement} />
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <ModifierInvestModal investissement={investissement} />
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <SupprimerInvestModal investissement={investissement} />
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Version Mobile */}
                    <div className="md:hidden space-y-4 p-4">
                        {investissements?.map((investissement: any) => (
                            <div key={investissement.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-sm text-gray-500">
                                        {formatDateForMobile(investissement.dateInvestissement)}
                                    </p>
                                    <h3 className="font-semibold rounded-md px-2 text-sm">
                                        {investissement.nomInvestisseur}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Montant total :</span>
                                        <span className="text-black ml-2">{investissement.montant} FCFA</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Echéance :</span>
                                        <span className="text-black ml-2">{formatDateForMobile(investissement.deadline)}</span>
                                    </div>
                                    <div className="text-right">
                                        <Button variant="default" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
                                        </Button>
                                        <ModifierInvestModal investissement={investissement} />
                                        <SupprimerInvestModal investissement={investissement} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message si aucun investissement */}
                    {!investissements || investissements.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Aucun investissement trouvé</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}