// Utility helpers for JalRakshak frontend

// ── Category configuration ─────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<string, {
  label: string; color: string; badgeClass: string; icon: string;
}> = {
  POTABLE_SAFE:               { label: 'Potable — Safe',     color: '#10b981', badgeClass: 'badge-safe',  icon: '' },
  UNSAFE_BIOLOGICAL_PATHOGEN: { label: 'Biological Pathogen', color: '#f97316', badgeClass: 'badge-bio',   icon: '' },
  CRITICAL_CHEMICAL_TOXIN:    { label: 'Chemical Toxin',      color: '#ef4444', badgeClass: 'badge-chem',  icon: '' },
  MODERATE_PHYSICAL_PARAM:    { label: 'Physical Parameter',  color: '#eab308', badgeClass: 'badge-phys',  icon: '' },
  CRITICAL_MIXED_HAZARD:      { label: 'Mixed Hazard',        color: '#dc2626', badgeClass: 'badge-mixed', icon: '' },
};

// ── Action configuration ───────────────────────────────────────────────────────

export const ACTION_CONFIG: Record<string, { label: string; icon: string; isDoNotBoil: boolean }> = {
  SAFE_TO_DRINK:                       { label: 'Safe to Drink',         icon: '', isDoNotBoil: false },
  BOIL_OR_CHLORINATE_REQUIRED:         { label: 'Boil / Chlorinate',      icon: '', isDoNotBoil: false },
  DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY: { label: 'Use Alternative Source', icon: '', isDoNotBoil: true  },
  FILTRATION_TREATMENT_RECOMMENDED:    { label: 'Filter & Treat',         icon: '', isDoNotBoil: false },
  FILTER_AND_RETEST:                   { label: 'Filter & Retest',        icon: '', isDoNotBoil: false },
  MIXED_HAZARD_CHEMICAL_PRIORITY:      { label: 'Use Alternative Source', icon: '', isDoNotBoil: true  },
};

// ── Severity configuration ─────────────────────────────────────────────────────

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  SAFE:     { label: 'Safe',     color: '#10b981', bgColor: 'rgba(16,185,129,0.15)'  },
  LOW:      { label: 'Low',      color: '#60a5fa', bgColor: 'rgba(96,165,250,0.15)'  },
  MODERATE: { label: 'Moderate', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)'   },
  HIGH:     { label: 'High',     color: '#f97316', bgColor: 'rgba(249,115,22,0.15)'  },
  CRITICAL: { label: 'Critical', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)'   },
};

// ── Message type configuration ─────────────────────────────────────────────────
// Used by UI to render appropriate context banners and labels based on
// the deterministic message_type from the rule engine.

export const MESSAGE_TYPE_CONFIG: Record<string, {
  label: string;
  headline: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  // What should the user DO?
  actionHeading: string;
  // What should the user AVOID?
  avoidHeading: string | null;
}> = {
  SAFE: {
    label:        'Water is Safe',
    headline:     'No water quality issues detected',
    icon:         '',
    color:        '#10b981',
    bgColor:      'rgba(16,185,129,0.1)',
    borderColor:  '#10b981',
    actionHeading:'Continue monitoring',
    avoidHeading: null,
  },
  BIOLOGICAL_CONTAMINATION: {
    label:        'Biological Contamination',
    headline:     'Pathogen contamination detected',
    icon:         '',
    color:        '#f97316',
    bgColor:      'rgba(249,115,22,0.1)',
    borderColor:  '#f97316',
    actionHeading:'Disinfection required',
    avoidHeading: null,
  },
  CHEMICAL_CONTAMINATION: {
    label:        'Chemical Contamination',
    headline:     'Chemical contaminant exceeds safe limit',
    icon:         '',
    color:        '#ef4444',
    bgColor:      'rgba(239,68,68,0.1)',
    borderColor:  '#ef4444',
    actionHeading:'Required action',
    avoidHeading: 'Critical restriction',
  },
  PHYSICAL_PARAMETER: {
    label:        'Physical Parameter Issue',
    headline:     'Physical quality parameter exceeds threshold',
    icon:         '',
    color:        '#eab308',
    bgColor:      'rgba(234,179,8,0.1)',
    borderColor:  '#eab308',
    actionHeading:'Treatment recommended',
    avoidHeading: null,
  },
  MIXED_HAZARD: {
    label:        'Mixed Hazard',
    headline:     'Chemical and biological contamination detected',
    icon:         '',
    color:        '#dc2626',
    bgColor:      'rgba(220,38,38,0.1)',
    borderColor:  '#dc2626',
    actionHeading:'Required action',
    avoidHeading: 'Critical restriction',
  },
};

