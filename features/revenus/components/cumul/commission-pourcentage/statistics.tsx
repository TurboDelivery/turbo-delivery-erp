import { Card } from "@/components/ui/card";
import { ICommission } from "@/features/revenus/types/commission.types";
import { CalendarClock, CalendarCheck2, CalendarPlus, CalendarCog } from "lucide-react";

interface StatisticsProps {
    commissionvariable: ICommission[];
}
export default function Statistics({ commissionvariable }: StatisticsProps) {

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

    
    // fonction pour determiner la somme des depenses du jour courant
    const totalCommissionJour = commissionvariable.reduce((total, commissionvariable) => {
        if (estDansIntervalle(commissionvariable.createdAt, debutJour, finJour)) {
            return total + (commissionvariable.commission || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses de la semaine courante
    const totalCommissionSemaine =  commissionvariable.reduce((total, commissionvariable) => {
        if (estDansIntervalle(commissionvariable.createdAt, debutSemaine, finSemaine)) {
            return total + (commissionvariable.commission || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses du mois courant
    const totalCommissionMois = commissionvariable.reduce((total, commissionvariable) => {
        if (estDansIntervalle(commissionvariable.createdAt, debutMois, finMois)) {
            return total + (commissionvariable.commission || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses de l'annee courante
    const totalCommissionAnnee = commissionvariable.reduce((total, commissionvariable) => {
        if (estDansIntervalle(commissionvariable.createdAt, debutAnnee, finAnnee)) {
            return total + (commissionvariable.commission || 0);
        }
        return total;
    }, 0);

    const stats = [
        {
            title: "revenus journaliers",
            value: totalCommissionJour,
            icon: <CalendarClock className="w-6 h-6" />,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            title: "revenus hebdomadaires",
            value: totalCommissionSemaine,
            icon: <CalendarCheck2 className="w-6 h-6" />,
            color: "text-red-500",
            bgColor: "bg-red-50",
        },
        {
            title: "revenus mensuels",
            value: totalCommissionMois,
            icon: <CalendarPlus className="w-6 h-6" />,
            color: "text-yellow-500",
            bgColor: "bg-yellow-50",
        },
        {
            title: "revenus annuels",
            value: totalCommissionAnnee,
            icon: <CalendarCog className="w-6 h-6" />,
            color: "text-purple-500",
            bgColor: "bg-purple-50",
        },
    ];

    return (
        <div className="w-full px-4 py-6">
            {/* Grid responsive avec 5 colonnes sur desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card
                        key={index}
                        className={`p-6 flex flex-col items-center justify-center rounded-2xl shadow-md hover:shadow-lg transition `}
                    >
                        <div className="flex justify-between items-start w-full gap-2">
                            {/* Colonne gauche : titre + valeur + saison */}
                            <div className="flex flex-col items-start gap-8">
                                <h3 className="text-md capitalize">{stat.title}</h3>
                                <div className="flex flex-col items-start">
                                    <p className={`text-xl font-bold ${stat.color} font-exo`}>
                                        {stat.value + " FCFA"}
                                    </p>
                                </div>
                            </div>

                            {/* Colonne droite : icône */}
                            <div>
                                <p
                                    className={`text-xs text-gray-400 font-exo flex items-center ${stat.bgColor} ${stat.color} p-2 rounded-full`}
                                >
                                    {stat.icon}
                                </p>
                            </div>
                        </div>

                    </Card>
                ))}
            </div>
        </div>
    );
}
