
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

    let user = null;
    let dataCreneau: CreneauID[] | null = null;

    try {
        user = await getInfoLivreurById(id);
    } catch (error) {
       
    }

    try {
        dataCreneau = await getCreneauById(id);
    } catch (error) {
        
    }

    if (!user) {
        return <div>Aucun utilisateur trouvé</div>;
    }

    return <Content user={user} dataCreneau={dataCreneau ?? []} />;
}

