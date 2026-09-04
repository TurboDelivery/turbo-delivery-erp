
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
import FilterPeriode from "@/features/revenus/components/filtres/periode/filter-periode"
import { CommissionVariableDetailModal } from "./commission-pourcentage-detail-modal"
import { ICommission } from "@/features/revenus/types/commission.types"
import { Pagination } from "./pagination"
import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import FilterRestaurantComponent from "./filtres/commission-restaurant-filter"
import CommissionDateFilter from "./filtres/commission-date-filter"
interface CommissionVariableListProps {
    commissionvariable?: ICommission[];
}
export default function CommissionPourcentageList({ commissionvariable }: CommissionVariableListProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [filters, setFilters] = useState({
        createdAt: '',
        nomRestaurant: '',
        montant: '',
        dateDepense: ''
    })

    // fonction pour formater la createdAt
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
   
       // Formatage de la date pour mobile
       const formatDateForMobile = (dateString: string) => {
           if (!dateString) return "";
   
           try {
               const date = parseISO(dateString);
               return format(date, "dd/MM/yy", { locale: fr });
           } catch (error) {
               return dateString.split('T')[0]; // Juste la partie date avant le T
           }
       }

    // Formatage de la date pour desktop
    const formatDateTimeForDesktop = (date: string) => {
        return date.split(' ')[0] + ' ' + date.split(' ')[1]
    }

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
        setCurrentPage(1)
    }
    
    const filteredCommissionvariable = useMemo(() => {
        return commissionvariable?.filter(commission => {
            if (filters.nomRestaurant && commission.nomRestaurant !== filters.nomRestaurant) return false
            if (filters.montant) {
                const montantValue = parseFloat(filters.montant)
                if (isNaN(montantValue) || commission.totalAmount !== montantValue) return false
            }
            if (filters.dateDepense) {
                const commissionDate = new Date(commission.createdAt).toISOString().split('T')[0]
                if (commissionDate !== filters.dateDepense) return false
            }
            return true
        })
    }, [commissionvariable, filters])
    
    // Calcul des variables pour la pagination
    const totalPages = Math.ceil((filteredCommissionvariable?.length || 0) / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = filteredCommissionvariable?.slice(startIndex, endIndex) || []

    return (
        <div className="">
            <Card className="shadow-lg border-0">
                <CardHeader className="">
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm md:text-xl lg:text-2xl">Liste des commissions(%)</p>
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 gap-2 font-normal font-exo text-sm"
                            >
                                <CommissionDateFilter onFilterChange={handleFilterChange} />
                                <FilterRestaurantComponent 
                                    commissions={commissionvariable} 
                                    onFilterChange={handleFilterChange}
                                />
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
                                    <TableHead className="font-semibold bg-accent text-white text-center hover:text-white">Date</TableHead>
                                    <TableHead className="font-semibold text-white bg-accent text-center hover:text-white">Restaurant</TableHead>
                                    <TableHead className="font-semibold text-white bg-accent text-center hover:text-white">Localisation</TableHead>
                                    <TableHead className="font-semibold text-white bg-accent text-center hover:text-white">Montant de la commande</TableHead>
                                    <TableHead className="font-semibold text-white bg-accent text-center hover:text-white">Commission(%)</TableHead>
                                    <TableHead className="font-semibold text-white bg-accent text-center hover:text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentItems.map((commission) => (
                                    <TableRow key={commission.commandeId} className="transition-colors ">
                                        <TableCell className="font-medium text-center">{formatDate(commission.createdAt)}</TableCell>
                                        <TableCell className="font-semibold text-center">{commission.nomRestaurant}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize `}>{commission.localisation}</span>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <span className={` text-xs capitalize `}>
                                                {commission.totalAmount} XOF
                                            </span>
                                        </TableCell>
                                        
                                        <TableCell className="text-center">
                                            <span className={` text-xs capitalize `}>
                                                10%({commission.commission + " XOF"})
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={(e) => { (e.preventDefault()) }}>
                                                        <CommissionVariableDetailModal commissionVariable={commission} />
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
                        {currentItems.map((commission) => (
                            <div
                                key={commission.commandeId}
                                className="border rounded-lg p-4 shadow-xs bg-card text-card-foreground"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">-</p>
                                        <h3 className="font-semibold text-sm md:text-lg">{commission.nomRestaurant}</h3>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-muted-surface text-muted-foreground">
                                        {commission.localisation}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">commande:</span>
                                        <span className="font-bold ml-2">{commission.totalAmount}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">commission:</span>
                                        <span className="font-bold ml-2">{commission.commission} XOF</span>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center gap-4 text-sm mt-2">

                                    <div className="text-center">
                                        <button className="flex items-center px-3 py-1.5 text-xs border border-input rounded-md bg-background hover:bg-accent-surface hover:text-accent-surface-foreground">
                                            <Eye className="h-4 w-4 mr-1" />
                                            <span className="hidden md:inline">Détails</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredCommissionvariable?.length || 0}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1) }}
                    />

                </CardContent>
            </Card>
        </div>
    )
}