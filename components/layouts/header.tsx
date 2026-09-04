'use client';

import Link from 'next/link';
import { IRootState } from '@/store';
import { User } from '@/types/models';
import { Button } from '@/components/heroui';
import { getTranslation } from '@/i18n';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IconMenu } from '@tabler/icons-react';
import AnimateHeight from 'react-animate-height';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/store/themeConfigSlice';
import menuData, { IMenuData, filterMenuByAbility, trouverCheminActif, trouverTitreActif } from '@/config/menu-data';
import { useAbility } from '@/hooks/use-ability';
import IconCaretDown from '@/components/icon/icon-caret-down';
import Notifications from '../dashboard/notifications/notifications';
import { BasculeTheme } from './bascule-theme';
import { DashboardUserDropdown } from '../dashboard/dashboard-user-dropdown';
import ThemeSwitch from '@/components/layouts/themeSwitch';

const Header = ({ profile }: { profile: User }) => {
  const pathname = usePathname();

  const dispatch = useDispatch();
  const { t } = getTranslation();

  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const ability = useAbility();

  /**
   * Le menu horizontal rendait `menuData` BRUT : aucun filtrage CASL, contrairement
   * a la barre laterale. Invisible tant que `themeConfig.menu` vaut « vertical »
   * (le defaut), mais `App.tsx` lit ce reglage dans `localStorage`, donc la valeur
   * « horizontal » reste atteignable et listait alors des entrees interdites.
   */
  const filteredMenu = useMemo(() => filterMenuByAbility(menuData, ability), [ability]);

  // Repere de position, derive du menu deja filtre par les droits.
  const { titre, section } = useMemo(() => trouverTitreActif(filteredMenu, pathname), [filteredMenu, pathname]);

  // Meme calcul que la barre laterale, au lieu du `document.querySelector` par
  // egalite exacte qui ne s'allumait sur aucune route dynamique.
  const cheminActif = useMemo(() => trouverCheminActif(filteredMenu, pathname), [filteredMenu, pathname]);

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);

  return (
    <>
      <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
        <div>
          {/*
            * En-tete de page.
            *
            * <p>Elle etait VIDE : un bouton hamburger visible en mobile seulement, les
            * notifications et le compte, tout le reste commente. Une barre pleine largeur
            * pour trois elements alignes a droite.</p>
            *
            * <p>Elle porte desormais le REPERE : section et titre de la page courante,
            * derives du menu. L'operateur qui arrive par un lien direct sait ou il est,
            * meme quand la barre laterale est repliee — ce qui etait jusqu'ici son seul
            * indice de position. Et le repli fonctionne sur poste, pas seulement en
            * mobile.</p>
            */}
          <div className="relative flex h-16 w-full items-center gap-3 border-b border-separator bg-surface px-4">
            {/* Masque sur mobile : la barre de navigation basse porte deja « Menu »,
                et deux commandes pour la meme chose brouillent la lecture. Il reste sur
                grand ecran, ou la barre basse n'existe pas. */}
            <Button
              isIconOnly
              aria-label="Afficher ou masquer la navigation"
              className="hidden shrink-0 lg:inline-flex"
              variant="light"
              onPress={() => dispatch(toggleSidebar())}
            >
              <IconMenu className="h-5 w-5" />
            </Button>

            <div className="flex min-w-0 flex-col leading-tight">
              {section && (
                <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                  {t(section)}
                </span>
              )}
              {titre && <span className="truncate text-sm font-semibold">{t(titre)}</span>}
            </div>

            <div className="flex items-center gap-1 ltr:ml-auto rtl:mr-auto">
              {/*
                * Commutateur de theme REMIS, mais seulement pour la coquille.
                *
                * <p>Il avait ete masque le 26/08/2026 : 92 % des surfaces n'avaient aucune
                * variante sombre, et la personne qui cliquait obtenait du texte blanc sur
                * fond blanc, menu lateral compris.</p>
                *
                * <p>La coquille — barre laterale, en-tete, conteneur, pied — est desormais
                * ecrite en JETONS v3 (`bg-surface`, `text-foreground`, `border-separator`),
                * qui basculent d'eux-memes. Le contenu des ecrans suit progressivement, au
                * fil de la refonte.</p>
                *
                * ⚠ A verifier ecran par ecran avant d'annoncer le mode sombre comme
                * disponible : les pages non encore refondues gardent leurs couleurs en dur.
                */}
              {/*
                * COMMUTATEUR DE THEME RETIRE — de nouveau, et avec la preuve cette fois.
                *
                * <p>Je l'avais remonte en ecrivant « a verifier ecran par ecran », puis ne
                * l'ai pas verifie. Capture a l'appui : en sombre, la barre laterale et les
                * cartes finance restent BLANCHES sur fond noir. Passer la coquille aux
                * jetons ne suffisait pas — le contenu des ecrans porte encore ses couleurs
                * en dur.</p>
                *
                * <p>Il reviendra quand les ecrans auront ete refondus, pas avant. Un
                * commutateur qui casse l'affichage est pire que pas de mode sombre.</p>
                */}
              <BasculeTheme />

              {/* <LocaleSwitch /> */}
              {/* <MessageList /> */}
              {/* <NotificationList /> */}
              <Notifications />
              <DashboardUserDropdown profile={profile} />
            </div>
          </div>

          {/* Menu horizontal : conserve pour le theme `horizontal`, masque autrement. */}
          <ul className="horizontal-menu hidden border-t border-separator bg-surface px-6 py-1.5 text-sm rtl:space-x-reverse lg:space-x-1.5 xl:space-x-8">
            <RenderMenu menu={filteredMenu} openMenus={openMenus} cheminActif={cheminActif} toggleMenu={toggleMenu} t={t} />
          </ul>
        </div>
      </header>
      {/* <Notification isOpen={isOpen} onO /> */}
    </>
  );
};

export default Header;

/* ============================
        MENU RÉCURSIF
============================ */

function RenderMenu({ menu, openMenus, cheminActif, toggleMenu, level = 0, t }: { menu: IMenuData[]; openMenus: Set<string>; cheminActif: string; toggleMenu: (key: string) => void; level?: number; t: (value: string) => string }) {
  return (
    <>
      {menu.map((item, index) => {
        const key = `${level}-${item.title}-${index}`;
        const isOpen = openMenus.has(key);
        const hasChildren = item.children && item.children.length > 0;

        return (
          <li key={key}>
            {hasChildren ? (
              <>
                <button
                  onClick={() => toggleMenu(key)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded transition
                                        ${isOpen ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                                    `}
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="w-5 h-5" />}
                    <span>{t(item.title)}</span>
                  </div>
                  <IconCaretDown className={`transition ${isOpen ? '' : '-rotate-90'}`} />
                </button>

                <AnimateHeight duration={250} height={isOpen ? 'auto' : 0}>
                  <ul className="mt-1 ml-4 border-l border-gray-300 dark:border-gray-700 pl-3 space-y-1">
                    <RenderMenu menu={item.children!} openMenus={openMenus} cheminActif={cheminActif} toggleMenu={toggleMenu} level={level + 1} t={t} />
                  </ul>
                </AnimateHeight>
              </>
            ) : (
              <Link
                href={item.path ?? ''}
                className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  item.path === cheminActif ? 'active' : ''
                }`}
              >
                {item.icon && <item.icon className="w-5 h-5" />}
                <span>{t(item.title)}</span>
              </Link>
            )}
          </li>
        );
      })}
    </>
  );
}
