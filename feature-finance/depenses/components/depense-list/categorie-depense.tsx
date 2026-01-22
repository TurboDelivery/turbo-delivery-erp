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
import { CreerCategorieModal } from "./creer-categorie"
import { ICategorieDepense } from "@/feature-finance/depenses/types/categorie-depense.type"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { CategorieDetailModal } from "./detail/categorie-detail"
import { ModifierCategorieModal } from "../modifier/modifier-categorie-modal"
import SupprimerCategorieModal from "../supprimer/supprimer-categorie-modal"

interface CategorieDepenseProps {
    categorie_depenses: ICategorieDepense[]
}
export function CategorieDepenseList({ categorie_depenses }: CategorieDepenseProps) {
    // Couleur des résultats
    const getCategoriesStyle = (nomCategorie: string) => {
        const colors = [
            "bg-red-500 text-white",
            "bg-green-500 text-white",
            "bg-blue-500 text-white",
            "bg-yellow-500 text-white",
            "bg-pink-500 text-white",
            "bg-purple-500 text-white",
        ];
        // Générer une couleur cohérente basée sur le nom de la catégorie
        const hash = nomCategorie.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomIndex = hash % colors.length;
        return colors[randomIndex];
    }

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



    return (
        <div className="w-full px-4 py-6">
            <Card className="shadow-lg border-0">
                <CardHeader className="">
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm  md:text-2xl font-exo">Liste des catégories</p>
                            <div
                                className="flex justify-center items-center gap-2 font-normal text-sm"
                            >
                                {/* <FilterCategorie categorie_depenses={categorie_depenses}/> */}
                                <CreerCategorieModal />
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Version Desktop */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="">
                                <TableRow className="bg-red-500 hover:bg-red-600">
                                    <TableHead className="font-semibold bg-[#fb2c36] text-gray-700 text-center text-white">Date</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-gray-700 text-center text-white">Nom </TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-gray-700 text-center text-white">Montant total</TableHead>
                                    <TableHead className="font-semibold bg-[#fb2c36] text-gray-700 text-center text-white">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categorie_depenses.map((categorie_depense) => (
                                    <TableRow key={categorie_depense.id} className="transition-colors">
                                        <TableCell className="font-medium text-center border-b-2">
                                            {formatDate(categorie_depense.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-center border-b-2">
                                            <span className={`font-semibold rounded-full px-2 py-1 text-center ${getCategoriesStyle(categorie_depense.nomCategorie)}`}>
                                                {categorie_depense.nomCategorie}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center border-b-2">
                                            {categorie_depense.totalDepense} FCFA
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
                                                        <CategorieDetailModal categorie={categorie_depense} />
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <ModifierCategorieModal categorieDepense={categorie_depense} />
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <SupprimerCategorieModal
                                                            categorieDepense={categorie_depense}
                                                        />
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
                        {categorie_depenses.map((categorie_depense) => (
                            <div key={categorie_depense.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-sm text-gray-500">
                                        {formatDateForMobile(categorie_depense.createdAt)}
                                    </p>
                                    <h3 className={`font-semibold rounded-md px-2 text-sm  ${getCategoriesStyle(categorie_depense.nomCategorie)}`}>
                                        {categorie_depense.nomCategorie}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Montant total :</span>
                                        <span className="text-black ml-2">{categorie_depense.totalDepense} FCFA</span>
                                    </div>
                                    <div className="text-right">
                                        <Button variant="default" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
                                        </Button>
                                        <ModifierCategorieModal categorieDepense={categorie_depense} />
                                        <SupprimerCategorieModal categorieDepense={categorie_depense} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4 border-t">
                        <p className="text-sm text-gray-600">
                            Affichage de 1 à {categorie_depenses.length} sur {categorie_depenses.length} catégories
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