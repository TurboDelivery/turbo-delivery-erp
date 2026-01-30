import * as React from "react"
import { Filter } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ICategorieDepense } from "@/features/depenses/types/categorie-depense.type"

interface CategorieFiltersProps {
    categorie_depenses: ICategorieDepense[];
    handleEnumFilterChange: (filterName: string, value: string) => void;
    value: string | undefined;
    placeholder?: string;
    className?: string;
}

export default function FilterCategorie({ 
    categorie_depenses, 
    handleEnumFilterChange, 
    value, 
    placeholder = "Catégorie",
    className = ""
}: CategorieFiltersProps) {
    // Gestionnaire de changement de catégorie
    const handleCategoryChange = (selectedValue: string) => {
        handleEnumFilterChange('categorie', selectedValue);
    }

    return (
        <div className={`relative ${className}`}>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={value || ""} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Catégories</SelectLabel>
                        {/* Option pour afficher toutes les catégories */}
                        <SelectItem value="all">
                            Toutes les catégories
                        </SelectItem>
                        {categorie_depenses.map((categorie) => (
                            <SelectItem key={categorie.id} value={categorie.id}>
                                {categorie.nomCategorie}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}