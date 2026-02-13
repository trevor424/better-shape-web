import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInYears, format } from 'date-fns';
import {
  User,
  Mars,
  Venus,
  Calendar,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Check,
  Armchair,
  PersonStanding,
  Bike,
  Dumbbell,
  Zap,
  TrendingDown,
  Minus,
  TrendingUp,
} from 'lucide-react';

import { Button, Input, Card } from '@/components/ui';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import { calculateHealthMetrics, getBMILabel } from '@/lib/calculators';
import {
  kgToLbs,
  lbsToKg,
  cmToFeetInches,
  feetInchesToCm,
} from '@/lib/converters';

import type {
  Gender,
  ActivityLevel,
  FitnessGoal,
  UnitSystem,
  UserProfile,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;

const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
  icon: typeof Armchair;
}[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise',
    icon: Armchair,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Light exercise 1-3 days/week',
    icon: PersonStanding,
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Moderate exercise 3-5 days/week',
    icon: Bike,
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Hard exercise 6-7 days/week',
    icon: Dumbbell,
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Very hard exercise, physical job',
    icon: Zap,
  },
];

const GOAL_OPTIONS: {
  value: FitnessGoal;
  label: string;
  icon: typeof TrendingDown;
}[] = [
  { value: 'lose', label: 'Lose Weight', icon: TrendingDown },
  { value: 'maintain', label: 'Maintain', icon: Minus },
  { value: 'gain', label: 'Gain Muscle', icon: TrendingUp },
];

const DIET_LABELS: Record<string, string> = {
  keto: 'Keto',
  low_carb: 'Low Carb',
  balanced: 'Balanced',
  high_protein: 'High Protein',
};

// ── Zod Schemas per step ──────────────────────────────────────────────

const nameSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
});

const birthdateSchema = z.object({
  birthDate: z.string().refine(
    (val) => {
      if (!val) return false;
      const age = differenceInYears(new Date(), new Date(val));
      return age >= 13;
    },
    { message: 'You must be at least 13 years old' },
  ),
});

const bodyMetricSchema = z.object({
  heightCm: z.number().min(50, 'Height is too low').max(300, 'Height is too high'),
  weightKg: z.number().min(20, 'Weight is too low').max(500, 'Weight is too high'),
});

