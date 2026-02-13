// ── Enums & Literal Types ──────────────────────────────────────────

export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type FitnessGoal = 'lose' | 'maintain' | 'gain';

export type UnitSystem = 'metric' | 'imperial';

export type DietType = 'keto' | 'low_carb' | 'balanced' | 'high_protein';

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ── Composite Types ────────────────────────────────────────────────

export type MacroTargets = {
  protein: number;
  carbs: number;
  fat: number;
};

export type HealthMetrics = {
  bmi: number;
  bmiCategory: BMICategory;
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: MacroTargets;
  recommendedDiet: DietType;
};

// ── User ───────────────────────────────────────────────────────────

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  gender: Gender;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  unitSystem: UnitSystem;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Nutrition ──────────────────────────────────────────────────────

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  category: string;
  dietTypes: DietType[];
  mealTypes: MealType[];
};

export type MealLogEntry = {
  id: string;
  foodId: string;
  foodName: string;
  date: string;
  mealType: MealType;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// ── Weight Tracking ────────────────────────────────────────────────

export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
};

// ── Workouts ───────────────────────────────────────────────────────

export type Exercise = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  type: 'compound' | 'isolation';
  equipment: string;
};

export type WorkoutSet = {
  reps: number;
  weight: number;
  completed: boolean;
};

export type WorkoutExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
};

export type WorkoutLog = {
  id: string;
  date: string;
  planName?: string;
  dayName?: string;
  exercises: WorkoutExerciseLog[];
  durationMinutes: number;
  startedAt: string;
  completedAt: string;
};
