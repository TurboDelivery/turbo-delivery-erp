export function getInitials(nomPrenom?: string): string {
  if (
    !nomPrenom ||
    nomPrenom.trim() === '' ||
    nomPrenom.toLowerCase().trim() === 'null' ||
    nomPrenom.toLowerCase().trim() === 'null null'
  ) {
    return '?';
  }
  const parts = nomPrenom.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export function getColorFromInitial(initial: string): string {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF',
    '#33FFF3', '#FFC733', '#75FF33', '#FF3385', '#33A1FF', '#F333FF',
  ];
  return colors[initial.charCodeAt(0) % colors.length];
}
