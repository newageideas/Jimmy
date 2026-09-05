export interface Terpene {
  name: string;
  percentage: number;
  note: string;
}

export interface Strain {
  id: string;
  name: string;
  tag?: string;
  desc?: string;
  img?: string;
  imgs?: string[];
  cbdPercent?: number;
  thcPercent?: number;
  terpenes?: Terpene[];
  aromaNotes?: string;
  lineage?: string;
  phenotypeAppearance?: string;
  floweringWeeks?: number;
  harvestWindow?: string;
  isCustom?: boolean;
}

export type GrowthStageKey = 'clone_cutting' | 'rooting' | 'vegetative' | 'early_bloom' | 'full_flower' | 'cured_nug';

export interface GrowthStageInfo {
  key: GrowthStageKey;
  progressRange: [number, number]; // [min, max] between 0 and 1
  label: string;
  subLabel: string;
  timeframe: string;
  title: string;
  description: string;
  botanicalHighlight: string;
  cannabinoids: {
    cbd: string;
    thc: string;
    terpenes: string;
  };
  keyFeatures: string[];
}

export type LightingMode = 'golden' | 'daylight' | 'grow_led' | 'macro_dark';

export type GrowthOrigin = 'seed' | 'clone';
