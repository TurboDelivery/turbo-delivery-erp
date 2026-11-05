import { ImportTicketsView } from '@/components/tickets/import/import-tickets-view';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

export const metadata = { title: 'Import de tickets' };

/**
 * L'import de tickets depuis un tableur.
 *
 * <p>La liste des partenaires est lue ICI, sur le serveur, comme le fait la page de
 * saisie voisine : elle sert à rattacher les noms du fichier, et la demander depuis le
 * navigateur retarderait l'écran d'un aller-retour sur une donnée qui ne change pas.</p>
 */
export default async function ImportTicketsPage() {
  const restaurants = await getAllRestaurants();
  return <ImportTicketsView restaurants={restaurants} />;
}
