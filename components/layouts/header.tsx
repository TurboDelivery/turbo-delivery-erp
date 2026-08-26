'use client';

import { Link } from 'lucide-react';
import { IRootState } from '@/store';
import { User } from '@/types/models';
import { Button } from '@heroui/react';
import { getTranslation } from '@/i18n';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IconMenu } from '@tabler/icons-react';
import AnimateHeight from 'react-animate-height';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/store/themeConfigSlice';
import menuData, { IMenuData } from '@/config/menu-data';
import IconCaretDown from '@/components/icon/icon-caret-down';
import Notifications from '../dashboard/notifications/notifications';
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

  useEffect(() => {
    const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
    if (selector) {
      const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
      for (let i = 0; i < all.length; i++) {
        all[0]?.classList.remove('active');
      }

      let allLinks = document.querySelectorAll('ul.horizontal-menu a.active');
      for (let i = 0; i < allLinks.length; i++) {
        const element = allLinks[i];
        element?.classList.remove('active');
      }
      selector?.classList.add('active');

      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
        if (ele) {
          ele = ele[0];
          setTimeout(() => {
            ele?.classList.add('active');
          });
        }
      }
    }
  }, [pathname]);

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);

  return (
    <>
      <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
        <div className="shadow-sm">
          <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
            <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2">
              {/* <Icone className="py-2 shrink-0 mr-2" /> */}
              <div className="hidden lg:block">{/* <OrganisationDropdown reference={reference} profileOrganisations={profileOrganisations} /> */}</div>

              <Button
                isIconOnly
                variant="light"
                onPress={() => {
                  console.log('toggle sidebar');
                  dispatch(toggleSidebar());
                }}
                className="collapse-icon lg:hidden  ltr:ml-2 rtl:mr-2"
              >
                <IconMenu className="h-5 w-5" />
              </Button>
            </div>

            <div className="hidden ltr:mr-2 rtl:ml-2 sm:block">{/* <ToolsList /> */}</div>
            <div className="flex items-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] sm:flex-1 ltr:sm:ml-0 sm:rtl:mr-0 lg:space-x-2">
              <div className="sm:ltr:mr-auto sm:rtl:ml-auto">{/* <SearchComponent /> */}</div>
              {/* Mode sombre masque le 26/08/2026. Le commutateur etait monte, mais 92 pour cent
              des surfaces n'ont aucune variante `dark:` : la personne qui cliquait obtenait du
              texte blanc sur fond blanc, menu lateral compris. Le socle visuel (lot 2) refait les
              couleurs en jetons ; le mode sombre en decoulera et ce bloc pourra revenir. */}
              {/* <ThemeSwitch /> */}

              {/* <LocaleSwitch /> */}
              {/* <MessageList /> */}
              {/* <NotificationList /> */}
              <Notifications />
              <DashboardUserDropdown profile={profile} />
            </div>
          </div>

          {/* horizontal menu */}
          <ul className="horizontal-menu hidden border-t border-[#ebedf2] bg-white px-6 py-1.5 font-semibold text-black rtl:space-x-reverse dark:border-[#191e3a] dark:bg-black dark:text-white-dark lg:space-x-1.5 xl:space-x-8">
            <RenderMenu menu={menuData} openMenus={openMenus} toggleMenu={toggleMenu} t={t} />
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

function RenderMenu({ menu, openMenus, toggleMenu, level = 0, t }: { menu: IMenuData[]; openMenus: Set<string>; toggleMenu: (key: string) => void; level?: number; t: (value: string) => string }) {
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
                    <RenderMenu menu={item.children!} openMenus={openMenus} toggleMenu={toggleMenu} level={level + 1} t={t} />
                  </ul>
                </AnimateHeight>
              </>
            ) : (
              <Link href={item.path ?? ''} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
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
