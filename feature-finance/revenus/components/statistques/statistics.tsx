import { Card } from "@/components/ui/card";
import { useQueryStates } from 'nuqs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { useRevenusPeriode } from "@/feature-finance/revenus/hooks/use-revenus-periode";

interface StatisticsProps {
    // Les props ne sont plus nécessaires car on utilise l'API
}

type PeriodeType = "jour" | "semaine" | "mois" | "annee" | "personnalise"

// Définition des parsers pour nuqs (identiques à ceux du composant graphique)
const graphiquesFiltersParsers = {
    periode: {
        defaultValue: 'mois' as PeriodeType,
        parse: (value: string) => {
            const validValues: PeriodeType[] = ['jour', 'semaine', 'mois', 'annee', 'personnalise']
            return validValues.includes(value as PeriodeType) ? value as PeriodeType : 'mois'
        },
        serialize: (value: PeriodeType) => value,
    },
    dateDebut: {
        defaultValue: '',
        parse: (value: string) => value || '',
        serialize: (value: string) => value,
    },
    dateFin: {
        defaultValue: '',
        parse: (value: string) => value || '',
        serialize: (value: string) => value,
    },
}

export default function Statistics({}: StatisticsProps) {
    // État des filtres avec nuqs (URL query parameters)
    const [filters, setFilters] = useQueryStates(graphiquesFiltersParsers)
    const { periode, dateDebut, dateFin } = filters

    // Utiliser le hook pour récupérer les revenus depuis l'API
    // Si des dates sont sélectionnées, utiliser "personnalise" comme période
    const actualPeriode = (dateDebut || dateFin) ? "personnalise" : periode
    const { data: revenusData, isLoading, error } = useRevenusPeriode({
        periode: actualPeriode,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
    })

    // Obtenir le titre selon la période
    const getTitrePeriode = () => {
        switch (actualPeriode) {
            case "jour":
                return "Aujourd'hui"
            case "semaine":
                return "Cette semaine"
            case "mois":
                return "Ce mois"
            case "annee":
                return "Cette année"
            case "personnalise":
                if (dateDebut && dateFin) {
                    if (dateDebut === dateFin) {
                        return `Le ${dateDebut}`
                    } else {
                        return `Du ${dateDebut} au ${dateFin}`
                    }
                } else if (dateDebut) {
                    return `À partir du ${dateDebut}`
                } else if (dateFin) {
                    return `Jusqu'au ${dateFin}`
                }
                return "Période personnalisée"
            default:
                return "Ce mois"
        }
    }

    // Fonction pour formater les nombres avec séparateurs de milliers
    const formaterMontant = (montant: number) => {
        return montant.toLocaleString('fr-FR');
    };

    const titre = getTitrePeriode()
    const revenusPeriode = revenusData?.revenu || 0
    const totalTransactions = revenusData?.total || 0

    // Statistique unique basée sur la période sélectionnée
    const stat = {
        title: `Revenus ${titre}`,
        value: formaterMontant(revenusPeriode),
        icon: <TrendingUp className="w-6 h-6" />,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
    };

    // État de chargement
    if (isLoading) {
        return (
            <div className="w-full px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
                    <Card className="p-6 flex flex-col items-center justify-center rounded-2xl shadow-md">
                        <div className="animate-pulse w-full">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    // État d'erreur
    if (error) {
        console.error('Erreur dans Statistics:', error) // Debug
        
        return (
            <div className="w-full px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
                    <Card className="p-6 flex flex-col items-center justify-center rounded-2xl shadow-md border-red-200">
                        <div className="text-red-500 text-center">
                            <p className="font-semibold">Erreur de chargement</p>
                            <p className="text-sm">Impossible de charger les revenus</p>
                            <p className="text-xs mt-2 text-gray-500">
                                {error instanceof Error ? error.message : 'Erreur inconnue'}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                {/* Filtre personnalisé toujours visible */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setFilters({ dateDebut: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Date de début"
                    />
                    <span className="text-gray-500">à</span>
                    <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setFilters({ dateFin: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Date de fin"
                    />
                </div>

                {/* Select à côté du filtre personnalisé */}
                <Select value={periode} onValueChange={(value: PeriodeType) => setFilters({ periode: value })}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="jour">Aujourd'hui</SelectItem>
                        <SelectItem value="semaine">Cette semaine</SelectItem>
                        <SelectItem value="mois">Ce mois</SelectItem>
                        <SelectItem value="annee">Cette année</SelectItem>
                    </SelectContent>
                </Select>

                {(periode !== 'mois' || dateDebut || dateFin) && (
                    <button
                        onClick={() => setFilters({ periode: 'mois', dateDebut: '', dateFin: '' })}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Carte de statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
                <Card
                    className="p-6 flex flex-col items-center justify-center rounded-2xl shadow-md hover:shadow-lg transition"
                >
                    <div className="flex justify-between items-start w-full gap-2">
                        <div className="flex flex-col items-start gap-8">
                            <h3 className="text-md capitalize">{stat.title}</h3>
                            <div className="flex flex-col items-start">
                                <p className={`text-xl font-bold ${stat.color} font-exo`}>
                                    {stat.value + " FCFA"}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p
                                className={`text-xs text-gray-400 font-exo flex items-center ${stat.bgColor} ${stat.color} p-2 rounded-full`}
                            >
                                {stat.icon}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}