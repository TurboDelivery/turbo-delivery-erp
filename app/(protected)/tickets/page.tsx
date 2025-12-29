
import { getBonLivraisonAll } from '@/src/actions/bon-commande.action';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import Content from './content';

export default async function Page() {
    const data = await getBonLivraisonAll(0, 10, { dates: { start: null, end: null } });
    const restaurants = await getAllRestaurants();
    // return (<Content initialData={data} restaurants={restaurants} />);
    return (<Content />);
}