// ── Component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { uid, email } = useAuthStore();
  const { onboardingData, updateOnboardingData, setProfile, setHealthMetrics } =
    useUserStore();

  const [currentStep, setCurrentStep] = useState(1);

  // ── Per-step local state ──────────────────────────────────────────

  // Step 1: Name
  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { displayName: onboardingData.displayName ?? '' },
  });

  // Step 2: Gender
  const [gender, setGender] = useState<Gender | null>(
    onboardingData.gender ?? null,
  );
  const [genderError, setGenderError] = useState('');

  // Step 3: Birthdate
  const birthdateForm = useForm<z.infer<typeof birthdateSchema>>({
    resolver: zodResolver(birthdateSchema),
    defaultValues: { birthDate: onboardingData.birthDate ?? '' },
  });

  // Step 4: Body measurements
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    onboardingData.unitSystem ?? 'metric',
  );
  const [heightCm, setHeightCm] = useState<number>(onboardingData.heightCm ?? 0);
  const [weightKg, setWeightKg] = useState<number>(onboardingData.weightKg ?? 0);
  // Imperial helpers
  const [feet, setFeet] = useState<number>(() => {
    if (onboardingData.heightCm) {
      return cmToFeetInches(onboardingData.heightCm).feet;
    }
    return 0;
  });
  const [inches, setInches] = useState<number>(() => {
    if (onboardingData.heightCm) {
      return cmToFeetInches(onboardingData.heightCm).inches;
    }
    return 0;
  });
  const [weightLbs, setWeightLbs] = useState<number>(() => {
    if (onboardingData.weightKg) {
      return Math.round(kgToLbs(onboardingData.weightKg) * 10) / 10;
    }
    return 0;
  });
  const [bodyError, setBodyError] = useState('');

  // Step 5: Activity level
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    onboardingData.activityLevel ?? null,
  );
  const [activityError, setActivityError] = useState('');

  // Step 6: Goal
  const [goal, setGoal] = useState<FitnessGoal | null>(
    onboardingData.goal ?? null,
  );
  const [goalError, setGoalError] = useState('');

  // ── Computed health metrics for summary ───────────────────────────

  const healthMetrics = useMemo(() => {
    if (
      !onboardingData.weightKg ||
      !onboardingData.heightCm ||
      !onboardingData.birthDate ||
      !onboardingData.gender ||
      !onboardingData.activityLevel ||
      !onboardingData.goal
    ) {
      return null;
    }
    return calculateHealthMetrics({
      weightKg: onboardingData.weightKg,
      heightCm: onboardingData.heightCm,
      birthDate: onboardingData.birthDate,
      gender: onboardingData.gender,
      activityLevel: onboardingData.activityLevel,
      goal: onboardingData.goal,
    });
  }, [onboardingData]);

  // ── Navigation helpers ────────────────────────────────────────────

  function goBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }

  async function goNext() {
    const valid = await validateCurrentStep();
    if (!valid) return;
    saveCurrentStep();
    setCurrentStep((s) => s + 1);
  }

  async function validateCurrentStep(): Promise<boolean> {
    switch (currentStep) {
      case 1: {
        const result = await nameForm.trigger();
        return result;
      }
      case 2: {
        if (!gender) {
          setGenderError('Please select your gender');
          return false;
        }
        setGenderError('');
        return true;
      }
      case 3: {
        const result = await birthdateForm.trigger();
        return result;
      }
      case 4: {
        const finalHeightCm =
          unitSystem === 'imperial' ? feetInchesToCm(feet, inches) : heightCm;
        const finalWeightKg =
          unitSystem === 'imperial' ? lbsToKg(weightLbs) : weightKg;

        const parsed = bodyMetricSchema.safeParse({
          heightCm: finalHeightCm,
          weightKg: finalWeightKg,
        });
        if (!parsed.success) {
          setBodyError(parsed.error.issues[0]?.message ?? 'Invalid measurements');
          return false;
        }
        setBodyError('');
        return true;
      }
      case 5: {
        if (!activityLevel) {
          setActivityError('Please select your activity level');
          return false;
        }
        setActivityError('');
        return true;
      }
      case 6: {
        if (!goal) {
          setGoalError('Please select your goal');
          return false;
        }
        setGoalError('');
        return true;
      }
      default:
        return true;
    }
  }

  function saveCurrentStep() {
    switch (currentStep) {
      case 1:
        updateOnboardingData({ displayName: nameForm.getValues('displayName') });
        break;
      case 2:
        updateOnboardingData({ gender: gender! });
        break;
      case 3:
        updateOnboardingData({ birthDate: birthdateForm.getValues('birthDate') });
        break;
      case 4: {
        const finalHeightCm =
          unitSystem === 'imperial' ? feetInchesToCm(feet, inches) : heightCm;
        const finalWeightKg =
          unitSystem === 'imperial' ? lbsToKg(weightLbs) : weightKg;
        updateOnboardingData({
          heightCm: Math.round(finalHeightCm * 100) / 100,
          weightKg: Math.round(finalWeightKg * 100) / 100,
          unitSystem,
        });
        break;
      }
      case 5:
        updateOnboardingData({ activityLevel: activityLevel! });
        break;
      case 6:
        updateOnboardingData({ goal: goal! });
        break;
    }
  }

  function handleComplete() {
    if (!healthMetrics) return;

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: uid ?? '',
      email: email ?? '',
      displayName: onboardingData.displayName ?? '',
      gender: onboardingData.gender!,
      birthDate: onboardingData.birthDate!,
      heightCm: onboardingData.heightCm!,
      weightKg: onboardingData.weightKg!,
      activityLevel: onboardingData.activityLevel!,
      goal: onboardingData.goal!,
      unitSystem: onboardingData.unitSystem ?? 'metric',
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
    };

    setProfile(profile);
    setHealthMetrics(healthMetrics);
    navigate('/');
  }

  // ── Progress bar ──────────────────────────────────────────────────

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  // ── Step titles ───────────────────────────────────────────────────

  const stepTitles: Record<number, string> = {
    1: "What's your name?",
    2: "What's your gender?",
    3: "When were you born?",
    4: 'Your body measurements',
    5: 'How active are you?',
    6: "What's your goal?",
    7: 'Your personalized plan',
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-sm text-dark-300">
          <span>Step {currentStep} of {TOTAL_STEPS}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-dark-800 animate-scale-in">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step title */}
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          {stepTitles[currentStep]}
        </h1>

        {/* Step content */}
        <div className="mb-8 animate-fade-in" key={currentStep}>
          {currentStep === 1 && <StepName form={nameForm} />}
          {currentStep === 2 && (
            <StepGender
              value={gender}
              onChange={(g) => {
                setGender(g);
                setGenderError('');
              }}
              error={genderError}
            />
          )}
          {currentStep === 3 && <StepBirthdate form={birthdateForm} />}
          {currentStep === 4 && (
            <StepBody
              unitSystem={unitSystem}
              setUnitSystem={setUnitSystem}
              heightCm={heightCm}
              setHeightCm={setHeightCm}
              weightKg={weightKg}
              setWeightKg={setWeightKg}
              feet={feet}
              setFeet={setFeet}
              inches={inches}
              setInches={setInches}
              weightLbs={weightLbs}
              setWeightLbs={setWeightLbs}
              error={bodyError}
            />
          )}
          {currentStep === 5 && (
            <StepActivity
              value={activityLevel}
              onChange={(a) => {
                setActivityLevel(a);
                setActivityError('');
              }}
              error={activityError}
            />
          )}
          {currentStep === 6 && (
            <StepGoal
              value={goal}
              onChange={(g) => {
                setGoal(g);
                setGoalError('');
              }}
              error={goalError}
            />
          )}
          {currentStep === 7 && healthMetrics && (
            <StepSummary
              metrics={healthMetrics}
              onboardingData={onboardingData}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button variant="secondary" onClick={goBack} size="lg">
              <ChevronLeft size={20} />
              Back
            </Button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <Button onClick={goNext} size="lg" fullWidth>
              Continue
              <ChevronRight size={20} />
            </Button>
          ) : (
            <Button onClick={handleComplete} size="lg" fullWidth>
              <Check size={20} />
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Name ────────────────────────────────────────────────────

function StepName({
  form,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof nameSchema>>>;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-800">
        <User size={36} className="text-primary-500" />
      </div>
      <div className="w-full">
        <Input
          label="Your name"
          placeholder="Enter your name"
          {...form.register('displayName')}
          error={form.formState.errors.displayName?.message}
        />
      </div>
    </div>
  );
}

// ── Step 2: Gender ──────────────────────────────────────────────────

function StepGender({
  value,
  onChange,
  error,
}: {
  value: Gender | null;
  onChange: (g: Gender) => void;
  error: string;
}) {
  const options: { gender: Gender; label: string; icon: typeof Mars }[] = [
    { gender: 'male', label: 'Male', icon: Mars },
    { gender: 'female', label: 'Female', icon: Venus },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => {
          const selected = value === opt.gender;
          return (
            <Card
              key={opt.gender}
              onClick={() => onChange(opt.gender)}
              className={`flex flex-col items-center gap-3 p-6 transition-all ${
                selected
                  ? 'ring-2 ring-primary-500 bg-dark-800'
                  : 'hover:bg-dark-800'
              }`}
            >
              <opt.icon
                size={40}
                className={selected ? 'text-primary-500' : 'text-dark-300'}
              />
              <span
                className={`text-lg font-semibold ${
                  selected ? 'text-primary-400' : 'text-white'
                }`}
              >
                {opt.label}
              </span>
            </Card>
          );
        })}
      </div>
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ── Step 3: Birthdate ───────────────────────────────────────────────

function StepBirthdate({
  form,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof birthdateSchema>>>;
}) {
  const watchedDate = form.watch('birthDate');
  const age = watchedDate
    ? differenceInYears(new Date(), new Date(watchedDate))
    : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-800">
        <Calendar size={36} className="text-primary-500" />
      </div>
      <div className="w-full">
        <Input
          label="Date of birth"
          type="date"
          {...form.register('birthDate')}
          error={form.formState.errors.birthDate?.message}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>
      {age !== null && age >= 13 && (
        <p className="text-dark-300">
          You are <span className="font-semibold text-white">{age}</span> years old
        </p>
      )}
    </div>
  );
}

// ── Step 4: Body Measurements ───────────────────────────────────────

function StepBody({
  unitSystem,
  setUnitSystem,
  heightCm,
  setHeightCm,
  weightKg,
  setWeightKg,
  feet,
  setFeet,
  inches,
  setInches,
  weightLbs,
  setWeightLbs,
  error,
}: {
  unitSystem: UnitSystem;
  setUnitSystem: (u: UnitSystem) => void;
  heightCm: number;
  setHeightCm: (v: number) => void;
  weightKg: number;
  setWeightKg: (v: number) => void;
  feet: number;
  setFeet: (v: number) => void;
  inches: number;
  setInches: (v: number) => void;
  weightLbs: number;
  setWeightLbs: (v: number) => void;
  error: string;
}) {
  function handleUnitToggle(system: UnitSystem) {
    if (system === unitSystem) return;

    if (system === 'imperial') {
      // Convert current metric values to imperial for display
      if (heightCm > 0) {
        const converted = cmToFeetInches(heightCm);
        setFeet(converted.feet);
        setInches(converted.inches);
      }
      if (weightKg > 0) {
        setWeightLbs(Math.round(kgToLbs(weightKg) * 10) / 10);
      }
    } else {
      // Convert current imperial values to metric for display
      if (feet > 0 || inches > 0) {
        setHeightCm(Math.round(feetInchesToCm(feet, inches)));
      }
      if (weightLbs > 0) {
        setWeightKg(Math.round(lbsToKg(weightLbs) * 10) / 10);
      }
    }

    setUnitSystem(system);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-800">
        <Ruler size={36} className="text-primary-500" />
      </div>

      {/* Unit toggle */}
      <div className="flex w-full overflow-hidden rounded-xl bg-dark-800">
        <button
          type="button"
          onClick={() => handleUnitToggle('metric')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            unitSystem === 'metric'
              ? 'bg-primary-500 text-white'
              : 'text-dark-300 hover:text-primary-400'
          }`}
        >
          Metric
        </button>
        <button
          type="button"
          onClick={() => handleUnitToggle('imperial')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            unitSystem === 'imperial'
              ? 'bg-primary-500 text-white'
              : 'text-dark-300 hover:text-primary-400'
          }`}
        >
          Imperial
        </button>
      </div>

      {/* Height */}
      {unitSystem === 'metric' ? (
        <Input
          label="Height (cm)"
          type="number"
          placeholder="175"
          value={heightCm || ''}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          min={50}
          max={300}
        />
      ) : (
        <div className="w-full">
          <label className="mb-1.5 block text-sm text-dark-300">Height</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="5"
                value={feet || ''}
                onChange={(e) => setFeet(Number(e.target.value))}
                min={1}
                max={8}
              />
              <span className="mt-1 block text-center text-xs text-dark-400">
                feet
              </span>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="9"
                value={inches || ''}
                onChange={(e) => setInches(Number(e.target.value))}
                min={0}
                max={11}
              />
              <span className="mt-1 block text-center text-xs text-dark-400">
                inches
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Weight */}
      {unitSystem === 'metric' ? (
        <Input
          label="Weight (kg)"
          type="number"
          placeholder="75"
          value={weightKg || ''}
          onChange={(e) => setWeightKg(Number(e.target.value))}
          min={20}
          max={500}
          step={0.1}
        />
      ) : (
        <Input
          label="Weight (lbs)"
          type="number"
          placeholder="165"
          value={weightLbs || ''}
          onChange={(e) => setWeightLbs(Number(e.target.value))}
          min={44}
          max={1100}
          step={0.1}
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ── Step 5: Activity Level ──────────────────────────────────────────

function StepActivity({
  value,
  onChange,
  error,
}: {
  value: ActivityLevel | null;
  onChange: (a: ActivityLevel) => void;
  error: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {ACTIVITY_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Card
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-4 p-4 transition-all ${
              selected
                ? 'ring-2 ring-primary-500 bg-dark-800'
                : 'hover:bg-dark-800'
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                selected ? 'bg-primary-500/20' : 'bg-dark-800'
              }`}
            >
              <opt.icon
                size={24}
                className={selected ? 'text-primary-500' : 'text-dark-300'}
              />
            </div>
            <div>
              <p
                className={`font-semibold ${
                  selected ? 'text-primary-400' : 'text-white'
                }`}
              >
                {opt.label}
              </p>
              <p className="text-sm text-dark-300">{opt.description}</p>
            </div>
          </Card>
        );
      })}
      {error && <p className="mt-1 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ── Step 6: Goal ────────────────────────────────────────────────────

function StepGoal({
  value,
  onChange,
  error,
}: {
  value: FitnessGoal | null;
  onChange: (g: FitnessGoal) => void;
  error: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {GOAL_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Card
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-3 p-5 transition-all ${
                selected
                  ? 'ring-2 ring-primary-500 bg-dark-800'
                  : 'hover:bg-dark-800'
              }`}
            >
              <opt.icon
                size={32}
                className={selected ? 'text-primary-500' : 'text-dark-300'}
              />
              <span
                className={`text-center text-sm font-semibold ${
                  selected ? 'text-primary-400' : 'text-white'
                }`}
              >
                {opt.label}
              </span>
            </Card>
          );
        })}
      </div>
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ── Step 7: Summary ─────────────────────────────────────────────────

function StepSummary({
  metrics,
  onboardingData,
}: {
  metrics: NonNullable<ReturnType<typeof calculateHealthMetrics>>;
  onboardingData: Partial<UserProfile>;
}) {
  const summaryItems: { label: string; value: string }[] = [
    {
      label: 'BMI',
      value: `${metrics.bmi.toFixed(1)} - ${getBMILabel(metrics.bmiCategory)}`,
    },
    {
      label: 'BMR',
      value: `${Math.round(metrics.bmr)} kcal/day`,
    },
    {
      label: 'TDEE',
      value: `${Math.round(metrics.tdee)} kcal/day`,
    },
    {
      label: 'Target Calories',
      value: `${Math.round(metrics.targetCalories)} kcal/day`,
    },
    {
      label: 'Recommended Diet',
      value: DIET_LABELS[metrics.recommendedDiet] ?? metrics.recommendedDiet,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* User snapshot */}
      <Card className="p-5">
        <p className="mb-3 text-center text-lg font-semibold text-primary-400">
          Hi, {onboardingData.displayName}!
        </p>
        <p className="text-center text-sm text-dark-300">
          Based on your information, here is your personalized plan.
        </p>
      </Card>

      {/* Health metrics */}
      <Card className="flex flex-col gap-4 p-5">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-dark-300">{item.label}</span>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </Card>

      {/* Macro breakdown */}
      <Card className="p-5">
        <h3 className="mb-4 text-center font-semibold text-white">
          Daily Macro Targets
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <MacroItem
            label="Protein"
            grams={metrics.macros.protein}
            color="bg-primary-500"
          />
          <MacroItem
            label="Carbs"
            grams={metrics.macros.carbs}
            color="bg-blue-500"
          />
          <MacroItem
            label="Fat"
            grams={metrics.macros.fat}
            color="bg-yellow-500"
          />
        </div>
      </Card>
    </div>
  );
}

function MacroItem({
  label,
  grams,
  color,
}: {
  label: string;
  grams: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-2xl font-bold text-white">{grams}g</span>
      <span className="text-xs text-dark-300">{label}</span>
    </div>
  );
}
