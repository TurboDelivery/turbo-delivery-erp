import { Card } from "@/components/ui/card";
import { CalendarClock, CalendarCheck2, CalendarPlus, CalendarCog } from "lucide-react";
import { IInvestissement } from "@/feature-finance/revenus/types/revenus.types";

interface StatisticsProps {
    investissements?: IInvestissement[];
}

export default function Statistics({ investissements }: StatisticsProps) {

    // Fonction pour déterminer le total des investissements avec vérification
    const totalInvestissements = investissements?.reduce(
        (total, investissement) => {
            // Vérifier que montant est un nombre valide
            const montant = Number(investissement.montant);
            return total + (isNaN(montant) ? 0 : montant);
        },
        0
    ) || 0; // Valeur par défaut 0 si undefined

    const stats = [
        {
            title: "Total des prêts",
            value: totalInvestissements.toLocaleString(), // Plus de condition ternaire ici
            icon: <CalendarClock className="w-6 h-6" />,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            title: "Prêt remboursé ",
            value: "125000",
            icon: <CalendarCheck2 className="w-6 h-6" />,
            color: "text-yellow-500",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Prêt non remboursé",
            value: "0",
            icon: <CalendarPlus className="w-6 h-6" />,
            color: "text-red-500",
            bgColor: "bg-red-50",
        },
    ];

    return (
        <div className="w-full px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card
                        key={index}
                        className={`p-6 flex flex-col items-center justify-center rounded-2xl shadow-md hover:shadow-lg transition`}
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
                ))}
            </div>
        </div>
    );
}