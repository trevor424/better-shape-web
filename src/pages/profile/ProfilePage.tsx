import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInYears, format } from 'date-fns';
import {
  User,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Activity,
  Target,
  Calculator,
  Settings,
  Save,
  RefreshCw,
  LogOut,
  Trash2,
  Moon,
  Scale,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Check,
  AlertTriangle,
} from 'lucide-react';

import { Button, Input, Card } from '@/components/ui';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import { calculateHealthMetrics, getBMILabel } from '@/lib/calculators';
import { formatWeight, formatHeight } from '@/lib/converters';

import type {
  Gender,
  ActivityLevel,
  FitnessGoal,
  UnitSystem,
  BMICategory,
  DietType,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────────────

type TabKey = 'overview' | 'edit' | 'calculator' | 'settings';

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'edit', label: 'Edit Profile', icon: Settings },
  { key: 'calculator', label: 'Calculator', icon: Calculator },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  active: 'Active',
  very_active: 'Very Active',
};

const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Little or no exercise',
  light: 'Light exercise 1-3 days/week',
  moderate: 'Moderate exercise 3-5 days/week',
  active: 'Hard exercise 6-7 days/week',
  very_active: 'Very hard exercise, physical job',
};

const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain: 'Gain Muscle',
};

const DIET_LABELS: Record<DietType, string> = {
  keto: 'Keto',
  low_carb: 'Low Carb',
  balanced: 'Balanced',
  high_protein: 'High Protein',
};

const BMI_COLORS: Record<BMICategory, string> = {
  underweight: 'bg-blue-500',
  normal: 'bg-green-500',
  overweight: 'bg-yellow-500',
  obese: 'bg-red-500',
};

