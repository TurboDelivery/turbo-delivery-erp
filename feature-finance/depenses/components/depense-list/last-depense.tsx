import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { IDepense } from "../../types/depense.type";
import { parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp, Calendar, Tag, DollarSign } from "lucide-react";

interface IDepenseListProps {
    depenses: IDepense[];
}

export function LastDepense({ depenses }: IDepenseListProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        
        try {
            const date = parseISO(dateString);
            return format(date, "dd MMMM yyyy", { locale: fr });
        } catch (error) {
            return dateString.split('T')[0];
        }
    }

    const formatTime = (dateString: string) => {
        if (!dateString) return "";
        
        try {
            const date = parseISO(dateString);
            return format(date, "HH:mm", { locale: fr });
        } catch (error) {
            return "";
        }
    }

    // Trier les dépenses par date (les plus récentes en premier)
    const sortedDepenses = [...depenses].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Récupérer les 5 dernières dépenses
    const lastDepenses = sortedDepenses.slice(0, 1);

    return (
        <div className="w-full px-4 py-6">
            <Card className="shadow-lg border-0">
                <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        <span className="font-bold text-lg md:text-xl font-exo text-blue-800">
                            Dernières Dépenses
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {lastDepenses.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            Aucune dépense enregistrée
                        </div>
                    ) : (
                        <div className="divide-y">
                            {lastDepenses.map((depense, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                                                {depense.libelle}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{formatDate(depense.dateDepense)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Tag className="h-3 w-3" />
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                        {depense.categorie.nomCategorie}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-red-600 font-bold text-sm md:text-base">
                                                <DollarSign className="h-4 w-4" />
                                                <span>{depense.montant.toLocaleString()} FCFA</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                à {formatTime(depense.dateDepense)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {index < lastDepenses.length - 1 && (
                                        <Separator className="my-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Résumé */}
                    {lastDepenses.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-b-lg">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">
                                    Total des dépenses
                                </span>
                                <span className="font-semibold text-blue-600">
                                    {depenses.reduce((sum, depense) => sum + depense.montant, 0).toLocaleString()} FCFA
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}