import { differenceInYears } from 'date-fns';

import type {
  ActivityLevel,
  BMICategory,
  DietType,
  FitnessGoal,
  Gender,
  HealthMetrics,
  MacroTargets,
} from '../types';

// ── BMI ────────────────────────────────────────────────────────────

/** Body-Mass Index: weight (kg) / height (m)^2 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function getBMILabel(category: BMICategory): string {
  const labels: Record<BMICategory, string> = {
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obese',
  };
  return labels[category];
}

// ── BMR (Mifflin-St Jeor) ─────────────────────────────────────────

/**
 * Basal Metabolic Rate using the Mifflin-St Jeor equation.
 *
 * Male:   10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
 * Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

// ── TDEE ───────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Total Daily Energy Expenditure = BMR * activity multiplier */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

// ── Target Calories ────────────────────────────────────────────────

const GOAL_OFFSETS: Record<FitnessGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 400,
};

export function calculateTargetCalories(
  tdee: number,
  goal: FitnessGoal,
): number {
  return tdee + GOAL_OFFSETS[goal];
}

// ── Diet Recommendation ───────────────────────────────────────────

export function recommendDiet(
  bmiCategory: BMICategory,
  goal: FitnessGoal,
): DietType {
  if (goal === 'lose') {
    if (bmiCategory === 'obese') return 'keto';
    if (bmiCategory === 'overweight') return 'low_carb';
    return 'balanced';
  }

  if (goal === 'gain') {
    return 'high_protein';
  }

  // maintain
  if (bmiCategory === 'overweight' || bmiCategory === 'obese') {
    return 'low_carb';
  }
  return 'balanced';
}

// ── Macros ─────────────────────────────────────────────────────────

/**
 * Macro split percentages (carbs / protein / fat):
 *   keto:         5 / 25 / 70
 *   low_carb:    20 / 35 / 45
 *   balanced:    45 / 30 / 25
 *   high_protein: 35 / 40 / 25
 */
const MACRO_SPLITS: Record<DietType, { carbs: number; protein: number; fat: number }> = {
  keto: { carbs: 0.05, protein: 0.25, fat: 0.70 },
  low_carb: { carbs: 0.20, protein: 0.35, fat: 0.45 },
  balanced: { carbs: 0.45, protein: 0.30, fat: 0.25 },
  high_protein: { carbs: 0.35, protein: 0.40, fat: 0.25 },
};

/**
 * Convert target calories into gram targets for each macro.
 * Protein & carbs = 4 kcal/g, fat = 9 kcal/g.
 */
export function calculateMacros(
  targetCalories: number,
  dietType: DietType,
): MacroTargets {
  const split = MACRO_SPLITS[dietType];
  return {
    protein: Math.round((targetCalories * split.protein) / 4),
    carbs: Math.round((targetCalories * split.carbs) / 4),
    fat: Math.round((targetCalories * split.fat) / 9),
  };
}

// ── Orchestrator ───────────────────────────────────────────────────

export interface HealthMetricsInput {
  weightKg: number;
  heightCm: number;
  birthDate: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
}

/**
 * Single entry-point that computes every health metric from a user's
 * profile fields.
 */
export function calculateHealthMetrics(input: HealthMetricsInput): HealthMetrics {
  const { weightKg, heightCm, birthDate, gender, activityLevel, goal } = input;

  const age = differenceInYears(new Date(), new Date(birthDate));

  const bmi = calculateBMI(weightKg, heightCm);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal);
  const recommendedDiet = recommendDiet(bmiCategory, goal);
  const macros = calculateMacros(targetCalories, recommendedDiet);

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    targetCalories,
    macros,
    recommendedDiet,
  };
}
