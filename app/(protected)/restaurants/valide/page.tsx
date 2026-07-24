import { redirect } from 'next/navigation';

/** Page fusionnée dans la Liste unifiée des partenaires (vue « Partiellement validés »). */
export default function Restaurants() {
  redirect('/restaurants?statut=partiels');
}
