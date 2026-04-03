export interface IDailyStatPoint {
  depenses: number;
  ca: number;
}

// L'API retourne { "2026-03-01": { depenses, ca }, "2026-03-02": { ... }, ... }
export type IDailyStatsResponse = Record<string, IDailyStatPoint>;

export interface IDailyStatsParams {
  debut?: Date;
  fin?: Date;
}
