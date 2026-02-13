// ── Types ─────────────────────────────────────────────────────────

export type CardioActivity = 'walking' | 'running' | 'cycling' | 'swimming';

export interface CardioActivityInfo {
  id: CardioActivity;
  name: string;
  emoji: string;
  description: string;
  avgHeartRate: number; // average HR for this activity
  metValue: number; // MET value
}

// ── Activity Data ─────────────────────────────────────────────────

export const CARDIO_ACTIVITIES: CardioActivityInfo[] = [
  { id: 'walking', name: 'Walking', emoji: '\u{1F6B6}', description: 'Brisk walk at 3.5 mph', avgHeartRate: 100, metValue: 3.5 },
  { id: 'running', name: 'Running', emoji: '\u{1F3C3}', description: 'Jogging at 5-6 mph', avgHeartRate: 150, metValue: 9.8 },
  { id: 'cycling', name: 'Cycling', emoji: '\u{1F6B4}', description: 'Moderate cycling 12-14 mph', avgHeartRate: 130, metValue: 8.0 },
  { id: 'swimming', name: 'Swimming', emoji: '\u{1F3CA}', description: 'Moderate swimming', avgHeartRate: 140, metValue: 7.0 },
];

// ── Motivational Tips ─────────────────────────────────────────────

const MOTIVATIONAL_TIPS: Record<CardioActivity, string> = {
  walking: 'Walking is the simplest way to stay active. Try taking the stairs or parking further away!',
  running: 'Running boosts your mood with endorphins. Start slow and build up your pace gradually.',
  cycling: 'Cycling is easy on the joints and great for building leg strength. Enjoy the ride!',
  swimming: 'Swimming works your entire body with minimal joint impact. Dive in and feel refreshed!',
};

export function getMotivationalTip(activity: CardioActivity): string {
  return MOTIVATIONAL_TIPS[activity];
}

// ── Calorie Calculators ───────────────────────────────────────────

/**
 * Calculate calories burned per minute using heart rate.
 * Uses the Keytel et al. formula:
 * Male:   Cal/min = (-55.0969 + 0.6309 * HR + 0.1988 * weight_kg + 0.2017 * age) / 4.184
 * Female: Cal/min = (-20.4022 + 0.4472 * HR + 0.1263 * weight_kg + 0.074 * age) / 4.184
 */
export function caloriesPerMinuteHR(
  heartRate: number,
  weightKg: number,
  age: number,
  gender: 'male' | 'female',
): number {
  let calPerMin: number;

  if (gender === 'male') {
    calPerMin =
      (-55.0969 + 0.6309 * heartRate + 0.1988 * weightKg + 0.2017 * age) /
      4.184;
  } else {
    calPerMin =
      (-20.4022 + 0.4472 * heartRate + 0.1263 * weightKg + 0.074 * age) /
      4.184;
  }

  // Ensure we never return negative or zero
  return Math.max(calPerMin, 0.5);
}

/**
 * Calculate calories burned per minute using MET value.
 * Formula: Cal/min = MET * 3.5 * weight_kg / 200
 */
export function caloriesPerMinuteMET(
  metValue: number,
  weightKg: number,
): number {
  return (metValue * 3.5 * weightKg) / 200;
}

/**
 * Calculate how many minutes needed to burn targetCalories.
 * If heartRate is provided, use HR formula. Otherwise use MET formula.
 */
export function minutesToBurnCalories(
  targetCalories: number,
  activity: CardioActivityInfo,
  weightKg: number,
  age: number,
  gender: 'male' | 'female',
  heartRate?: number,
): number {
  if (targetCalories <= 0) return 0;

  const hr = heartRate ?? activity.avgHeartRate;
  let calPerMin: number;

  if (heartRate) {
    calPerMin = caloriesPerMinuteHR(hr, weightKg, age, gender);
  } else {
    calPerMin = caloriesPerMinuteMET(activity.metValue, weightKg);
  }

  if (calPerMin <= 0) return 0;

  return Math.ceil(targetCalories / calPerMin);
}

/**
 * Get a suggested cardio plan to burn the remaining daily calories.
 * Returns suggestions for each activity with duration.
 */
export function getCardioSuggestions(
  caloriesToBurn: number,
  weightKg: number,
  age: number,
  gender: 'male' | 'female',
  heartRate?: number,
): Array<{
  activity: CardioActivityInfo;
  durationMinutes: number;
  caloriesBurned: number;
}> {
  if (caloriesToBurn <= 0) return [];

  return CARDIO_ACTIVITIES.map((activity) => {
    const duration = minutesToBurnCalories(
      caloriesToBurn,
      activity,
      weightKg,
      age,
      gender,
      heartRate,
    );

    return {
      activity,
      durationMinutes: duration,
      caloriesBurned: Math.round(caloriesToBurn),
    };
  });
}
