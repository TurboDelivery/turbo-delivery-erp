'use client';

import { LayoutDashboard, Map, Menu, Ticket, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';

import { cn } from '@/lib/utils';
import { toggleSidebar } from '@/store/themeConfigSlice';

/**
 * Navigation basse, sur mobile uniquement.
 *
 * <p>Sur telephone, toute la navigation passait par un tiroir a ouvrir depuis un bouton
 * en haut a gauche : deux gestes, et un pouce qui traverse l'ecran, pour atteindre
 * n'importe quelle page. Les quatre destinations les plus frequentes sont desormais a
 * portee de pouce en permanence, le tiroir restant accessible pour tout le reste.</p>
 *
 * <h3>Ce que dit la regle des barres basses</h3>
 * <ul>
 *   <li><b>Cinq entrees au maximum</b> — au-dela, les cibles deviennent trop etroites.
 *       Ici quatre destinations plus « Menu », qui ouvre le reste.</li>
 *   <li><b>Icone ET libelle.</b> Une barre en icones seules oblige a deviner ; le libelle
 *       est ce qui rend la destination reconnaissable.</li>
 *   <li><b>La position courante se voit.</b> Sans elle, on ne sait pas ou l'on est.</li>
 *   <li><b>Cible de 44 px minimum</b>, et la barre respecte la zone sure du bas
 *       (`env(safe-area-inset-bottom)`), sinon la barre gestuelle de l'iPhone recouvre
 *       les entrees.</li>
 * </ul>
 *
 * <p>Elle ne porte que des destinations de PREMIER niveau : une barre basse qui ouvre des
 * sous-navigations perd sa raison d'etre, qui est d'etre un point fixe.</p>
 */

const ENTREES = [
    { href: '/analystics', libelle: 'Pilotage', Icone: LayoutDashboard },
    { href: '/trafic', libelle: 'Trafic', Icone: Map },
    { href: '/tickets', libelle: 'Tickets', Icone: Ticket },
    { href: '/commandes', libelle: 'Commandes', Icone: Truck },
];

export function BarreBasse() {
    const pathname = usePathname();
    const dispatch = useDispatch();

    return (
        <nav
            aria-label="Navigation principale"
            className={cn(
                'fixed inset-x-0 bottom-0 z-50 border-t border-separator bg-surface lg:hidden',
                // Zone sure : sans elle, la barre gestuelle recouvre les entrees.
                'pb-[env(safe-area-inset-bottom)]',
            )}
        >
            <ul className="flex items-stretch">
                {ENTREES.map(({ href, libelle, Icone }) => {
                    // Le plus long chemin qui correspond gagne : `/trafic` ne doit pas
                    // s'allumer quand on est sur `/trafic/standard`.
                    const actif = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <li className="flex-1" key={href}>
                            <Link
                                aria-current={actif ? 'page' : undefined}
                                className={cn(
                                    'flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] transition-colors',
                                    actif ? 'text-accent' : 'text-muted',
                                )}
                                href={href}
                            >
                                <Icone aria-hidden="true" className="size-5 shrink-0" />
                                <span className="truncate">{libelle}</span>
                            </Link>
                        </li>
                    );
                })}

                <li className="flex-1">
                    <button
                        aria-label="Ouvrir le menu complet"
                        className="flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] text-muted"
                        onClick={() => dispatch(toggleSidebar())}
                        type="button"
                    >
                        <Menu aria-hidden="true" className="size-5 shrink-0" />
                        <span>Menu</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}
