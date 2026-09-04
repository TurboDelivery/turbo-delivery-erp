import CarteStat, { GrilleStats } from "@/components/commons/CarteStat";
import type { TonStat } from "@/components/commons/CarteStat";
import { ILivraison } from "@/features/revenus/types/livraison.types";
import { formatMontant } from "@/utils/format.utils";
import { CalendarClock, CalendarCheck2, CalendarPlus, CalendarCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatisticsProps {
    /** La lecture a echoue : les cartes rendent un tiret, pas un zero calcule sur une
     * liste vide. Un montant a zero se lit comme un fait ; le tiret dit qu'on ne sait pas. */
    isError?: boolean;
    /** Lecture en cours : les cartes rendent leur squelette. */
    isLoading?: boolean;
    livraisons: ILivraison[];
}
export default function Statistics({ livraisons, isError = false, isLoading = false }: StatisticsProps) {

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
    const totalLivraisonJour = livraisons.reduce((total, livraisons) => {
        if (estDansIntervalle(livraisons.createdAt, debutJour, finJour)) {
            return total + (livraisons.fraisLivraison || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses de la semaine courante
    const totalLivraisonSemaine =  livraisons.reduce((total, livraisons) => {
        if (estDansIntervalle(livraisons.createdAt, debutSemaine, finSemaine)) {
            return total + (livraisons.fraisLivraison || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses du mois courant
    const totalLivraisonMois = livraisons.reduce((total, livraisons) => {
        if (estDansIntervalle(livraisons.createdAt, debutMois, finMois)) {
            return total + (livraisons.fraisLivraison || 0);
        }
        return total;
    }, 0);
    
    // fonction pour determiner la somme des depenses de l'annee courante
    const totalLivraisonAnnee = livraisons.reduce((total, livraisons) => {
        if (estDansIntervalle(livraisons.createdAt, debutAnnee, finAnnee)) {
            return total + (livraisons.fraisLivraison || 0);
        }
        return total;
    }, 0);

    // Un ton plutot qu'une couleur ecrite en dur : le mode sombre reviendra et
    // ne doit demander aucune retouche ici.
    const stats: { title: string; value: number; icon: LucideIcon; ton: TonStat }[] = [
        {
            title: "revenus journaliers",
            value: totalLivraisonJour,
            icon: CalendarClock,
            ton: "primaire",
        },
        {
            title: "revenus hebdomadaires",
            value: totalLivraisonSemaine,
            icon: CalendarCheck2,
            ton: "danger",
        },
        {
            title: "revenus mensuels",
            value: totalLivraisonMois,
            icon: CalendarPlus,
            ton: "attention",
        },
        {
            title: "revenus annuels",
            value: totalLivraisonAnnee,
            icon: CalendarCog,
            ton: "primaire",
        },
    ];

    return (
        <div className="w-full px-4 py-6">
            <GrilleStats colonnes={4}>
                {stats.map((stat, index) => (
                    <CarteStat
                        isError={isError}
                        isLoading={isLoading}
                        key={index}
                        libelle={stat.title}
                        valeur={formatMontant(stat.value)}
                        icone={stat.icon}
                        ton={stat.ton}
                    />
                ))}
            </GrilleStats>
        </div>
    );
}
