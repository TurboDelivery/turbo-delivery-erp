interface StatMiniProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

/**
 * Pas d'icone, et c'est deliberе.
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
          'text-base sm:text-xl font-bold wrap-break-word',
          highlight ? 'text-green-600' : 'text-foreground',
        ].join(' ')}
      >
        {value}
        {sub && <span className="ml-1 text-sm font-medium text-muted">{sub}</span>}
      </span>
    </div>
  );
}
