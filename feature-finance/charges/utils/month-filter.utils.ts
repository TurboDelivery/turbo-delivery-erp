const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function buildMonthOptions(): { key: string; label: string }[] {
  const options: { key: string; label: string }[] = [];
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth();
  for (let y = 2024; y <= endYear; y++) {
    const lastM = y === endYear ? endMonth : 11;
    for (let m = 0; m <= lastM; m++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      options.push({ key, label: `${MONTH_NAMES[m]} ${y}` });
    }
  }
  return options.reverse();
}

export function monthKeyToRange(key: string): { debut: string; fin: string } {
  const [year, month] = key.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    debut: `${year}-${String(month).padStart(2, '0')}-01`,
    fin: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function rangeToMonthKey(debut: string): string {
  if (!debut) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return debut.slice(0, 7);
}
