import { redirect } from 'next/navigation';

/** Page fusionnée dans la Liste unifiée des partenaires (vue « Nouveaux »). */
export default function Restaurants() {
  redirect('/restaurants?statut=nouveaux');
}
