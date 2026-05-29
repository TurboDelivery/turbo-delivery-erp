import { redirect } from 'next/navigation';

/**
 * 2026-05-29 — La page racine {@code /delivery-men} est désormais une
 * redirection 308 (permanente) vers {@code /delivery-men/men}, la nouvelle
 * vue Coursiers.
 *
 * <p>Contexte : depuis l'introduction des trois sous-pages
 * {@code /delivery-men/men}, {@code /delivery-men/creneaux} et
 * {@code /delivery-men/performance}, l'ancien tableau racine était devenu
 * une page orpheline — la sidebar ne pointait plus dessus mais certains
 * liens internes (TurboysButton, file-attente) et les favoris utilisateurs
 * la maintenaient en vie. Pour éviter la double maintenance et garantir
 * que tout le monde atterrisse sur la nouvelle vue, on redirige
 * systématiquement au niveau du serveur.</p>
 *
 * <p>L'ancien contenu (Content + getToutLivreurStatus + allRestaurants)
 * reste sur disque dans {@code (valided)/content.tsx} : il pourra être
 * supprimé dans une future passe de nettoyage une fois qu'on sera certain
 * qu'aucune autre route n'en dépend.</p>
 */
export default function DeliveryMenLegacyPage() {
  redirect('/delivery-men/men');
}
