'use client';

import { Button } from '@heroui-v3/react';
import { IconDeviceLaptop, IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import { useDispatch, useSelector } from 'react-redux';

import { toggleTheme } from '@/store/themeConfigSlice';
import { IRootState } from '@/store';

/**
 * Le bouton de thème : clair → sombre → système → clair.
 *
 * <h3>Ce qui change</h3>
 * <p>Le composant existait en TROIS copies du même bouton, distinguées seulement par
 * l'icône et la cible du clic — trente-cinq caractères de classes recopiés à l'identique
 * dans chacune. Ces classes peignaient un fond `bg-black/10` avec ses contreparties
 * `dark:` écrites à la main, et un survol qui virait à la couleur de MARQUE.</p>
 *
 * <p>Aucun des trois n'avait de nom accessible : trois boutons dont le seul contenu est
 * une icône, annoncés « bouton » et rien d'autre.</p>
 */
const CYCLE = {
  dark: { icone: IconMoon, libelle: 'Thème sombre — passer au thème système', suivant: 'system' },
  light: { icone: IconSun, libelle: 'Thème clair — passer au thème sombre', suivant: 'dark' },
  system: { icone: IconDeviceLaptop, libelle: 'Thème système — passer au thème clair', suivant: 'light' },
} as const;

type Theme = keyof typeof CYCLE;

const ThemeSwitch = ({
  className,
  size,
}: {
  className?: string;
  size?: 'lg' | 'md' | 'sm';
}) => {
  const dispatch = useDispatch();
  const { setTheme } = useTheme();

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const courant = (themeConfig.theme in CYCLE ? themeConfig.theme : 'light') as Theme;
  const { icone: Icone, libelle, suivant } = CYCLE[courant];

  return (
    <Button
      aria-label={libelle}
      className={className}
      isIconOnly
      onPress={() => {
        dispatch(toggleTheme(suivant));
        setTheme(suivant);
      }}
      size={size}
      variant="ghost"
    >
      <Icone aria-hidden="true" />
    </Button>
  );
};

export default ThemeSwitch;
