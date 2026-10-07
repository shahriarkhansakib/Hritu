/**
 * Type definitions matching the FastAPI backend responses.
 * Your teammate should rely on these to build the UI components.
 */

export interface Metric {
  id: string;
  label: string;
  unit: string;
  description: string;
  power_params: string[];
}

export interface AnnualDataPoint {
  year: number;
  value: number | null;
}

export interface SlopeLinePoint {
  year: number;
  fitted: number;
}

export interface PeriodStats {
  period: string;
  mean: number | null;
  n: number;
}

export interface BeforeAfterSplit {
  change_point_year: number;
  before: PeriodStats;
  after: PeriodStats;
}

export interface TrendDataResponse {
  // Provenance & Identity
  metric: string;
  district: string;
  dataset_id: string;
  source_url: string;
  data_source: 'live' | 'cache' | 'fixture';
  resolution_note: string;
  offline_mode: boolean;

  // Verdict (Trend results)
  trend: 'increasing' | 'decreasing' | 'no trend';
  verdict: 'REAL_TREND' | 'WEAK_SIGNAL' | 'NOISE';
  p_value: number;
  tau: number;
  method_used: string;
  
  // Slopes
  slope_per_year: number;
  slope_per_decade: number;
  ci_low: number;
  ci_high: number;

  // Change point
  change_point_index: number;
  change_point_year: number | null;
  change_point_p: number;
  change_point_significant: boolean;

  // Metadata
  n_observations: number;
  metric_label: string;
  metric_unit: string;
  metric_description: string;
  location_name: string;
  period: string;
  mode: 'point' | 'bbox';
  n_grid_points: number;

  // Charting Data
  annual_series: AnnualDataPoint[];
  slope_line: SlopeLinePoint[];
  before_after: BeforeAfterSplit | null;
}

export interface NarrativeClaim {
  dataset_id: string;
  source_url: string;
}

export interface NarrativeResponse {
  english: string;
  bangla: string;
  claims: NarrativeClaim[];
}
