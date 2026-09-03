'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';

import menuData, { IMenuData, filterMenuByAbility, trouverCheminActif, trouverGroupeParent } from '@/config/menu-data';
import { useAbility } from '@/hooks/use-ability';
import { getTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { IRootState } from '@/store';
import { toggleSidebar } from '@/store/themeConfigSlice';

import { Logo } from '../icons';

/**
 * Navigation principale.
 *
 * <p>Elle venait telle quelle du gabarit d'administration d'origine : entrée active en
 * pavé rouge plein (`bg-red-100 text-red-700 font-bold`), tout le menu en gras, en-têtes
 * de section en bandeau gris pleine largeur, densité de 44 px par ligne. Sur un ERP à
 * seize entrées, cela produit un mur de texte gras où rien ne se hiérarchise, et où la
 * couleur de marque sert de surlignage plutôt que de signal.</p>
 *
 * <h3>Ce qui change, et pourquoi</h3>
 * <ul>
 *   <li><b>L'actif se marque par un RAIL, pas par un pavé.</b> Un liseré de 3 px et un
 *       fond très léger suffisent à dire « vous êtes ici ». Le pavé rouge criait la même
 *       chose et prenait l'accent qui doit rester disponible pour ce qui appelle une
 *       action.</li>
 *   <li><b>Le gras redevient un signal.</b> Tout le menu était en `font-semibold` : quand
 *       tout est gras, rien ne l'est. Seule l'entrée active l'est désormais.</li>
 *   <li><b>Les sections deviennent des étiquettes</b>, en petites capitales espacées, au
 *       lieu de bandeaux gris pleine largeur qui découpaient la colonne en tranches.</li>
 *   <li><b>La densité passe de 44 à 34 px.</b> Seize entrées tenaient mal dans une fenêtre
 *       de 563 px de haut — celle des postes — et le bas du menu demandait un défilement
 *       permanent.</li>
 * </ul>
 */
const Sidebar = () => {
  const dispatch = useDispatch();
  const { t } = getTranslation();
  const pathname = usePathname();
  const [currentMenu, setCurrentMenu] = useState<string>('');
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const semidark = themeConfig.semidark;
  const ability = useAbility();

  const toggleMenu = (value: string) => {
    setCurrentMenu((oldValue) => (oldValue === value ? '' : value));
  };

  const filteredMenu = useMemo(() => filterMenuByAbility(menuData, ability), [ability]);

  /**
   * Entrée de menu active. Le plus long chemin qui correspond gagne, sinon les paires
   * parent/enfant s'allument à deux : `/trafic` contre `/trafic/standard`.
   */
  const cheminActif = useMemo(() => trouverCheminActif(filteredMenu, pathname), [filteredMenu, pathname]);

  // Ouvre le groupe qui contient la route courante (rechargement direct, lien externe,
  // signet). Ne se déclenche que sur changement de route, donc n'annule pas une ouverture
  // faite à la main ensuite.
  useEffect(() => {
    const parent = trouverGroupeParent(filteredMenu, pathname);
    if (parent) setCurrentMenu(parent.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth < 1024 && themeConfig.sidebar) {
      dispatch(toggleSidebar());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className={semidark ? 'dark' : ''}>
      <div
        className={cn(
          'sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[248px] border-e border-separator bg-surface transition-transform duration-300',
          themeConfig.sidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col">
          {/* En-tête : le logo, et rien d'autre. Le bouton de repli passe dans l'en-tête
              de page, où vivent les actions. */}
          <div className="flex h-14 shrink-0 items-center border-b border-separator px-4">
            <Link className="flex items-center" href="/">
              <Logo className="w-16" />
            </Link>
          </div>

          {/* 100dvh : sur mobile la barre du navigateur réduit 100vh et masquait les
              dernières entrées. */}
          <PerfectScrollbar
            className="relative flex-1 overflow-y-auto overscroll-contain"
            options={{ suppressScrollX: true, wheelPropagation: false }}
          >
            <ul className="space-y-px p-3 pb-20">
              <RenderMenu
                cheminActif={cheminActif}
                currentMenu={currentMenu}
                menu={filteredMenu}
                t={t}
                toggleMenu={toggleMenu}
              />
            </ul>
          </PerfectScrollbar>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;

/** Ligne de navigation. `actif` porte le rail, `enfant` le retrait des sous-entrées. */
const ligne = (actif: boolean, enfant = false) =>
  cn(
    'group relative flex items-center gap-2.5 rounded-md py-[7px] text-[13px] transition-colors',
    enfant ? 'ps-9 pe-2.5' : 'px-2.5',
    actif
      ? 'bg-accent-soft font-semibold text-accent'
      : 'font-normal text-foreground/80 hover:bg-surface-secondary hover:text-foreground',
  );

/** Le rail : 3 px collés au bord gauche, visibles seulement sur l'entrée active. */
function Rail() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-1 -start-3 w-[3px] rounded-e-full bg-accent"
    />
  );
}

function RenderMenu({
  menu,
  currentMenu,
  cheminActif,
  toggleMenu,
  t,
}: {
  menu: IMenuData[];
  currentMenu: string;
  cheminActif: string;
  toggleMenu: (value: string) => void;
  t: (value: string) => string;
}) {
  /** Groupe dépliable. */
  const renderMenuItem = (item: IMenuData, key: number) => {
    const ouvert = currentMenu === item.title;
    // Un groupe replié dont un enfant est actif doit le dire : sinon, replier le groupe
    // efface toute trace de l'endroit où l'on se trouve.
    const enfantActif = item.children?.some((c) => c.path === cheminActif) ?? false;

    return (
      <li key={key}>
        <button
          className={cn(ligne(enfantActif && !ouvert), 'w-full justify-between')}
          onClick={() => toggleMenu(item.title)}
          type="button"
        >
          {enfantActif && !ouvert && <Rail />}
          <span className="flex min-w-0 items-center gap-2.5">
            {item.icon && <item.icon className="size-[17px] shrink-0 opacity-70" />}
            <span className="truncate">{t(item.title)}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-3.5 shrink-0 opacity-50 transition-transform', !ouvert && '-rotate-90')}
          />
        </button>

        <AnimateHeight duration={200} height={ouvert ? 'auto' : 0}>
          <ul className="mt-px space-y-px">
            {item?.children?.map((child: IMenuData, index: number) => {
              const actif = child.path === cheminActif;
              return (
                <li key={index}>
                  <Link className={ligne(actif, true)} href={child.path ?? ''}>
                    {actif && <Rail />}
                    <span className="truncate">{t(child.title)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </AnimateHeight>
      </li>
    );
  };

  /** Entrée simple. */
  const renderItem = (item: IMenuData, key: number) => {
    const actif = item.path === cheminActif;
    return (
      <li key={key}>
        <Link className={ligne(actif)} href={item.path ?? ''}>
          {actif && <Rail />}
          {item.icon && <item.icon className="size-[17px] shrink-0 opacity-70" />}
          <span className="truncate">{t(item.title)}</span>
        </Link>
      </li>
    );
  };

  /** En-tête de section : une étiquette, plus un bandeau pleine largeur. */
  const renderItemMenuHeader = (item: IMenuData, key: number) => (
    <Fragment key={key}>
      <li className="px-2.5 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
        {t(item.title)}
      </li>
      {item?.children?.map((child: IMenuData, index: number) =>
        child.children ? renderMenuItem(child, index) : renderItem(child, index),
      )}
    </Fragment>
  );

  return menu.map((item, index) => {
    if (!item.isHeader && item.children) return renderMenuItem(item, index);
    if (!item.isHeader) return renderItem(item, index);
    return renderItemMenuHeader(item, index);
  });
}
