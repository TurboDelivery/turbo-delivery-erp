/**
 * Les bancs.
 *
 * <h3>La garde est dans le MIDDLEWARE, pas ici</h3>
 * <p>Elle porte sur l'hôte : le serveur public rend un vrai 404, un poste de
 * développement sert les bancs. Le critère ne peut pas être `NODE_ENV`, parce que la
 * vérification de ce projet passe par le build local `.next/standalone`, qui tourne en
 * production — une garde sur `NODE_ENV` y fermait les bancs et obligeait à la retirer à
 * la main avant chaque relecture.</p>
 *
 * <p>`force-dynamic` empêche Next de pré-calculer ces pages au build : pré-calculées,
 * elles seraient servies comme des fichiers statiques et le middleware ne les verrait
 * pas passer.</p>
 */
export const dynamic = 'force-dynamic';

export default function ApercuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
