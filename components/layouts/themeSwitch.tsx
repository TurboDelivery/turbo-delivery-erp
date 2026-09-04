'use client';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { toggleTheme } from '@/store/themeConfigSlice';
import IconSun from '@/components/icon/icon-sun';
import IconMoon from '@/components/icon/icon-moon';
import IconLaptop from '@/components/icon/icon-laptop';
import { useTheme } from 'next-themes';
import { Button, ButtonProps } from '@/components/heroui';

const ThemeSwitch = ({ className, size }: { className?: string; size?: ButtonProps['size'] }) => {
  const dispatch = useDispatch();
  const { setTheme } = useTheme();

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);

  return (
    <div>
      {themeConfig.theme === 'light' ? (
        <Button
          isIconOnly
          size={size}
          className={`flex items-center rounded-full bg-black/10 p-2 text-foreground hover:bg-black/15 hover:text-primary dark:bg-surface/10 dark:text-muted dark:hover:bg-surface/15 ${className ?? ''}`}
          onPress={() => {
            dispatch(toggleTheme('dark'));
            setTheme('dark');
          }}
        >
          <IconSun />
        </Button>
      ) : (
        ''
      )}
      {themeConfig.theme === 'dark' && (
        <Button
          isIconOnly
          size={size}
          className={`flex items-center rounded-full bg-black/10 p-2 text-foreground hover:bg-black/15 hover:text-primary dark:bg-surface/10 dark:text-muted dark:hover:bg-surface/15 ${className ?? ''}`}
          onPress={() => {
            dispatch(toggleTheme('system'));
            setTheme('system');
          }}
        >
          <IconMoon />
        </Button>
      )}
      {themeConfig.theme === 'system' && (
        <Button
          isIconOnly
          size={size}
          className={`flex items-center rounded-full bg-black/10 p-2 text-foreground hover:bg-black/15 hover:text-primary dark:bg-surface/10 dark:text-muted dark:hover:bg-surface/15 ${className ?? ''}`}
          onPress={() => {
            dispatch(toggleTheme('light'));
            setTheme('light');
          }}
        >
          <IconLaptop />
        </Button>
      )}
    </div>
  );
};

export default ThemeSwitch;
