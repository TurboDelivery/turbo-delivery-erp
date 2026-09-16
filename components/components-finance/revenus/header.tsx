interface RevenusHeaderProps {
  title: string;
  /** Une phrase qui dit ce que l'écran montre, quand le titre seul ne suffit pas. */
  sousTitre?: string;
}

/**
 * Le titre des écrans du groupe Revenus.
 *
 * <h3>Ce qui change, et pourquoi à la source</h3>
 * <p>Il rendait un `h2` en `capitalize text-primary` : le rouge de marque, et une majuscule
 * forcée sur chaque mot, donc « Gestion Des Investissements ». Partout ailleurs dans l'ERP
 * un titre d'écran est un `h1` en `text-foreground`, dans la casse où il a été écrit. Quatre
 * pages passaient par ce composant, donc quatre pages s'écartaient de la règle : le corriger
 * ici les aligne d'un seul geste, là où le contourner écran par écran aurait laissé la
 * divergence en place pour les trois autres.</p>
 *
 * <p>Le rouge de marque est réservé à ce qui appelle une action. Un titre informe, il ne
 * demande rien : il n'a pas à porter l'accent, et l'user en couvrant toute une page finit
 * par ne plus rien signaler du tout.</p>
 *
 * <p>Le niveau compte aussi : un `h2` sans `h1` au-dessus laisse un trou dans la hiérarchie
 * des titres, et un lecteur d'écran qui navigue de titre en titre commence dans le vide.</p>
 */
export default function RevenusHeader({ title, sousTitre }: RevenusHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {sousTitre && <p className="mt-1 text-sm text-muted">{sousTitre}</p>}
    </div>
  );
}
