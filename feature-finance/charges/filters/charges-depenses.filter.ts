import { parseAsString } from 'nuqs';

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, '0');
  return {
    debut: `${year}-${mm}-01`,
    fin: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

const defaults = getCurrentMonthRange();

export const chargesDepensesFiltersClient = {
  filter: {
    debut: parseAsString.withDefault(defaults.debut),
    fin: parseAsString.withDefault(defaults.fin),
  },
  option: {
    clearOnDefault: true,
  },
};
