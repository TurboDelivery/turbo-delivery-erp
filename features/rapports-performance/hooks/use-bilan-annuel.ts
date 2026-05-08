import { useBilanAnnuelQuery } from '@/features/rapports-performance/queries/bilan-annuel.query';
import { MonthKey, IMonthStats } from '@/features/rapports-performance/types/bilan-annuel.type';
import { formatCfa, formatNombre } from '@/utils/format.utils';

export interface MonthData {
  month: string;
  monthName: string;
  courses: string;
  staff: string;
  ca: string;
  autresEntrees: string;
  expenses: string;
  reimbursements: string;
  investments: string;
  progress: number;
  monthlyResult: string;
  cumulativeResult: string;
  isProfitable: boolean;
  hasData: boolean;
}

const MONTH_CONFIG: { key: MonthKey; slug: string; label: string; num: number }[] = [
  { key: 'jan', slug: 'janvier',   label: 'Janvier',   num: 1  },
  { key: 'feb', slug: 'fevrier',   label: 'Février',   num: 2  },
  { key: 'mar', slug: 'mars',      label: 'Mars',      num: 3  },
  { key: 'apr', slug: 'avril',     label: 'Avril',     num: 4  },
  { key: 'may', slug: 'mai',       label: 'Mai',       num: 5  },
  { key: 'jun', slug: 'juin',      label: 'Juin',      num: 6  },
  { key: 'jul', slug: 'juillet',   label: 'Juillet',   num: 7  },
  { key: 'aug', slug: 'aout',      label: 'Août',      num: 8  },
  { key: 'sep', slug: 'septembre', label: 'Septembre', num: 9  },
  { key: 'oct', slug: 'octobre',   label: 'Octobre',   num: 10 },
  { key: 'nov', slug: 'novembre',  label: 'Novembre',  num: 11 },
  { key: 'dec', slug: 'decembre',  label: 'Décembre',  num: 12 },
];

const formatResult = (value: number): string => {
  if (value === 0) return '0 FCFA';
  const prefix = value >= 0 ? '+ ' : '- ';
  return `${prefix}${formatCfa(Math.round(Math.abs(value)))}`;
};

const toMonthData = (
  stats: IMonthStats,
  slug: string,
  label: string,
  annee: string,
  num: number,
): MonthData => {
  const hasData = stats.c_a > 0 || stats.depenses > 0 || stats.course_externes > 0;
  return {
    month: slug,
    monthName: `${label} ${annee}`,
    courses: formatNombre(stats.course_externes),
    staff: formatNombre(stats.nombre_employees),
    ca: hasData ? formatCfa(Math.round(stats.c_a)) : '',
    autresEntrees: hasData ? formatCfa(Math.round(stats.autres_entrees)) : '',
    expenses: hasData ? formatCfa(Math.round(stats.depenses)) : '',
    reimbursements: hasData ? formatCfa(Math.round(stats.remboursement)) : '',
    investments: hasData ? formatCfa(Math.round(stats.investissements)) : '',
    progress: num,
    monthlyResult: hasData ? formatResult(stats.benefices) : '',
    cumulativeResult: hasData ? formatResult(stats.benefices_cumulees) : '',
    isProfitable: stats.benefices >= 0,
    hasData,
  };
};

export const useBilanAnnuel = (annee: string) => {
  const { data, isLoading, isError, error, refetch } = useBilanAnnuelQuery({ annee });

  const yearData = data?.[annee];

  const monthsData: MonthData[] = MONTH_CONFIG.map(({ key, slug, label, num }) => {
    const stats = yearData?.[key];
    if (!stats) {
      return {
        month: slug,
        monthName: `${label} ${annee}`,
        courses: '0',
        staff: '0',
        ca: '',
        autresEntrees: '',
        expenses: '',
        reimbursements: '',
        investments: '',
        progress: num,
        monthlyResult: '',
        cumulativeResult: '',
        isProfitable: false,
        hasData: false,
      };
    }
    return toMonthData(stats, slug, label, annee, num);
  });

  return {
    monthsData,
    isLoading,
    isError,
    error,
    refetch,
  };
};
