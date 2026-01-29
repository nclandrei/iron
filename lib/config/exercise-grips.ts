// Grip options for exercises that support multiple grips

export type GripType = 'standard' | 'wide' | 'narrow' | 'neutral';

export interface GripConfig {
  options: GripType[];
  default: GripType;
}

// Map of exercise name -> grip configuration
export const exerciseGripMap: Record<string, GripConfig> = {
  'Lat pulldown': {
    options: ['standard', 'wide', 'narrow', 'neutral'],
    default: 'standard',
  },
  'Machine lat pulldown': {
    options: ['standard', 'wide', 'narrow', 'neutral'],
    default: 'standard',
  },
  'Cable row': {
    options: ['narrow', 'wide', 'neutral'],
    default: 'narrow',
  },
  'BB curl': {
    options: ['standard', 'wide', 'narrow'],
    default: 'standard',
  },
};

export function getGripConfig(exerciseName: string): GripConfig | null {
  return exerciseGripMap[exerciseName] || null;
}

export function getDefaultGrip(exerciseName: string): GripType | null {
  const config = exerciseGripMap[exerciseName];
  return config?.default || null;
}

export function hasGripOptions(exerciseName: string): boolean {
  return exerciseName in exerciseGripMap;
}

export const gripDisplayNames: Record<GripType, string> = {
  standard: 'Standard',
  wide: 'Wide',
  narrow: 'Narrow',
  neutral: 'Neutral',
};
