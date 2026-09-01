import Content from './content';
import { notFound } from 'next/navigation';
import { getPaginationCourseExterne } from '@/src/actions/courses.actions';
import { getLivreursDisponible } from '@/src/actions/delivery-men.actions';

interface PageProps {
    params: Promise<{ id: string }>;
}

// ✅ Expression régulière pour valider un UUID (v4)
const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page(props: PageProps) {
    const params = await props.params;
    const restaurantId = params?.id;

    // 🛑 Vérifie si l'ID est présent et valide
    if (!restaurantId || !uuidRegex.test(restaurantId)) {
        // Option 1 : afficher une page 404 standard
        notFound();

        // Option 2 : si tu veux plutôt ne rien afficher :
        // return null;
    }

    // 🔹 Récupération des données
    const delivers = (await getLivreursDisponible()) ?? [];
    const data = await getPaginationCourseExterne(restaurantId, 0, 10);

    return <Content initialData={data} delivers={delivers} restaurantId={restaurantId} />;
}
