import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * La serie annuelle en clair, mois par mois.
 *
 * <p>Ce tableau n'est pas un doublon du graphique : c'est son EQUIVALENT TEXTUEL. Un
 * graphique seul n'est pas lisible par un lecteur d'ecran — les valeurs vivent dans des
 * attributs SVG que rien n'annonce — et les valeurs exactes n'y sont accessibles qu'au
 * survol, donc pas du tout au clavier ni au doigt. Les regles d'accessibilite des
 * visualisations demandent explicitement une alternative tabulaire.</p>
 *
 * <p>Il repond aussi a une question que le graphique ne sait pas traiter : « combien
 * exactement en mai ? ». On lit une tendance sur une courbe, on lit un montant dans un
 * tableau.</p>
 */

export interface LigneMois {
    mois: string;
    revenus: number;
    depenses: number;
    encours: number;
    investissements: number;
}

/** Une valeur absente n'est pas un zero : le mois n'a simplement pas eu lieu. */
function Valeur({ v, ton }: { v: number; ton?: 'marge' }) {
    if (v === 0) return <span className="tabular-nums text-muted">—</span>;
    const negatif = v < 0;
    return (
        <span
            className={cn(
                'tabular-nums',
                ton === 'marge' && !negatif && 'text-green-800 dark:text-green-400',
                ton === 'marge' && negatif && 'text-red-800 dark:text-red-400',
            )}
        >
            {formatCFA(v).replace(/^[-−]/, '−')}
        </span>
    );
}

export function TableauMensuel({ lignes, annee }: { lignes: LigneMois[]; annee: number }) {
    const enTete = 'px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted';

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
                <caption className="sr-only">
                    Revenus, dépenses, marge, encours et investissements pour chaque mois de {annee}.
                </caption>
                <tbody>
                    <tr className="border-b border-separator">
                        <th className={cn(enTete, 'text-left')} scope="col">
                            Mois
                        </th>
                        <th className={enTete} scope="col">
                            Revenus
                        </th>
                        <th className={enTete} scope="col">
                            Dépenses
                        </th>
                        <th className={enTete} scope="col">
                            Marge
                        </th>
                        <th className={enTete} scope="col">
                            Encours
                        </th>
                        <th className={enTete} scope="col">
                            Investissements
                        </th>
                    </tr>
                </tbody>
                <tbody>
                    {lignes.map((l) => (
                        <tr className="border-b-0!" key={l.mois}>
                            <th
                                className="px-3 py-1.5 text-left font-normal text-foreground/90"
                                scope="row"
                            >
                                {l.mois}
                            </th>
                            <td className="px-3 py-1.5 text-right">
                                <Valeur v={l.revenus} />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                                <Valeur v={l.depenses} />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                                <Valeur
                                    ton="marge"
                                    v={l.revenus === 0 && l.depenses === 0 ? 0 : l.revenus - l.depenses}
                                />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                                <Valeur v={l.encours} />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                                <Valeur v={l.investissements} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
