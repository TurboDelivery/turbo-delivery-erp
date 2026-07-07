'use client';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { toggleRTL, toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from '@/store/themeConfigSlice';
import Loading from '@/components/layouts/loading';
import { getTranslation } from '@/i18n';
import { I18nProvider } from '@react-aria/i18n';
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ToastContainer, Bounce } from 'react-toastify';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const { initLocale } = getTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // React Aria (calendriers / date-pickers HeroUI) déduit le PREMIER JOUR DE SEMAINE
    // et les libellés de jours depuis la locale. Une locale SANS région ('fr') est
    // résolue de façon incohérente entre les versions de @internationalized/date
    // présentes dans l'arbre (grille dimanche-d'abord mais libellés lundi-d'abord →
    // calendrier décalé d'un jour). On force une locale AVEC région (lundi non ambigu)
    // pour ces composants, sans toucher themeConfig.locale (clé des traductions).
    const localeAria =
        ({ fr: 'fr-FR', en: 'en-US' } as Record<string, string>)[themeConfig.locale] ??
        themeConfig.locale;

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
        // locale
        initLocale(themeConfig.locale);

        setIsLoading(false);
    }, [dispatch, initLocale, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    return (
        <HeroUIProvider navigate={router.push}>
            <NextThemesProvider attribute="class" defaultTheme={'light'}>
                <I18nProvider locale={localeAria}>
                    <div
                        className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                            } main-section relative font-nunito text-sm font-normal antialiased`}
                    >
                        {isLoading ? (
                            <Loading />
                        ) : (
                            <div>
                                {children}
                                <ToastContainer
                                    position="top-right"
                                    autoClose={5000}
                                    hideProgressBar={false}
                                    newestOnTop={false}
                                    closeOnClick
                                    rtl={themeConfig.rtlClass === 'rtl'}
                                    pauseOnFocusLoss
                                    draggable
                                    pauseOnHover
                                    theme={themeConfig.theme}
                                    transition={Bounce}
                                />
                            </div>
                        )}
                    </div>
                </I18nProvider>
            </NextThemesProvider>
        </HeroUIProvider>
    );
}

export default App;
