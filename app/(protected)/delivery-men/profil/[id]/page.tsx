import { LivreurDetail } from "@/types/livreur";
import Content from "./content";
import { getInfoLivreurById } from "@/src/livreurInfo/livreur-info.action";


interface TurboysPageProps {
    params: { id: string }; // Définit explicitement le type
}

export default async function Page({ params }: TurboysPageProps) {
    const { id } = params;
    const user = await getInfoLivreurById(id);

    if (!user) return <div>Aucun utilisateur trouvé</div>;

    return <Content user={user} />;
}

