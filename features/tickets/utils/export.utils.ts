export function autoFitColumns(data: any[]) {
  const colWidths: number[] = [];

  data.forEach((row) => {
    Object.values(row).forEach((value, index) => {
      const cellLength = value ? value.toString().length : 0;
      colWidths[index] = Math.max(colWidths[index] || 0, cellLength);
    });
  });

  return colWidths.map((width) => ({
    wch: Math.min(width + 2, 40), // marge + limite
  }));
}