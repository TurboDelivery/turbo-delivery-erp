interface StatMiniProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

/**
 * Pas d'icone, et c'est delibere.
 *
 * <p>La prop `icon` etait DECLAREE OBLIGATOIRE, destructuree sous le nom `Icon`, et
 * jamais rendue : les quatre appelants passaient consciencieusement `Users`, `Ticket`,
 * `Wallet` et `TrendingUp`, qui partaient a la poubelle. Le contrat de type exigeait
 * donc une donnee dont le composant ne faisait rien.</p>
 *
 * <p>On retire la prop plutot que d'afficher l'icone : ce bandeau est une ligne de
 * statistiques compacte, pas une carte KPI, et lui ajouter des icones changerait
 * l'apparence d'un ecran en production. Si les icones sont voulues ici, c'est une
 * decision d'interface a prendre en voyant l'ecran.</p>
 */
export default function StatMini({ label, value, sub, highlight }: StatMiniProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</span>
      <span
        className={[
          'text-base sm:text-xl font-bold tabular-nums wrap-break-word',
          // La valeur mise en avant etait peinte en `text-green-600`, une couleur ecrite en
          // dur sans variante sombre : la bascule clair/sombre de l'en-tete ne l'atteignait
          // pas, alors que c'est le montant que le DGA lit avant de viser. Le jeton du theme
          // suit les deux themes. Sa forme nue `text-success-soft-foreground` est un remplissage : en texte
          // sur carte claire elle tombe a 2,19 de contraste, d'ou la variante -soft-foreground.
          highlight ? 'text-success-soft-foreground' : 'text-foreground',
        ].join(' ')}
      >
        {value}
        {sub && <span className="ml-1 text-sm font-medium text-muted">{sub}</span>}
      </span>
    </div>
  );
}
