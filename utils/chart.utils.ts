// import type { ApexOptions } from 'apexcharts';

// export interface SeriesData {
//     date: string;
//     value: number;
// }

// export type PeriodType = "day" | "week" | "twoWeeks" | "month" | "twoMonths" | "year";

// /**
//  * Formate les données pour ApexCharts
//  */
// export const formatSeriesForChart = (series: SeriesData[]) => {
//     if (!series || series.length === 0) {
//         return [{ data: [] }];
//     }

//     const chartData = series.map((item, index) => {
//         try {
//             const timestamp = new Date(item.date).getTime();
//             // Vérifier si la conversion a réussi
//             if (isNaN(timestamp)) {
//                 throw new Error('Date invalide');
//             }
//             return {
//                 x: timestamp,
//                 y: item.value
//             };
//         } catch (error) {
//             // Si échec, utiliser l'index comme x
//             return {
//                 x: index,
//                 y: item.value,
//                 rawDate: item.date
//             };
//         }
//     });

//     return [{ data: chartData }];
// };

// /**
//  * Obtient les options de formatage de date selon la période
//  */
// export const getDateFormatOptions = (period: PeriodType): Intl.DateTimeFormatOptions => {
//     switch (period) {
//         case 'day':
//             return {
//                 hour: '2-digit',
//                 minute: '2-digit'
//             };
//         case 'week':
//         case 'twoWeeks':
//             return {
//                 weekday: 'short',
//                 day: '2-digit',
//                 month: 'short'
//             };
//         case 'month':
//         case 'twoMonths':
//             return {
//                 day: '2-digit',
//                 month: 'short'
//             };
//         case 'year':
//             return {
//                 day: '2-digit',
//                 month: 'short',
//                 year: '2-digit'
//             };
//         default:
//             return {
//                 day: '2-digit',
//                 month: 'short'
//             };
//     }
// };

// /**
//  * Formate une date de façon sécurisée
//  */
// export const formatDateSafely = (dateString: string, period: PeriodType): string => {
//     try {
//         const date = new Date(dateString);

//         // Vérifier si la date est valide
//         if (isNaN(date.getTime())) {
//             throw new Error('Date invalide');
//         }

//         const formatOptions = getDateFormatOptions(period);
//         return date.toLocaleDateString('fr-FR', formatOptions);
//     } catch (error) {
//         // Si échec, retourner la date brute
//         return dateString;
//     }
// };

// /**
//  * Génère le tooltip personnalisé pour ApexCharts
//  */
// export const generateTooltip = (
//     value: number,
//     dataPointIndex: number,
//     series: SeriesData[],
//     period: PeriodType
// ): string => {
//     let dateString = 'Date inconnue';

//     if (series && series[dataPointIndex]) {
//         dateString = formatDateSafely(series[dataPointIndex].date, period);
//     }

//     return `<div class="px-2 py-1">
//     <div class="font-semibold">${value}</div>
//     <div class="text-xs opacity-75">${dateString}</div>
//   </div>`;
// };

// /**
//  * Génère les options ApexCharts complètes
//  */
// export const generateChartOptions = (
//     chartColor: string,
//     mode: string | undefined,
//     series: SeriesData[],
//     period: PeriodType,
//     opacity: number = 0.1
// ): ApexOptions => {
//     return {
//         chart: {
//             toolbar: { show: false },
//             zoom: { enabled: false },
//             sparkline: { enabled: true },
//         },
//         plotOptions: {
//             bar: { columnWidth: "60%" }
//         },
//         dataLabels: { enabled: false },
//         stroke: {
//             curve: "smooth" as const,
//             width: 2
//         },
//         colors: [chartColor],
//         tooltip: {
//             theme: mode === "dark" ? "dark" : "light",
//             custom: ({ series: chartSeries, seriesIndex, dataPointIndex }: any) => {
//                 const value = chartSeries[seriesIndex][dataPointIndex];
//                 return generateTooltip(value, dataPointIndex, series, period);
//             }
//         },
//         grid: { show: false },
//         yaxis: { show: false },
//         xaxis: {
//             type: 'datetime',
//             labels: {
//                 show: false // Hide x-axis labels
//             },
//             axisBorder: {
//                 show: false // Hide x-axis border
//             },
//             axisTicks: {
//                 show: false // Hide x-axis ticks
//             }
//         },
//         fill: {
//             type: "solid",
//             opacity: [opacity]
//         },
//         legend: { show: false },
//     };
// };