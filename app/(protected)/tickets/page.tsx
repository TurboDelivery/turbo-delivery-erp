import Content from './content';
import { getAllDeliveryMan } from '@/src/actions/delivery-men.actions';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { getBonLivraisonTerminees } from '@/src/actions/bon-commande.action';

export default async function Page() {
    const livreurs = await getAllDeliveryMan();
    const restaurants = await getAllRestaurants();
    const data = await getBonLivraisonTerminees({ dates: { start: null, end: null } });
    const tickets = data?.map(bonLivraisonToTicket);
    
    return (<Content restaurants={restaurants} livreurs={livreurs} data={tickets} />);
}
