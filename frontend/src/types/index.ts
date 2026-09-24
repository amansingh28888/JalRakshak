// JalRakshak — TypeScript type definitions


// ─────────────────────────────────────────────────────────────────────────────
// Alert categories
// ─────────────────────────────────────────────────────────────────────────────

export type AlertCategory =
  | 'POTABLE_SAFE'
  | 'UNSAFE_BIOLOGICAL_PATHOGEN'
  | 'CRITICAL_CHEMICAL_TOXIN'
  | 'MODERATE_PHYSICAL_PARAM'
  | 'CRITICAL_MIXED_HAZARD';


// ─────────────────────────────────────────────────────────────────────────────
// Severity
// ─────────────────────────────────────────────────────────────────────────────

export type Severity =
  | 'SAFE'
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL';


// ─────────────────────────────────────────────────────────────────────────────
// Action codes
// ─────────────────────────────────────────────────────────────────────────────

export type ActionCode =
  | 'SAFE_TO_DRINK'
  | 'BOIL_OR_CHLORINATE_REQUIRED'
  | 'DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY'
  | 'FILTRATION_TREATMENT_RECOMMENDED'
  | 'FILTER_AND_RETEST'
  | 'MIXED_HAZARD_CHEMICAL_PRIORITY';


// ─────────────────────────────────────────────────────────────────────────────
// Message type — used for UI template selection
// Generated exclusively by the deterministic rule engine.
// ─────────────────────────────────────────────────────────────────────────────

export type MessageType =
  | 'SAFE'
  | 'BIOLOGICAL_CONTAMINATION'
  | 'CHEMICAL_CONTAMINATION'
  | 'PHYSICAL_PARAMETER'
  | 'MIXED_HAZARD';


// ─────────────────────────────────────────────────────────────────────────────
// Water sample
// ─────────────────────────────────────────────────────────────────────────────

export interface WaterSample {
  id: number;

  sample_id?: string;

  // ── Location ───────────────────────────────────────────────────────────────

  state_ut: string;
  district: string;
  village?: string;

  water_source_type?: string;
  season_cycle?: string;
  sample_date?: string;

  latitude?: number;
  longitude?: number;
  location_type?: string;


  // ── Core physical parameters ───────────────────────────────────────────────

  ph?: number;
  turbidity_ntu?: number;
  tds_mg_l?: number;
  total_hardness_mg_l?: number;


  // ── Chemical parameters ────────────────────────────────────────────────────

  chloride_mg_l?: number;

  fluoride_mg_l?: number;

  arsenic_mg_l?: number;
  arsenic_ug_l?: number;

  nitrate_mg_l?: number;

  iron_mg_l?: number;

  uranium_ug_l?: number;


  // ── Biological parameters ──────────────────────────────────────────────────

  e_coli_mpn?: number;
  total_coliform_mpn?: number;


  // ── Deterministic verdict ──────────────────────────────────────────────────

  alert_category?: AlertCategory;
  severity?: Severity;
  action_code?: ActionCode;

  do_not_boil: boolean;

  primary_contaminant?: string;
  rule_reason?: string;


  // ── Metadata ───────────────────────────────────────────────────────────────

  created_at?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Parameter result
// ─────────────────────────────────────────────────────────────────────────────

export interface ParameterResult {
  name: string;

  field_name: string;

  measured_value?: number;

  unit: string;

  acceptable_limit?: number;
  permissible_limit?: number;

  status:
    | 'OK'
    | 'ACCEPTABLE_EXCEEDED'
    | 'PERMISSIBLE_EXCEEDED'
    | 'NO_DATA';

  exceedance_ratio?: number;

  interpretation: string;

  is_chemical_hazard: boolean;
  is_biological_hazard: boolean;
}


// ─────────────────────────────────────────────────────────────────────────────
// Water quality verdict
// ─────────────────────────────────────────────────────────────────────────────

export interface WaterQualityVerdict {
  // ── Existing fields (backward-compatible) ──────────────────────────────────
  category: AlertCategory;

  severity: Severity;

  action_code: ActionCode;

  do_not_boil: boolean;

  primary_contaminant?: string;

  reasons: string[];

  recommended_action: string;

  summary: string;

  parameter_results: ParameterResult[];

  // ── New structured communication fields ────────────────────────────────────
  // All set by the deterministic rule engine — never by Gemini.

  /** True only when category === 'POTABLE_SAFE' */
  safe_to_drink: boolean;

  /** Structured action codes for UI display */
  recommended_actions: string[];

