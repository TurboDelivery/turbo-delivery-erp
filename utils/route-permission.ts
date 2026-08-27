import menuData, { IMenuData } from '@/config/menu-data';
import type { AppAbility, AppActions, AppSubjects } from '@/lib/casl/ability';

const ALWAYS_ALLOWED_PATHS = ['/', '/analystics', '/settings/profile'];

type Rule = { action: AppActions; subject: AppSubjects };

const findRuleForPath = (menus: IMenuData[], path: string): Rule | null => {
  for (const item of menus) {
    if (item.path === path && item.can) return item.can;
    if (item.children) {
      const childRule = findRuleForPath(item.children, path);
      if (childRule) return childRule;
    }
  }
  return null;
};

const findRuleForPrefix = (menus: IMenuData[], path: string): Rule | null => {
  let bestRule: Rule | null = null;
  let bestLength = 0;
  const walk = (list: IMenuData[]) => {
    for (const item of list) {
      if (item.path && item.can && path.startsWith(item.path) && item.path !== '/') {
        if (item.path.length > bestLength) {
          bestRule = item.can;
          bestLength = item.path.length;
        }
      }
      if (item.children) walk(item.children);
    }
  };
  walk(menus);
  return bestRule;
};

export const canAccessRoute = (ability: AppAbility, path: string): boolean => {
  if (ALWAYS_ALLOWED_PATHS.includes(path)) return true;

  const exactRule = findRuleForPath(menuData, path);
  if (exactRule) return ability.can(exactRule.action, exactRule.subject);

  const prefixRule = findRuleForPrefix(menuData, path);
  if (prefixRule) return ability.can(prefixRule.action, prefixRule.subject);

  return true;
};