// ── Component ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const profile = useUserStore((s) => s.profile);
  const healthMetrics = useUserStore((s) => s.healthMetrics);
  const setProfile = useUserStore((s) => s.setProfile);
  const setHealthMetrics = useUserStore((s) => s.setHealthMetrics);
  const clearUser = useUserStore((s) => s.clearUser);

  const email = useAuthStore((s) => s.email);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-dark-300">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Profile</h1>
        <p className="mt-1 text-dark-300">
          Manage your account and health information
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-dark-900 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'text-dark-300 hover:bg-dark-800 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewSection profile={profile} email={email} />
      )}
      {activeTab === 'edit' && (
        <EditSection
          profile={profile}
          setProfile={setProfile}
          setHealthMetrics={setHealthMetrics}
        />
      )}
      {activeTab === 'calculator' && (
        <CalculatorSection
          profile={profile}
          healthMetrics={healthMetrics}
          setHealthMetrics={setHealthMetrics}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsSection
          profile={profile}
          setProfile={setProfile}
          email={email}
          setUnauthenticated={setUnauthenticated}
          clearUser={clearUser}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ── Section 1: Profile Overview ──────────────────────────────────────

function OverviewSection({
  profile,
  email,
}: {
  profile: NonNullable<ReturnType<typeof useUserStore.getState>['profile']>;
  email: string | null;
}) {
  const initials = profile.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const age = differenceInYears(new Date(), new Date(profile.birthDate));
  const memberSince = format(new Date(profile.createdAt), 'MMMM d, yyyy');

  const infoItems: { icon: typeof User; label: string; value: string }[] = [
    {
      icon: Mail,
      label: 'Email',
      value: email ?? profile.email,
    },
    {
      icon: Calendar,
      label: 'Age',
      value: `${age} years old`,
    },
    {
      icon: User,
      label: 'Gender',
      value: profile.gender === 'male' ? 'Male' : 'Female',
    },
    {
      icon: Ruler,
      label: 'Height',
      value: formatHeight(profile.heightCm, profile.unitSystem),
    },
    {
      icon: Weight,
      label: 'Weight',
      value: formatWeight(profile.weightKg, profile.unitSystem),
    },
    {
      icon: Activity,
      label: 'Activity Level',
      value: ACTIVITY_LABELS[profile.activityLevel],
    },
    {
      icon: Target,
      label: 'Fitness Goal',
      value: GOAL_LABELS[profile.goal],
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: memberSince,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Avatar and Name */}
      <Card className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-500">
          <span className="text-3xl font-bold text-white">{initials}</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            {profile.displayName}
          </h2>
          <p className="text-sm text-dark-300">{email ?? profile.email}</p>
        </div>
      </Card>

      {/* Info Grid */}
      <Card className="divide-y divide-dark-800">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 px-2 py-3.5 first:pt-1 last:pb-1"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-800">
              <item.icon className="h-5 w-5 text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                {item.label}
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Section 2: Edit Profile ──────────────────────────────────────────

function EditSection({
  profile,
  setProfile,
  setHealthMetrics,
}: {
  profile: NonNullable<ReturnType<typeof useUserStore.getState>['profile']>;
  setProfile: (p: typeof profile) => void;
  setHealthMetrics: (m: ReturnType<typeof calculateHealthMetrics>) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile.activityLevel,
  );
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleSave() {
    // Basic validation
    if (!displayName.trim()) {
      setError('Name is required.');
      return;
    }
    if (!birthDate) {
      setError('Birth date is required.');
      return;
    }
    if (heightCm < 50 || heightCm > 300) {
      setError('Height must be between 50 and 300 cm.');
      return;
    }
    if (weightKg < 20 || weightKg > 500) {
      setError('Weight must be between 20 and 500 kg.');
      return;
    }

    setError('');

    const updatedProfile = {
      ...profile,
      displayName: displayName.trim(),
      gender,
      birthDate,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      updatedAt: new Date().toISOString(),
    };

    setProfile(updatedProfile);

    const metrics = calculateHealthMetrics({
      weightKg: updatedProfile.weightKg,
      heightCm: updatedProfile.heightCm,
      birthDate: updatedProfile.birthDate,
      gender: updatedProfile.gender,
      activityLevel: updatedProfile.activityLevel,
      goal: updatedProfile.goal,
    });
    setHealthMetrics(metrics);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const activityOptions: { value: ActivityLevel; label: string }[] = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'light', label: 'Lightly Active' },
    { value: 'moderate', label: 'Moderately Active' },
    { value: 'active', label: 'Active' },
    { value: 'very_active', label: 'Very Active' },
  ];

  const goalOptions: { value: FitnessGoal; label: string }[] = [
    { value: 'lose', label: 'Lose' },
    { value: 'maintain', label: 'Maintain' },
    { value: 'gain', label: 'Gain' },
  ];

  return (
    <div className="space-y-6">
      {/* Name */}
      <Card className="space-y-5 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
          Personal Information
        </h3>

        <Input
          label="Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
        />

        {/* Gender Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-dark-300">Gender</label>
          <div className="flex overflow-hidden rounded-xl bg-dark-800">
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
                  gender === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Birth Date */}
        <Input
          label="Birth Date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </Card>

      {/* Body Measurements */}
      <Card className="space-y-5 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
          Body Measurements
        </h3>

        <Input
          label="Height (cm)"
          type="number"
          value={heightCm || ''}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          min={50}
          max={300}
        />

        <Input
          label="Weight (kg)"
          type="number"
          value={weightKg || ''}
          onChange={(e) => setWeightKg(Number(e.target.value))}
          min={20}
          max={500}
          step={0.1}
        />
      </Card>

      {/* Activity Level */}
      <Card className="space-y-5 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
          Activity Level
        </h3>

        <div className="flex flex-col gap-2">
          {activityOptions.map((opt) => {
            const selected = activityLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActivityLevel(opt.value)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  selected
                    ? 'bg-primary-500/15 ring-2 ring-primary-500'
                    : 'bg-dark-800 hover:bg-dark-700'
                }`}
              >
                <div
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    selected ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      selected ? 'text-primary-400' : 'text-white'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-dark-400">
                    {ACTIVITY_DESCRIPTIONS[opt.value]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Fitness Goal */}
      <Card className="space-y-5 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
          Fitness Goal
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {goalOptions.map((opt) => {
            const selected = goal === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoal(opt.value)}
                className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} fullWidth size="lg">
        {saved ? (
          <>
            <Check className="h-5 w-5" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
}

// ── Section 3: Health Calculator ─────────────────────────────────────

function CalculatorSection({
  profile,
  healthMetrics,
  setHealthMetrics,
}: {
  profile: NonNullable<ReturnType<typeof useUserStore.getState>['profile']>;
  healthMetrics: ReturnType<typeof useUserStore.getState>['healthMetrics'];
  setHealthMetrics: (m: ReturnType<typeof calculateHealthMetrics>) => void;
}) {
  const [recalculated, setRecalculated] = useState(false);

  function handleRecalculate() {
    const metrics = calculateHealthMetrics({
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      birthDate: profile.birthDate,
      gender: profile.gender,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    });
    setHealthMetrics(metrics);
    setRecalculated(true);
    setTimeout(() => setRecalculated(false), 2000);
  }

  if (!healthMetrics) {
    return (
      <div className="space-y-6">
        <Card className="flex flex-col items-center gap-4 py-10">
          <Calculator className="h-12 w-12 text-dark-500" />
          <p className="text-dark-300">
            No health metrics calculated yet.
          </p>
          <Button onClick={handleRecalculate}>
            <Calculator className="h-5 w-5" />
            Calculate Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BMI Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
              <Scale className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                BMI
              </p>
              <p className="text-2xl font-bold text-white">
                {healthMetrics.bmi.toFixed(1)}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              BMI_COLORS[healthMetrics.bmiCategory]
            } text-white`}
          >
            {getBMILabel(healthMetrics.bmiCategory)}
          </span>
        </div>
      </Card>

      {/* Calorie Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* BMR */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                BMR
              </p>
              <p className="text-xl font-bold text-white">
                {Math.round(healthMetrics.bmr)}{' '}
                <span className="text-sm font-normal text-dark-300">
                  kcal/day
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-dark-400">
            Basal Metabolic Rate - calories burned at rest
          </p>
        </Card>

        {/* TDEE */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                TDEE
              </p>
              <p className="text-xl font-bold text-white">
                {Math.round(healthMetrics.tdee)}{' '}
                <span className="text-sm font-normal text-dark-300">
                  kcal/day
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-dark-400">
            Total Daily Energy Expenditure
          </p>
        </Card>

        {/* Target Calories */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
              <Target className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                Target Calories
              </p>
              <p className="text-xl font-bold text-white">
                {Math.round(healthMetrics.targetCalories)}{' '}
                <span className="text-sm font-normal text-dark-300">
                  kcal/day
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-dark-400">
            Goal: {GOAL_LABELS[profile.goal]}
          </p>
        </Card>

        {/* Recommended Diet */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
              <Flame className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                Recommended Diet
              </p>
              <p className="text-xl font-bold text-white">
                {DIET_LABELS[healthMetrics.recommendedDiet]}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-dark-400">
            Based on your BMI and fitness goal
          </p>
        </Card>
      </div>

      {/* Macro Targets */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-300">
          Daily Macro Targets
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-dark-800 py-4">
            <Beef className="h-6 w-6 text-primary-400" />
            <span className="text-2xl font-bold text-white">
              {healthMetrics.macros.protein}g
            </span>
            <span className="text-xs text-dark-300">Protein</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-dark-800 py-4">
            <Wheat className="h-6 w-6 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {healthMetrics.macros.carbs}g
            </span>
            <span className="text-xs text-dark-300">Carbs</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-dark-800 py-4">
            <Droplets className="h-6 w-6 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              {healthMetrics.macros.fat}g
            </span>
            <span className="text-xs text-dark-300">Fat</span>
          </div>
        </div>
      </Card>

      {/* Recalculate Button */}
      <Button
        onClick={handleRecalculate}
        variant="secondary"
        fullWidth
        size="lg"
      >
        {recalculated ? (
          <>
            <Check className="h-5 w-5" />
            Recalculated!
          </>
        ) : (
          <>
            <RefreshCw className="h-5 w-5" />
            Recalculate
          </>
        )}
      </Button>
    </div>
  );
}

// ── Section 4: Settings ──────────────────────────────────────────────

function SettingsSection({
  profile,
  setProfile,
  email,
  setUnauthenticated,
  clearUser,
  navigate,
}: {
  profile: NonNullable<ReturnType<typeof useUserStore.getState>['profile']>;
  setProfile: (p: typeof profile) => void;
  email: string | null;
  setUnauthenticated: () => void;
  clearUser: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleUnitToggle(unit: UnitSystem) {
    if (unit === profile.unitSystem) return;
    setProfile({
      ...profile,
      unitSystem: unit,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleLogout() {
    setUnauthenticated();
    navigate('/login');
  }

  function handleDeleteAccount() {
    clearUser();
    setUnauthenticated();
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="space-y-6">
      {/* Preferences */}
      <Card className="space-y-5 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
          Preferences
        </h3>

        {/* Unit System */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Unit System</p>
            <p className="text-xs text-dark-400">
              Choose between metric and imperial units
            </p>
          </div>
          <div className="flex overflow-hidden rounded-lg bg-dark-800">
            <button
              type="button"
              onClick={() => handleUnitToggle('metric')}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                profile.unitSystem === 'metric'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('imperial')}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                profile.unitSystem === 'imperial'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>

        {/* Dark Mode (always on) */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Dark Mode</p>
            <p className="text-xs text-dark-400">Always-on dark theme</p>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary-400" />
            <div className="relative h-6 w-11 rounded-full bg-primary-500">
              <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
            </div>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card className="space-y-5 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
          Account
        </h3>

        {/* Email Display */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-800">
            <Mail className="h-5 w-5 text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              Email
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {email ?? profile.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="secondary"
          fullWidth
          size="md"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>

        {/* Delete Account */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="h-5 w-5" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border-2 border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-semibold text-red-400">
                Are you sure?
              </p>
            </div>
            <p className="text-xs text-dark-300">
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-dark-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
