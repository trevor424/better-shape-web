import type { UnitSystem } from '../types';

// ── Weight ─────────────────────────────────────────────────────────

const KG_TO_LBS = 2.20462;

export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS;
}

export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS;
}

// ── Height ─────────────────────────────────────────────────────────

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches % INCHES_PER_FOOT);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return totalInches * CM_PER_INCH;
}

// ── Formatters ─────────────────────────────────────────────────────

/**
 * Format a weight value for display.
 *
 * - metric:   "75.0 kg"
 * - imperial: "165.3 lbs"
 */
export function formatWeight(weightKg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    return `${kgToLbs(weightKg).toFixed(1)} lbs`;
  }
  return `${weightKg.toFixed(1)} kg`;
}

/**
 * Format a height value for display.
 *
 * - metric:   "175 cm"
 * - imperial: "5'9""
 */
export function formatHeight(heightCm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(heightCm)} cm`;
}
