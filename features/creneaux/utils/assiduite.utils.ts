export const getAssiduiteBgColor = (pourcentage: number): string => {
  if (pourcentage >= 80) return 'bg-green-50 text-green-700';
  if (pourcentage >= 50) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
};

export const getAssiduitProgressColor = (pourcentage: number): 'success' | 'warning' | 'danger' => {
  if (pourcentage >= 80) return 'success';
  if (pourcentage >= 50) return 'warning';
  return 'danger';
};
