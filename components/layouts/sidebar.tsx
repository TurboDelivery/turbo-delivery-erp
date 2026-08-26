'use client';

import Link from 'next/link';
import { Logo } from '../icons';
import { IRootState } from '@/store';
import { getTranslation } from '@/i18n';
import { usePathname } from 'next/navigation';
import AnimateHeight from 'react-animate-height';
import IconMinus from '@/components/icon/icon-minus';
import { Fragment, useEffect, useMemo, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/store/themeConfigSlice';
import menuData, { IMenuData, filterMenuByAbility, trouverCheminActif, trouverGroupeParent } from '@/config/menu-data';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import { useAbility } from '@/hooks/use-ability';

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
   * Entree de menu active.
   *
   * <p>Avant : deux effets cherchaient dans le DOM un lien dont l'attribut `href`
   * etait EXACTEMENT egal a `window.location.pathname`, puis lui ajoutaient une
   * classe a la main. Rien ne s'allumait donc sur une route dynamique
   * (`/restaurants/abc`, `/delivery-men/men/abc`, `/notification/abc`), le groupe
   * parent ne s'ouvrait pas sur rechargement direct, et le tableau de bord n'etait
   * jamais surligne puisque son chemin declare etait `/` alors que le middleware
   * redirige vers `/analystics`.</p>
   *
   * <p>Le plus long chemin qui correspond gagne, sinon les paires parent/enfant
   * s'allument a deux : `/trafic` contre `/trafic/standard`, `/restaurants` contre
   * `/restaurants/groupes`, `/delivery-men/men` contre `/delivery-men/men/create`.</p>
   */
  const cheminActif = useMemo(() => trouverCheminActif(filteredMenu, pathname), [filteredMenu, pathname]);

  // Ouvre le groupe qui contient la route courante (rechargement direct, lien
  // externe, signet). Ne se declenche que sur changement de route, donc n'annule
  // pas une ouverture faite a la main ensuite.
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
    <>
      {/* Bouton flottant pour rouvrir la sidebar quand elle est fermée */}
      {/*{(*/}
      {/*  <button*/}
      {/*    type="button"*/}
      {/*    className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-full shadow-md transition duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"*/}
      {/*    onClick={() => dispatch(toggleSidebar())}*/}
      {/*  >*/}
      {/*    <IconCaretsDown className="m-auto -rotate-90 h-5 w-5 text-gray-600 dark:text-gray-300" />*/}
      {/*  </button>*/}
      {/*)}*/}

      <nav className={semidark ? 'dark' : ''}>
        <div
          className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow transition-all duration-300 ${
            themeConfig.sidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } lg:ltr:ml-0 lg:rtl:mr-0`}
        >
          <div className="h-full bg-white dark:bg-black">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="main-logo">
                <Logo className="w-20 py-2" />
              </Link>
              <button
                type="button"
                className="collapse-icon flex h-8 w-8 items-center rounded-full transition duration-300 hover:bg-gray-500/10 rtl:rotate-180 dark:text-white-light dark:hover:bg-dark-light/10"
                onClick={() => dispatch(toggleSidebar())}
              >
                <IconCaretsDown className="m-auto rotate-90" />
              </button>
            </div>
            {/* 100dvh (hauteur de viewport dynamique) : sur mobile, la barre du navigateur
                réduit 100vh et masquait les derniers items du menu. pb-24 garantit que le
                dernier item est atteignable au-dessus du bord/safe-area. */}
            <PerfectScrollbar
              className="relative h-[calc(100dvh-80px)] overflow-y-auto overscroll-contain"
              options={{ suppressScrollX: true, wheelPropagation: false }}
            >
              <ul className="relative space-y-0.5 p-4 py-0 pb-24 font-semibold">
                <RenderMenu menu={filteredMenu} currentMenu={currentMenu} cheminActif={cheminActif} toggleMenu={toggleMenu} t={t} />
              </ul>
            </PerfectScrollbar>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;

function RenderMenu({ menu, currentMenu, cheminActif, toggleMenu, t }: { menu: IMenuData[]; currentMenu: string; cheminActif: string; toggleMenu: (value: string) => void; t: (value: string) => string }) {
  const renderMenuItem = (item: IMenuData, key: number) => {
    return (
      <li key={key} className="menu nav-item">
        <button type="button" className={`${currentMenu === item.title ? 'active rounded bg-red-100 text-red-700 font-bold' : ''} nav-link group w-full`} onClick={() => toggleMenu(item.title)}>
          <div className="flex items-center">
            {item.icon && <item.icon className="shrink-0 group-hover:!text-primary" />}
            <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-gray-600 dark:group-hover:text-white-dark">{t(item.title)}</span>
          </div>

          <div className={currentMenu !== item.title ? '-rotate-90 rtl:rotate-90' : ''}>
            <IconCaretDown />
          </div>
        </button>

        <AnimateHeight duration={300} height={currentMenu === item.title ? 'auto' : 0}>
          <ul className="sub-menu text-gray-500">
            {item?.children?.map((child: any, index: number) => (
              <li key={index}>
                <Link href={`${child.path ?? ''}`} className={child.path === cheminActif ? 'active' : ''}>
                  {t(child.title)}
                </Link>
              </li>
            ))}
          </ul>
        </AnimateHeight>
      </li>
    );
  };

  const renderItem = (item: IMenuData, key: number) => {
    return (
      <li key={key} className="nav-item">
        <Link href={`${item.path ?? ''}`} className={`group ${item.path === cheminActif ? 'active' : ''}`}>
          <div className="flex items-center">
            {item.icon && <item.icon className="shrink-0 group-hover:!text-primary" />}
            <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-muted-foreground dark:group-hover:text-white-dark">{t(item.title)}</span>
          </div>
        </Link>
      </li>
    );
  };
  const renderItemMenuHeader = (item: IMenuData, key: number) => {
    return (
      <Fragment key={key}>
        <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
          <IconMinus className="hidden h-5 w-4 flex-none" />
          <span>{t(item.title)}</span>
        </h2>
        <li className="nav-item">
          <ul>{item?.children?.map((child: any, index: number) => (child.children ? renderMenuItem(child, index) : renderItem(child, index)))}</ul>
        </li>
      </Fragment>
    );
  };
  return menu.map((item, index) => {
    if (!item.isHeader && item.children) {
      return renderMenuItem(item, index);
    }
    if (!item.isHeader) {
      return renderItem(item, index);
    } else {
      return renderItemMenuHeader(item, index);
    }
  });
}
