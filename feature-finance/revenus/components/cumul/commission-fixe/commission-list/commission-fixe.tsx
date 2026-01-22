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
import { Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import FilterRestaurant from "@/feature-finance/revenus/components/filtres/restaurant/filter-restaurant"
import FilterPeriode from "@/feature-finance/revenus/components/filtres/periode/filter-periode"
import { CommissionFixeDetailModal } from "./commission-fixe-detail-modal"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"

interface ICommissionFixe {
   commissionFixe?: ICommission[];
}
export default function CommissionFixe({commissionFixe}: ICommissionFixe) {

    // Formatage de la date pour mobile
    const formatDateForMobile = (date: string) => {
        return date.split(' ')[0] + ' ' + date.split(' ')[1].charAt(0)
    }

    return (
        <div className="">
            <Card className="shadow-lg border-0">
                <CardHeader className="">
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm md:text-xl lg:text-2xl">Liste des commissions(fixe)</p>
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 gap-2 font-normal font-exo text-sm"
                            >
                               <FilterPeriode/>
                               <FilterRestaurant/>
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
                                    <TableHead className="font-semibold text-white text-center hover:text-white">Date</TableHead>
                                    <TableHead className="font-semibold text-white text-center hover:text-white">Restaurant</TableHead>
                                    <TableHead className="font-semibold text-white text-center hover:text-white">Localisation</TableHead>
                                    <TableHead className="font-semibold text-white text-center hover:text-white">Commission</TableHead>
                                    <TableHead className="font-semibold text-white text-center hover:text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commissionFixe?.map((commissionFixe) => (
                                    <TableRow key={commissionFixe.commandeId} className="transition-colors">
                                        <TableCell className="font-medium text-center">{new Date().toLocaleDateString()}</TableCell>
                                        <TableCell className="font-semibold text-center">{commissionFixe.restaurantId}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize `}>{commissionFixe.localisation}</span>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <span className={` text-xs capitalize `}>
                                                {commissionFixe.commission} XOF
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="destructive" size="sm" className="bg-red-400 hover:bg-red-600 cursor-pointer">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault() }}>
                                                       <CommissionFixeDetailModal commissionFixee={commissionFixe} />
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
                        {commissionFixe?.map((commissionFixe) => (
                            <div
                                key={commissionFixe.id}
                                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{commissionFixe.createdAt}</p>
                                        <h3 className="font-semibold text-sm md:text-lg">{commissionFixe.nomRestaurant}</h3>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-muted text-muted-foreground">
                                        {commissionFixe.commission} XOF
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-4 text-sm mt-2">
                                    <div>
                                        <span className="text-muted-foreground">Localisation:</span>
                                        <span className="font-bold ml-2 text-primary">{commissionFixe.localisation}</span>
                                    </div>
                                    <div className="text-center">
                                        <button className="flex items-center px-3 py-1.5 text-xs border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground">
                                            <CommissionFixeDetailModal commissionFixee={commissionFixe} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4 border-t">
                        <p className="text-sm text-gray-600">
                            Affichage de 1 à {commissionFixe?.length} sur {commissionFixe?.length} commissions(fixe)
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>
                                Précédent
                            </Button>
                            <Button variant="outline" size="sm">
                                Suivant
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}