// ── Recommended action labels ──────────────────────────────────────────────────
// Converts structured action codes to human-readable English.

export const RECOMMENDED_ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  BOIL_OR_CHLORINATE:                      { label: 'Boil or chlorinate before drinking',              icon: '' },
  DISINFECT_BEFORE_DRINKING:               { label: 'Disinfect before drinking',                       icon: '' },
  USE_ALTERNATIVE_SAFE_SOURCE:             { label: 'Use a certified safe alternative water source',   icon: '' },
  USE_APPROPRIATE_CHEMICAL_TREATMENT:      { label: 'Use appropriate chemical treatment system',       icon: '' },
  DISINFECT_FOR_BIOLOGICAL_CONTAMINATION:  { label: 'Also disinfect for biological contamination',     icon: '' },
  FILTER_OR_TREAT:                         { label: 'Filter or apply appropriate treatment',           icon: '' },
  RETEST:                                  { label: 'Retest after treatment',                          icon: '' },
};

// ── Avoid action labels ────────────────────────────────────────────────────────

export const AVOID_ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  DO_NOT_RELY_ON_BOILING: {
    label: 'Do not rely on boiling — boiling concentrates chemical contaminants',
    icon:  '',
  },
};

// ── Getter helpers ─────────────────────────────────────────────────────────────

export function getCategoryConfig(category?: string) {
  return CATEGORY_CONFIG[category || ''] || CATEGORY_CONFIG.POTABLE_SAFE;
}

export function getActionConfig(actionCode?: string) {
  return ACTION_CONFIG[actionCode || ''] || ACTION_CONFIG.SAFE_TO_DRINK;
}

export function getSeverityConfig(severity?: string) {
  return SEVERITY_CONFIG[severity || 'SAFE'] || SEVERITY_CONFIG.SAFE;
}

export function getMessageTypeConfig(messageType?: string) {
  return MESSAGE_TYPE_CONFIG[messageType || 'SAFE'] || MESSAGE_TYPE_CONFIG.SAFE;
}

export function getRecommendedActionLabel(code: string) {
  return RECOMMENDED_ACTION_LABELS[code] || { label: code.replace(/_/g, ' ').toLowerCase(), icon: '' };
}

export function getAvoidActionLabel(code: string) {
  return AVOID_ACTION_LABELS[code] || { label: code.replace(/_/g, ' ').toLowerCase(), icon: '' };
}

export function getMapColor(category?: string, doNotBoil?: boolean): string {
  if (doNotBoil) return '#ef4444';
  switch (category) {
    case 'POTABLE_SAFE':               return '#10b981';
    case 'UNSAFE_BIOLOGICAL_PATHOGEN': return '#f97316';
    case 'CRITICAL_CHEMICAL_TOXIN':    return '#ef4444';
    case 'MODERATE_PHYSICAL_PARAM':    return '#eab308';
    case 'CRITICAL_MIXED_HAZARD':      return '#dc2626';
    default:                           return '#64748b';
  }
}

export function formatValue(val?: number, decimals = 2): string {
  if (val === undefined || val === null) return '—';
  return val.toFixed(decimals);
}

export function formatPercentage(val: number): string {
  return `${val.toFixed(1)}%`;
}