  /** Actions to avoid (e.g. DO_NOT_RELY_ON_BOILING for chemical hazards) */
  avoid_actions: string[];

  /** Communication template key derived from category */
  message_type: MessageType;
}


// ─────────────────────────────────────────────────────────────────────────────
// Generic paginated response
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  total: number;

  page: number;

  page_size: number;

  pages: number;

  items: T[];
}


// ─────────────────────────────────────────────────────────────────────────────
// Category count
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryCount {
  category: AlertCategory | string;

  count: number;

  percentage: number;
}


// ─────────────────────────────────────────────────────────────────────────────
// State statistics
// ─────────────────────────────────────────────────────────────────────────────

export interface StateStats {
  state_ut: string;

  total: number;

  safe: number;

  chemical: number;

  biological: number;

  physical: number;

  mixed: number;

  do_not_boil: number;
}


// ─────────────────────────────────────────────────────────────────────────────
// Dashboard summary
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_samples: number;

  safe_samples: number;

  biological_alerts: number;

  chemical_alerts: number;

  physical_concerns: number;

  mixed_hazards: number;

  do_not_boil_alerts: number;

  safe_percentage: number;

  do_not_boil_percentage: number;

  total_states: number;

  total_districts: number;

  category_distribution: CategoryCount[];

  source_distribution: {
    source: string;
    count: number;
    percentage: number;
  }[];

  severity_distribution: {
    severity: string;
    count: number;
    percentage: number;
  }[];

  top_chemical_states: {
    state_ut: string;
    chemical_alerts: number;
  }[];
}


// ─────────────────────────────────────────────────────────────────────────────
// Language selection
// ─────────────────────────────────────────────────────────────────────────────

export interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
  isRtl?: boolean;
}


// ─────────────────────────────────────────────────────────────────────────────
// AI advisory
// ─────────────────────────────────────────────────────────────────────────────

export interface AdvisoryResponse {
  warning_title: string;

  warning: string;

  caution: string;

  solution: string;

  short_message: string;

  source: string;

  model_used?: string;

  do_not_boil: boolean;

  /** Echoed back from deterministic rule engine — never changed by Gemini */
  safe_to_drink: boolean;

  /** Echoed back for frontend template selection */
  message_type: MessageType;

  /** The language generated */
  target_language: string;
  language_code: string;

  detailed_advisory?: {
    status: string;
    location: string;
    sample_date?: string;
    overall_risk: string;
    conclusion: string;
    detected_parameters: {
      parameter_name: string;
      measured_value: string;
      standard_limit: string;
      difference: string;
      is_above: boolean;
      explanation: string;
    }[];
    problem_explanation: string;
    health_concerns: string;
    possible_sources: string[];
    boiling_useful: boolean;
    boiling_explanation: string;
    citizen_actions: string[];
    authority_actions: string[];
    rule_trigger: string;
    confidence_note: string;
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Map marker
// ─────────────────────────────────────────────────────────────────────────────

export interface MapMarker {
  id: number;

  sample_id?: string;


  // ── Resolved coordinates ───────────────────────────────────────────────────

  lat: number;
  lon: number;


  // ── Coordinate metadata ───────────────────────────────────────────────────

  approximate: boolean;

  coordinate_source?:
    | 'sample_gps'
    | 'district_centroid'
    | 'state_centroid_visual_offset'
    | 'india_fallback_visual_offset'
    | string;

  location_precision?:
    | 'gps'
    | 'district'
    | 'state'
    | 'india'
    | string;


  // ── Administrative location ────────────────────────────────────────────────

  state_ut: string;
  district: string;
  village?: string;


  // ── Classification ─────────────────────────────────────────────────────────

  category?: AlertCategory;
  severity?: Severity;
  action_code?: ActionCode;

  do_not_boil: boolean;

  primary_contaminant?: string;


  // ── Additional sample information ─────────────────────────────────────────

  water_source_type?: string;

  season_cycle?: string;

  sample_date?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Map API response
// ─────────────────────────────────────────────────────────────────────────────

export interface MapResponse {
  markers: MapMarker[];

  total: number;

  returned: number;

  limit: number;

  has_more: boolean;

  coordinate_policy?: {
    gps?: string;
    district?: string;
    state?: string;
    india?: string;
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Demo scenario
// ─────────────────────────────────────────────────────────────────────────────

export interface DemoScenario {
  name: string;

  description: string;

  sample: Record<string, unknown>;

  verdict: WaterQualityVerdict;
}