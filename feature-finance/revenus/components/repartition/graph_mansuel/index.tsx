"use client"

import { useQueryStates } from 'nuqs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRevenusDetails } from "@/feature-finance/revenus/hooks/use-revenus-details"
import { RevenusMensuellesChart } from "./revenus_mesuelles"
import { RevenusHebdomadaireChart } from "./revenus-hebdomadaire"
import { RevenusJournalierChart } from "./revenus-journaliere"

interface RevenusQuotidiensProps {
    // Les props ne sont plus nécessaires car on utilise l'API
}

type PeriodeType = "jour" | "semaine" | "mois" | "annee" | "personnalise"

// Définition des parsers pour nuqs
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

export default function RevenusQuotidiens({}: RevenusQuotidiensProps) {
    // État des filtres avec nuqs (URL query parameters)
    const [filters, setFilters] = useQueryStates(graphiquesFiltersParsers)
    
    const { periode, dateDebut, dateFin } = filters

    // Utiliser le hook pour récupérer les données depuis l'API
    // Si des dates sont sélectionnées, utiliser "personnalise" comme période
    const actualPeriode = (dateDebut || dateFin) ? "personnalise" : periode
    const { data: revenusData, isLoading, error } = useRevenusDetails({
        periode: actualPeriode,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
    })

    const livraisons = revenusData?.livraisons || []
    const commissions = revenusData?.commissions || []

    // Déterminer quel graphique afficher selon la période
    const renderGraphique = () => {
        switch (actualPeriode) {
            case "jour":
                return <RevenusJournalierChart livraisons={livraisons} commissions={commissions} />
            case "semaine":
                return <RevenusHebdomadaireChart livraisons={livraisons} commissions={commissions} />
            case "mois":
                return <RevenusMensuellesChart livraisons={livraisons} commissions={commissions} periodeType="mois" />
            case "annee":
                return <RevenusMensuellesChart livraisons={livraisons} commissions={commissions} periodeType="annee" />
            case "personnalise":
                return <RevenusMensuellesChart livraisons={livraisons} commissions={commissions} periodeType="personnalise" />
            default:
                return <RevenusMensuellesChart livraisons={livraisons} commissions={commissions} periodeType="mois" />
        }
    }

    // Gestionnaire pour réinitialiser tous les filtres
    const resetFilters = () => {
        setFilters({
            periode: 'mois',
            dateDebut: '',
            dateFin: '',
        })
    }

    
    // État de chargement
    if (isLoading) {
        return (
            <div className="w-full px-4 py-6 -mt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                 
                </div>
                
                <div className="w-full px-6 py-8 shadow-lg rounded-lg border border-gray-200">
                    <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    // État d'erreur
    if (error) {
        return (
            <div className="w-full px-4 py-6 -mt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  
                </div>
                
                <div className="w-full px-6 py-8 shadow-lg rounded-lg border border-gray-200">
                    <div className="text-red-500 text-center py-8">
                        <p className="font-semibold">Erreur de chargement</p>
                        <p className="text-sm">Impossible de charger les données du graphique</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full px-4 py-6 -mt-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              
            </div>
            
            <div className="w-full px-6 py-8 shadow-lg rounded-lg border border-gray-200">
                <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Période sélectionnée:</span>
                        <span className="font-semibold text-blue-600">
                            {actualPeriode === "jour" && "Aujourd'hui"}
                            {actualPeriode === "semaine" && "Cette semaine"}
                            {actualPeriode === "mois" && "Ce mois"}
                            {actualPeriode === "annee" && "Cette année"}
                            {actualPeriode === "personnalise" && dateDebut && dateFin && `${dateDebut} à ${dateFin}`}
                            {actualPeriode === "personnalise" && (!dateDebut || !dateFin) && "Personnalisée (sélectionnez des dates)"}
                        </span>
                    </div>
                </div>
                
                <div className="mt-8 h-[28rem]">
                    {renderGraphique()}
                </div>
            </div>
        </div>
    )
}