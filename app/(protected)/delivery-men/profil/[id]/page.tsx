import { LivreurDetail } from "@/types/livreur";
import Content from "./content";
import { getInfoLivreurById } from "@/src/livreurInfo/livreur-info.action";


interface TurboysPageProps {
    params: Promise<{ id: string }>; // Définit explicitement le type
}

export default async function Page(props: TurboysPageProps) {
    const params = await props.params;
    const { id } = params;
    const user = await getInfoLivreurById(id);

    if (!user) return <div>Aucun livreur trouvé</div>;

    return <Content user={user} />;
}

