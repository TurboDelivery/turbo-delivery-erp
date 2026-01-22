import { Card } from "@/components/ui/card";
import { Boxes, CalendarClock, CalendarCheck2, CalendarPlus, CalendarCog } from "lucide-react";
import { ICategorieDepense } from "@/feature-finance/depenses/types/categorie-depense.type";
import { IDepense } from "@/feature-finance/depenses/types/depense.type";

interface StatisticsProps {
    categorie_depenses: ICategorieDepense[];
    depenses: IDepense[];
}

export default function Statistics({ categorie_depenses, depenses }: StatisticsProps) {
    // Obtenir la date actuelle
    const aujourdHui = new Date();
    const debutJour = new Date(aujourdHui);
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(aujourdHui);
    finJour.setHours(23, 59, 59, 999);
    
    // Obtenir le début et la fin de la semaine (lundi à dimanche)
    const debutSemaine = new Date(aujourdHui);
    debutSemaine.setDate(aujourdHui.getDate() - aujourdHui.getDay() + (aujourdHui.getDay() === 0 ? -6 : 1));
    debutSemaine.setHours(0, 0, 0, 0);
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);
    finSemaine.setHours(23, 59, 59, 999);
    
    // Obtenir le début et la fin du mois
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    debutMois.setHours(0, 0, 0, 0);
    const finMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() + 1, 0);
    finMois.setHours(23, 59, 59, 999);
    
    // Obtenir le début et la fin de l'année
    const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);
    debutAnnee.setHours(0, 0, 0, 0);
    const finAnnee = new Date(aujourdHui.getFullYear(), 11, 31);
    finAnnee.setHours(23, 59, 59, 999);

    // Fonction pour vérifier si une date est dans un intervalle
    const estDansIntervalle = (dateString: string, debut: Date, fin: Date) => {
        try {
            const date = new Date(dateString);
            return date >= debut && date <= fin;
        } catch (error) {
            return false;
        }
    };

    // fonction pour determiner la somme des categories de depenses
    const totalCategories = categorie_depenses.reduce((total, categorie_depense) => 
        total + (categorie_depense.totalDepense || 0), 0);
    
    // fonction pour determiner la somme des depenses du jour courant
    const totalDepensesJour = depenses.reduce((total, depense) => {
        if (estDansIntervalle(depense.dateDepense, debutJour, finJour)) {
            return total + (depense.montant || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses de la semaine courante
    const totalDepensesSemaine = depenses.reduce((total, depense) => {
        if (estDansIntervalle(depense.dateDepense, debutSemaine, finSemaine)) {
            return total + (depense.montant || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses du mois courant
    const totalDepensesMois = depenses.reduce((total, depense) => {
        if (estDansIntervalle(depense.dateDepense, debutMois, finMois)) {
            return total + (depense.montant || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses de l'annee courante
    const totalDepensesAnnee = depenses.reduce((total, depense) => {
        if (estDansIntervalle(depense.dateDepense, debutAnnee, finAnnee)) {
            return total + (depense.montant || 0);
        }
        return total;
    }, 0);

    // Configuration des statistiques à afficher
    const stats = [
        {
            title: "Catégories de dépenses",
            value: categorie_depenses.length.toString(),
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            icon: <Boxes className="h-5 w-5" />,
        },
        {
            title: "Dépenses du jour",
            value: totalDepensesJour.toLocaleString(),
            color: "text-green-600",
            bgColor: "bg-green-100",
            icon: <CalendarClock className="h-5 w-5" />,
        },
        {
            title: "Dépenses de la semaine",
            value: totalDepensesSemaine.toLocaleString(),
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            icon: <CalendarCheck2 className="h-5 w-5" />,
        },
        {
            title: "Dépenses du mois",
            value: totalDepensesMois.toLocaleString(),
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            icon: <CalendarPlus className="h-5 w-5" />,
        },
        {
            title: "Dépenses de l'année",
            value: totalDepensesAnnee.toLocaleString(),
            color: "text-red-600",
            bgColor: "bg-red-100",
            icon: <CalendarCog className="h-5 w-5" />,
        },
    ];

    return (
        <div className="w-full px-4 py-6">
            {/* Grid responsive avec 5 colonnes sur desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {stats.map((stat, index) => (
                    <Card   
                        key={index}
                        className={`p-6 flex flex-col items-center justify-center rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer border-0`}
                    >
                        <div className="flex justify-between items-start w-full gap-2">
                            {/* Colonne gauche : titre + valeur + saison */}
                            <div className="flex flex-col items-start gap-2">
                                <h3 className="text-sm font-medium text-gray-600 capitalize">{stat.title}</h3>
                                <div className="flex flex-col items-start mt-2">
                                    <p className={`text-xl font-bold ${stat.color} font-exo`}>
                                        {stat.title === "Catégories de dépenses" 
                                            ? stat.value 
                                            : stat.value + " FCFA"}
                                    </p>
                                </div>
                            </div>

                            {/* Colonne droite : icône */}
                            <div>
                                <div
                                    className={`p-2 rounded-full ${stat.bgColor}`}
                                >
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}