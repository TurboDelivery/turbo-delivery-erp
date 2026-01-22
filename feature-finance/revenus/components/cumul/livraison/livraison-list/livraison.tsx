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
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import FilterPeriode from "@/feature-finance/revenus/components/filtres/periode/filter-periode"
import { LivraisonDetailModal } from "./livraison-detail-modal"

import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useMemo, useState } from "react"
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list"
import { Pagination } from "@heroui/react"

export default function LivraisonList() {
    // S'assurer que livraisons est toujours un tableau
    const {livraisons, isLoading, isError, error, filters} = useLivraisonList()

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    
    // S'assurer que livraisons est un tableau avant de faire les calculs
    const livraisonsArray = Array.isArray(livraisons) ? livraisons : []
    const totalPages = Math.ceil(livraisonsArray.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentLivraisons = livraisonsArray.slice(startIndex, startIndex + itemsPerPage)

    // Filtrage basé sur les filtres du hook
    const filteredLivraisons = useMemo(() => {
        if (!livraisonsArray.length) return []
        
        return livraisonsArray.filter((livraisonItem) => {
            // Filtre par nom de livreur
            if (filters.nomLivreur && livraisonItem.nomLivreur && !livraisonItem.nomLivreur.toLowerCase().includes(filters.nomLivreur.toLowerCase())) return false
            
            // Filtre par date exacte (création)
            if (filters.createdAt && livraisonItem.createdAt && !livraisonItem.createdAt.includes(filters.createdAt)) return false
            
            // Filtre par frais de livraison
            if (filters.fraisLivraison && livraisonItem.fraisLivraison !== filters.fraisLivraison) return false
            
            // Filtre par date de début
            if (filters.dateLivraison && livraisonItem.createdAt) {
                const livraisonDate = new Date(livraisonItem.createdAt)
                const dateLivraison = new Date(filters.dateLivraison)
                if (livraisonDate < dateLivraison) return false
            }
            
            
            
            return true
        })
    }, [livraisonsArray, filters])
    
    // Recalculer la pagination avec les données filtrées
    const filteredTotalPages = Math.ceil(filteredLivraisons.length / itemsPerPage)
    const filteredStartIndex = (currentPage - 1) * itemsPerPage
    const filteredCurrentLivraisons = filteredLivraisons.slice(filteredStartIndex, filteredStartIndex + itemsPerPage)

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


    return (
        <div className="">
            <Card className="shadow-lg border-0">
                <CardHeader className="">
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm md:text-2xl">Liste des livraisons</p>
                            <div
                                className="gap-2 font-normal font-exo text-sm"
                            >
                                <FilterPeriode />
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
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center hover:text-white capitalize">Reference</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center hover:text-white capitalize">Date et heure</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center hover:text-white capitalize">Livreur</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center hover:text-white capitalize">Coût commande</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center hover:text-white capitalize">Commission(%)</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-white text-center hover:text-white capitalize">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCurrentLivraisons.map((livraison, index) => (
                                    <TableRow key={index} className="transition-colors">
                                        <TableCell className="font-medium text-center">{livraison.refCommande}</TableCell>
                                        <TableCell className="font-medium text-center">{formatDate(livraison.createdAt)}</TableCell>
                                        <TableCell className="font-medium text-center">
                                            {livraison.nomLivreur}
                                        </TableCell>
                                        <TableCell className="font-medium text-center">
                                            {livraison.totalAmount}
                                        </TableCell>
                                        <TableCell className="font-medium text-center">
                                            {livraison.fraisLivraison} XOF
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button className="bg-red-400 hover:bg-red-600 cursor-pointer ">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <LivraisonDetailModal livraison={livraison} />
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
                        {livraisons.map((livraison, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{livraison.refCommande}</p>
                                        <h3 className="font-semibold text-sm md:text-lg">${formatDate(livraison.createdAt)}</h3>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-muted text-muted-foreground">
                                        {livraison.nomLivreur}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-4 text-sm mt-2">

                                    <div>
                                        <span className="text-muted-foreground">Coût commande:</span>
                                        <span className="font-bold ml-2 text-primary">{livraison.totalAmount}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center gap-4 text-sm mt-2">
                                    <div>
                                        <span className="text-muted-foreground">Commission(%):</span>
                                        <span className="font-bold ml-2 text-primary">{livraison.fraisLivraison} XOF</span>
                                    </div>
                                    <div className="text-center cursor-pointer ">
                                        <LivraisonDetailModal livraison={livraison} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message si aucune livraison */}
                    {filteredCurrentLivraisons.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucune livraison trouvée</p>
                        </div>
                    )}

                    {/* Pagination */}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={filteredTotalPages}
                        totalElements={filteredLivraisons.length}
                        pageSize={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setItemsPerPage}
                    />

                </CardContent>
            </Card>
        </div>
    )
}