
export interface Turboys {
    id: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    telephone: string;
    domicile: string;
    email: string;
    typeDocument: string;
    numeroDocument: string;
    type: string;
    nomVehicule: string;
    immatriculationVehicule: string;
}
import { CreneauID } from "@/types/creneau-byId";
import Content from "./content";
import { getInfoLivreurById } from "@/src/livreurInfo/livreur-info.action";
import { getCreneauById } from "@/src/creneau-livreur/creneau-livreur.action";
interface TurboysPageProps {
    params: { id: string }; // Définit explicitement le type
}

export default async function UserPage({ params }: TurboysPageProps) {
    const { id } = params;  // <-- enlevé l'await qui est incorrect

    // Les deux lectures relevent desormais leur exception. La rattraper ici sans
    // rien en faire affichait « Aucun livreur trouve » sur une panne : une absence
    // annoncee a la place d un echec. On laisse remonter jusqu a la frontiere
    // d erreur du segment, qui cadre le message et propose de reessayer.
    const user = await getInfoLivreurById(id);
    const dataCreneau: CreneauID[] | null = await getCreneauById(id);

    if (!user) {
        return <div>Aucun livreur trouvé</div>;
    }

    return <Content user={user} dataCreneau={dataCreneau ?? []} />;
}

