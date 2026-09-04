'use client';

import { Button, Tooltip } from '@heroui-v3/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useDispatch, useSelector } from 'react-redux';

import type { IRootState } from '@/store';
import { toggleTheme } from '@/store/themeConfigSlice';

/**
 * Bascule clair / sombre, en HeroUI v3.
 *
 * <p>Le commutateur precedent avait ete RETIRE de l'en-tete, et pour une bonne raison :
 * il basculait un theme sombre qui cassait l'affichage, parce que le contenu des ecrans
 * portait ses couleurs en dur. Un commutateur qui abime l'ecran est pire que pas de mode
 * sombre du tout.</p>
 *
 * <p>Il revient parce que la condition est levee sur le tableau de bord : les jetons
 * morts ont ete reparus, et chaque couple texte/fond de cet ecran a ete mesure dans les
 * deux themes — 6,13:1 au pire. Les ecrans NON REFONDUS gardent leurs couleurs en dur et
 * resteront imparfaits en sombre ; c'est un etat de traversee, pas une regression.</p>
 *
 * <p>Le theme est pose sur `<body>` par `themeConfigSlice`, et non sur `<html>` — dont le
 * `className="light"` du layout racine est donc sans effet.</p>
 */
export function BasculeTheme() {
    const dispatch = useDispatch();
    // DEUX systemes de theme cohabitent et il faut prevenir les deux.
    //
    // Redux pose la classe `dark` sur `<body>`, ce dont dependent les jetons CSS.
    // `next-themes` est lu par les composants qui choisissent une ressource selon le
    // theme — `MapTrafic` charge son fond de carte ainsi, et `icons.tsx` son logo.
    // Ma premiere version ne dispatchait que Redux : la carte du trafic restait donc
    // en tuiles claires sur une interface sombre.
    const { setTheme } = useTheme();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const sombre = themeConfig.theme === 'dark';

    return (
        <Tooltip>
            <Button
                aria-label={sombre ? 'Passer au thème clair' : 'Passer au thème sombre'}
                isIconOnly
                onPress={() => {
                    const cible = sombre ? 'light' : 'dark';
                    dispatch(toggleTheme(cible));
                    setTheme(cible);
                }}
                size="sm"
                variant="ghost"
            >
                {sombre ? (
                    <Sun aria-hidden="true" className="size-[18px]" />
                ) : (
                    <Moon aria-hidden="true" className="size-[18px]" />
                )}
            </Button>
            <Tooltip.Content>{sombre ? 'Thème clair' : 'Thème sombre'}</Tooltip.Content>
        </Tooltip>
    );
}
