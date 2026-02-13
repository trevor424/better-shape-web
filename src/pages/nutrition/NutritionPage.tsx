import { useState, useMemo, useCallback } from 'react';
import { format, addDays, subDays, parseISO, differenceInYears } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Search,
  X,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

import { Button, Card, Input, ProgressRing, MacroBar } from '@/components/ui';
import { useNutritionStore } from '@/stores/nutrition-store';
import { useUserStore } from '@/stores/user-store';
import { foods } from '@/data/foods';
import type { FoodItem, MealType, DietType } from '@/types';
import { minutesToBurnCalories, CARDIO_ACTIVITIES } from '@/lib/cardio-calculator';

// ── Constants ────────────────────────────────────────────────────────

type TabId = 'daily-log' | 'browse-foods' | 'meal-plan';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'daily-log', label: 'Daily Log', icon: <CalendarDays size={16} /> },
  { id: 'browse-foods', label: 'Browse Foods', icon: <Search size={16} /> },
  { id: 'meal-plan', label: 'Meal Plan', icon: <Sparkles size={16} /> },
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '\u2600\uFE0F',
  lunch: '\uD83C\uDF5D',
  dinner: '\uD83C\uDF19',
  snack: '\uD83C\uDF4E',
};

const DIET_LABELS: Record<DietType, string> = {
  balanced: 'Balanced',
  low_carb: 'Low Carb',
  high_protein: 'High Protein',
  keto: 'Keto',
};

const FOOD_CATEGORY_EMOJIS: Record<string, string> = {
  'Eggs & Dairy': '\uD83E\uDD5A',
  Grains: '\uD83C\uDF3E',
  Dairy: '\uD83E\uDDC0',
  Fruits: '\uD83C\uDF53',
  Meat: '\uD83E\uDD69',
  Beverages: '\uD83E\uDD64',
  Mixed: '\uD83C\uDF71',
  Seafood: '\uD83D\uDC1F',
  Salads: '\uD83E\uDD57',
  Soups: '\uD83C\uDF72',
  Vegetables: '\uD83E\uDD66',
  'Plant Protein': '\uD83C\uDF31',
  'Nuts & Seeds': '\uD83E\uDD5C',
  Supplements: '\uD83D\uDCAA',
  Sweets: '\uD83C\uDF6B',
};

function getCategoryEmoji(category: string): string {
  return FOOD_CATEGORY_EMOJIS[category] ?? '\uD83C\uDF7D\uFE0F';
}

// ── Default targets (fallback when no healthMetrics) ─────────────────

const DEFAULT_CALORIES = 2000;
const DEFAULT_MACROS = { protein: 150, carbs: 200, fat: 65 };

// ── Calorie allocation per meal type ────────────────────────────────

const MEAL_CALORIE_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

// ── Main Component ──────────────────────────────────────────────────

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('daily-log');
  const [foodBrowserMealType, setFoodBrowserMealType] = useState<MealType | null>(null);

  const handleAddFoodForMeal = useCallback((mealType: MealType) => {
    setFoodBrowserMealType(mealType);
    setActiveTab('browse-foods');
  }, []);

  const handleBackToLog = useCallback(() => {
    setActiveTab('daily-log');
    setFoodBrowserMealType(null);
  }, []);

  return (
    <div className="min-h-full pb-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nutrition</h1>
        <p className="text-sm text-dark-300 mt-1">Track your meals and hit your macros</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors
              ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'daily-log' && (
        <DailyLogTab onAddFood={handleAddFoodForMeal} />
      )}
      {activeTab === 'browse-foods' && (
        <FoodBrowserTab
          presetMealType={foodBrowserMealType}
          onBackToLog={handleBackToLog}
        />
      )}
      {activeTab === 'meal-plan' && <MealPlanTab />}
    </div>
  );
}

// ── Tab 1: Daily Log ────────────────────────────────────────────────

function DailyLogTab({ onAddFood }: { onAddFood: (mealType: MealType) => void }) {
  const selectedDate = useNutritionStore((s) => s.selectedDate);
  const setSelectedDate = useNutritionStore((s) => s.setSelectedDate);
  const dailyLogs = useNutritionStore((s) => s.dailyLogs);
  const getDailySummary = useNutritionStore((s) => s.getDailySummary);
  const removeMealLog = useNutritionStore((s) => s.removeMealLog);
  const healthMetrics = useUserStore((s) => s.healthMetrics);
  const profile = useUserStore((s) => s.profile);

  const targetCalories = healthMetrics?.targetCalories ?? DEFAULT_CALORIES;
  const macroTargets = healthMetrics?.macros ?? DEFAULT_MACROS;

  const summary = getDailySummary(selectedDate);
  const entries = dailyLogs[selectedDate] ?? [];

  const calorieProgress = targetCalories > 0 ? summary.calories / targetCalories : 0;
  const remainingCalories = Math.max(0, Math.round(targetCalories - summary.calories));

  // Cardio suggestion data
  const walkingActivity = CARDIO_ACTIVITIES.find((a) => a.id === 'walking')!;
  const runningActivity = CARDIO_ACTIVITIES.find((a) => a.id === 'running')!;
  const userWeight = profile?.weightKg ?? 70;
  const userAge = profile?.birthDate
    ? differenceInYears(new Date(), new Date(profile.birthDate))
    : 25;
  const userGender = profile?.gender ?? 'male';

  const walkMinutes = remainingCalories > 0
    ? minutesToBurnCalories(remainingCalories, walkingActivity, userWeight, userAge, userGender)
    : 0;
  const runMinutes = remainingCalories > 0
    ? minutesToBurnCalories(remainingCalories, runningActivity, userWeight, userAge, userGender)
    : 0;

  const dateObj = parseISO(selectedDate);
  const formattedDate = format(dateObj, 'EEE, MMM d');

  const goToPrevDay = () => setSelectedDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'));
  const goToNextDay = () => setSelectedDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'));

  return (
    <div className="flex flex-col gap-6">
      {/* Date selector */}
      <Card className="flex items-center justify-between">
        <button
          onClick={goToPrevDay}
          className="rounded-lg p-2 text-dark-300 transition-colors hover:bg-dark-800 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-semibold text-white">{formattedDate}</span>
        <button
          onClick={goToNextDay}
          className="rounded-lg p-2 text-dark-300 transition-colors hover:bg-dark-800 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </Card>

      {/* Calorie summary + macros */}
      <Card className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-6">
          <ProgressRing progress={calorieProgress} size={120} strokeWidth={8}>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">
                {Math.round(summary.calories)}
              </span>
              <span className="text-xs text-dark-400">/ {targetCalories} kcal</span>
            </div>
          </ProgressRing>

          <div className="flex flex-col gap-1 text-sm">
            <div className="text-dark-300">
              Remaining:{' '}
              <span className="font-semibold text-white">
                {Math.max(0, targetCalories - Math.round(summary.calories))} kcal
              </span>
            </div>
            <div className="text-dark-300">
              Consumed:{' '}
              <span className="font-semibold text-primary-400">
                {Math.round(summary.calories)} kcal
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <MacroBar
            label="Protein"
            current={Math.round(summary.protein)}
            target={macroTargets.protein}
            color="var(--color-primary-400)"
          />
          <MacroBar
            label="Carbs"
            current={Math.round(summary.carbs)}
            target={macroTargets.carbs}
            color="#60a5fa"
          />
          <MacroBar
            label="Fat"
            current={Math.round(summary.fat)}
            target={macroTargets.fat}
            color="#fbbf24"
          />
        </div>
      </Card>

      {/* Compact cardio suggestion */}
      {remainingCalories > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-dark-800 bg-dark-900 px-4 py-3">
          <span className="text-lg">{'\u{1F525}'}</span>
          <p className="text-sm text-dark-300">
            <span className="font-medium text-white">Walk for {walkMinutes} min</span>
            {' or '}
            <span className="font-medium text-white">Run for {runMinutes} min</span>
            {' to burn remaining '}
            <span className="font-semibold text-primary-400">{remainingCalories} kcal</span>
          </p>
        </div>
      )}

      {/* Meal sections */}
      {MEAL_TYPES.map((mealType) => {
        const mealEntries = entries.filter((e) => e.mealType === mealType);
        const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

        return (
          <Card key={mealType} className="flex flex-col gap-3">
            {/* Meal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{MEAL_EMOJIS[mealType]}</span>
                <h3 className="text-base font-semibold text-white">
                  {MEAL_LABELS[mealType]}
                </h3>
                {mealCalories > 0 && (
                  <span className="text-sm text-dark-400">
                    {Math.round(mealCalories)} kcal
                  </span>
                )}
              </div>
              <button
                onClick={() => onAddFood(mealType)}
                className="flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 py-1.5 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-500/20"
              >
                <Plus size={14} />
                Add Food
              </button>
            </div>

            {/* Logged items */}
            {mealEntries.length === 0 ? (
              <p className="text-sm text-dark-500 italic">No foods logged yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {mealEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl bg-dark-800 px-3 py-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {entry.foodName}
                      </span>
                      <span className="text-xs text-dark-400">
                        {entry.servings} serving{entry.servings !== 1 ? 's' : ''} &middot;{' '}
                        {Math.round(entry.calories)} kcal
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 text-xs text-dark-400">
                        <span>P {Math.round(entry.protein)}g</span>
                        <span>C {Math.round(entry.carbs)}g</span>
                        <span>F {Math.round(entry.fat)}g</span>
                      </div>
                      <button
                        onClick={() => removeMealLog(selectedDate, entry.id)}
                        className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Tab 2: Food Browser ─────────────────────────────────────────────

function FoodBrowserTab({
  presetMealType,
  onBackToLog,
}: {
  presetMealType: MealType | null;
  onBackToLog: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  const [dietFilter, setDietFilter] = useState<DietType | 'all'>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [addMealType, setAddMealType] = useState<MealType>(presetMealType ?? 'breakfast');

  const selectedDate = useNutritionStore((s) => s.selectedDate);
  const addMealLog = useNutritionStore((s) => s.addMealLog);

  const filteredFoods = useMemo(() => {
    let result = foods;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(query));
    }

    // Meal type filter
    if (mealFilter !== 'all') {
      result = result.filter((f) => f.mealTypes.includes(mealFilter));
    }

    // Diet type filter
    if (dietFilter !== 'all') {
      result = result.filter((f) => f.dietTypes.includes(dietFilter));
    }

    return result;
  }, [searchQuery, mealFilter, dietFilter]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setServings(1);
    setAddMealType(presetMealType ?? 'breakfast');
  };

  const handleAddToLog = () => {
    if (!selectedFood) return;

    addMealLog({
      id: crypto.randomUUID(),
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      mealType: addMealType,
      servings,
      calories: Math.round(selectedFood.calories * servings),
      protein: Math.round(selectedFood.protein * servings * 10) / 10,
      carbs: Math.round(selectedFood.carbs * servings * 10) / 10,
      fat: Math.round(selectedFood.fat * servings * 10) / 10,
      date: selectedDate,
    });

    setSelectedFood(null);
    onBackToLog();
  };

  const handleCloseModal = () => {
    setSelectedFood(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
        />
        <input
          type="text"
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-xl border-2 border-dark-700 bg-dark-800 pl-11 pr-4 text-white placeholder:text-dark-400 transition-colors focus:border-primary-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-dark-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Meal type filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          active={mealFilter === 'all'}
          onClick={() => setMealFilter('all')}
        />
        {MEAL_TYPES.map((mt) => (
          <FilterChip
            key={mt}
            label={MEAL_LABELS[mt]}
            active={mealFilter === mt}
            onClick={() => setMealFilter(mt)}
          />
        ))}
      </div>

      {/* Diet type filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All Diets"
          active={dietFilter === 'all'}
          onClick={() => setDietFilter('all')}
        />
        {(Object.keys(DIET_LABELS) as DietType[]).map((dt) => (
          <FilterChip
            key={dt}
            label={DIET_LABELS[dt]}
            active={dietFilter === dt}
            onClick={() => setDietFilter(dt)}
          />
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-dark-400">
        {filteredFoods.length} food{filteredFoods.length !== 1 ? 's' : ''} found
      </p>

      {/* Food grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredFoods.map((food) => (
          <Card
            key={food.id}
            onClick={() => handleSelectFood(food)}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="text-2xl">{getCategoryEmoji(food.category)}</span>
            <h4 className="text-sm font-semibold text-white leading-tight">
              {food.name}
            </h4>
            <span className="text-lg font-bold text-primary-400">
              {food.calories}
              <span className="text-xs font-normal text-dark-400"> kcal</span>
            </span>
            <div className="flex gap-2 text-[11px] text-dark-400">
              <span>P {food.protein}g</span>
              <span>C {food.carbs}g</span>
              <span>F {food.fat}g</span>
            </div>
          </Card>
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-dark-400">
          <UtensilsCrossed size={40} />
          <p className="text-sm">No foods match your filters</p>
        </div>
      )}

      {/* Add-to-log modal overlay */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-dark-900 p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add to Log</h3>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Food info */}
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-dark-800 p-3">
              <span className="text-3xl">{getCategoryEmoji(selectedFood.category)}</span>
              <div>
                <h4 className="font-semibold text-white">{selectedFood.name}</h4>
                <p className="text-sm text-dark-400">
                  {selectedFood.servingSize} {selectedFood.servingUnit} per serving
                </p>
              </div>
            </div>

            {/* Macros per serving */}
            <div className="mb-5 grid grid-cols-4 gap-3 text-center">
              <MacroCard label="Calories" value={selectedFood.calories} unit="kcal" color="text-primary-400" />
              <MacroCard label="Protein" value={selectedFood.protein} unit="g" color="text-primary-300" />
              <MacroCard label="Carbs" value={selectedFood.carbs} unit="g" color="text-blue-400" />
              <MacroCard label="Fat" value={selectedFood.fat} unit="g" color="text-yellow-400" />
            </div>

            {/* Servings input */}
            <div className="mb-4">
              <Input
                label="Servings"
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={servings}
                onChange={(e) => setServings(Math.max(0.5, Number(e.target.value) || 0.5))}
              />
            </div>

            {/* Meal type selector */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm text-dark-300">Meal</label>
              <div className="flex gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt}
                    onClick={() => setAddMealType(mt)}
                    className={`
                      flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors
                      ${
                        addMealType === mt
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                      }
                    `}
                  >
                    {MEAL_LABELS[mt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated totals */}
            <div className="mb-5 rounded-xl bg-dark-800 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-dark-400">
                Total for {servings} serving{servings !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <span className="font-bold text-primary-400">
                    {Math.round(selectedFood.calories * servings)}
                  </span>
                  <span className="block text-[11px] text-dark-400">kcal</span>
                </div>
                <div>
                  <span className="font-bold text-primary-300">
                    {Math.round(selectedFood.protein * servings * 10) / 10}
                  </span>
                  <span className="block text-[11px] text-dark-400">g protein</span>
                </div>
                <div>
                  <span className="font-bold text-blue-400">
                    {Math.round(selectedFood.carbs * servings * 10) / 10}
                  </span>
                  <span className="block text-[11px] text-dark-400">g carbs</span>
                </div>
                <div>
                  <span className="font-bold text-yellow-400">
                    {Math.round(selectedFood.fat * servings * 10) / 10}
                  </span>
                  <span className="block text-[11px] text-dark-400">g fat</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCloseModal} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleAddToLog} fullWidth>
                Add to Log
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Meal Plan ────────────────────────────────────────────────

interface MealPlanItem {
  food: FoodItem;
  servings: number;
  mealType: MealType;
}

function generateMealPlan(
  targetCalories: number,
  dietType: DietType,
): MealPlanItem[] {
  const plan: MealPlanItem[] = [];

  for (const mealType of MEAL_TYPES) {
    const mealBudget = targetCalories * MEAL_CALORIE_RATIOS[mealType];

    // Find foods matching both diet type and meal type
    const candidates = foods.filter(
      (f) => f.dietTypes.includes(dietType) && f.mealTypes.includes(mealType),
    );

    if (candidates.length === 0) continue;

    let remaining = mealBudget;
    const used = new Set<string>();

    // Pick up to 2 items for each meal
    for (let pick = 0; pick < 2 && remaining > 50; pick++) {
      const available = candidates.filter((c) => !used.has(c.id) && c.calories <= remaining + 50);
      if (available.length === 0) break;

      // Pick a pseudo-random item using date-based seed for variety
      const dayOfYear = Math.floor(
        (Date.now() / 86400000) % available.length,
      );
      const idx = (dayOfYear + pick * 7 + MEAL_TYPES.indexOf(mealType) * 3) % available.length;
      const food = available[idx];

      // Calculate servings to get close to remaining budget (but not exceed too much)
      let servings = Math.round((remaining / food.calories) * 2) / 2; // round to nearest 0.5
      servings = Math.max(0.5, Math.min(servings, 2)); // clamp between 0.5 and 2

      // If this is the first pick, use ~60% of the budget; if second, use the rest
      if (pick === 0 && candidates.length > 1) {
        const targetCals = remaining * 0.6;
        servings = Math.round((targetCals / food.calories) * 2) / 2;
        servings = Math.max(0.5, Math.min(servings, 2));
      }

      plan.push({ food, servings, mealType });
      used.add(food.id);
      remaining -= food.calories * servings;
    }
  }

  return plan;
}

const DIET_DESCRIPTIONS: Record<DietType, { emoji: string; tagline: string; macros: string; details: string }> = {
  balanced: {
    emoji: '\u2696\uFE0F',
    tagline: 'A well-rounded approach for overall health',
    macros: '45% Carbs \u2022 30% Protein \u2022 25% Fat',
    details: 'Includes a mix of all food groups. Great for general fitness and sustainable long-term eating.',
  },
  low_carb: {
    emoji: '\uD83E\uDD57',
    tagline: 'Reduced carbs for steady energy and fat loss',
    macros: '20% Carbs \u2022 35% Protein \u2022 45% Fat',
    details: 'Emphasizes proteins, healthy fats, and vegetables. Helps reduce insulin spikes and promotes fat burning.',
  },
  high_protein: {
    emoji: '\uD83D\uDCAA',
    tagline: 'Maximize muscle growth and recovery',
    macros: '35% Carbs \u2022 40% Protein \u2022 25% Fat',
    details: 'High protein intake supports muscle repair and growth. Ideal for active individuals and strength training.',
  },
  keto: {
    emoji: '\uD83E\uDD51',
    tagline: 'Very low carb, high fat for ketosis',
    macros: '5% Carbs \u2022 25% Protein \u2022 70% Fat',
    details: 'Puts your body into ketosis for efficient fat burning. Focuses on fats, moderate protein, and minimal carbs.',
  },
};

function MealPlanTab() {
  const healthMetrics = useUserStore((s) => s.healthMetrics);
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const selectedDate = useNutritionStore((s) => s.selectedDate);
  const addMealLog = useNutritionStore((s) => s.addMealLog);

  const recommendedDiet = healthMetrics?.recommendedDiet ?? 'balanced';
  const [selectedDiet, setSelectedDiet] = useState<DietType>(
    profile?.preferredDiet ?? recommendedDiet,
  );

  const targetCalories = healthMetrics?.targetCalories ?? DEFAULT_CALORIES;
  const dietType = selectedDiet;

  function handleDietSelect(diet: DietType) {
    setSelectedDiet(diet);
    updateProfile({ preferredDiet: diet });
  }

  const mealPlan = useMemo(
    () => generateMealPlan(targetCalories, dietType),
    [targetCalories, dietType],
  );

  const planTotals = useMemo(() => {
    return mealPlan.reduce(
      (acc, item) => ({
        calories: acc.calories + item.food.calories * item.servings,
        protein: acc.protein + item.food.protein * item.servings,
        carbs: acc.carbs + item.food.carbs * item.servings,
        fat: acc.fat + item.food.fat * item.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [mealPlan]);

  const handleLogPlan = () => {
    for (const item of mealPlan) {
      addMealLog({
        id: crypto.randomUUID(),
        foodId: item.food.id,
        foodName: item.food.name,
        mealType: item.mealType,
        servings: item.servings,
        calories: Math.round(item.food.calories * item.servings),
        protein: Math.round(item.food.protein * item.servings * 10) / 10,
        carbs: Math.round(item.food.carbs * item.servings * 10) / 10,
        fat: Math.round(item.food.fat * item.servings * 10) / 10,
        date: selectedDate,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Diet Type Selector */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary-400" />
            <h2 className="text-lg font-bold text-white">Choose Your Diet</h2>
          </div>
          {selectedDiet !== recommendedDiet && (
            <button
              onClick={() => handleDietSelect(recommendedDiet)}
              className="text-xs font-medium text-primary-400 transition-colors hover:text-primary-300"
            >
              Use Recommended
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(DIET_DESCRIPTIONS) as DietType[]).map((diet) => {
            const info = DIET_DESCRIPTIONS[diet];
            const isSelected = selectedDiet === diet;
            const isRecommended = recommendedDiet === diet;

            return (
              <button
                key={diet}
                onClick={() => handleDietSelect(diet)}
                className={`relative flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary-500/15 ring-2 ring-primary-500'
                    : 'bg-dark-800 hover:bg-dark-700'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2 right-2 rounded-full bg-primary-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    Rec
                  </span>
                )}
                <span className="text-3xl">{info.emoji}</span>
                <span className={`text-sm font-bold ${isSelected ? 'text-primary-400' : 'text-white'}`}>
                  {DIET_LABELS[diet]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected diet details */}
        <div className="animate-fade-in rounded-xl bg-dark-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{DIET_DESCRIPTIONS[selectedDiet].emoji}</span>
            <div>
              <h3 className="font-bold text-white">{DIET_LABELS[selectedDiet]} Diet</h3>
              <p className="text-xs text-primary-400">{DIET_DESCRIPTIONS[selectedDiet].macros}</p>
            </div>
          </div>
          <p className="text-sm text-dark-300">{DIET_DESCRIPTIONS[selectedDiet].tagline}</p>
          <p className="mt-2 text-xs text-dark-400">{DIET_DESCRIPTIONS[selectedDiet].details}</p>
        </div>
      </Card>

      {/* Plan header */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-primary-400" />
          <h2 className="text-lg font-bold text-white">Today's Meal Plan</h2>
        </div>
        <p className="text-sm text-dark-300">
          Auto-generated based on your{' '}
          <span className="font-semibold text-primary-400">{DIET_LABELS[dietType]}</span>{' '}
          diet and{' '}
          <span className="font-semibold text-primary-400">{targetCalories} kcal</span>{' '}
          daily target.
        </p>

        {/* Plan totals */}
        <div className="grid grid-cols-4 gap-3 rounded-xl bg-dark-800 p-3 text-center">
          <div>
            <span className="text-lg font-bold text-primary-400">
              {Math.round(planTotals.calories)}
            </span>
            <span className="block text-[11px] text-dark-400">kcal</span>
          </div>
          <div>
            <span className="text-lg font-bold text-primary-300">
              {Math.round(planTotals.protein)}
            </span>
            <span className="block text-[11px] text-dark-400">g protein</span>
          </div>
          <div>
            <span className="text-lg font-bold text-blue-400">
              {Math.round(planTotals.carbs)}
            </span>
            <span className="block text-[11px] text-dark-400">g carbs</span>
          </div>
          <div>
            <span className="text-lg font-bold text-yellow-400">
              {Math.round(planTotals.fat)}
            </span>
            <span className="block text-[11px] text-dark-400">g fat</span>
          </div>
        </div>
      </Card>

      {/* Meal sections */}
      {MEAL_TYPES.map((mealType) => {
        const items = mealPlan.filter((i) => i.mealType === mealType);
        if (items.length === 0) return null;

        const mealCals = items.reduce(
          (sum, i) => sum + i.food.calories * i.servings,
          0,
        );

        return (
          <Card key={mealType} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{MEAL_EMOJIS[mealType]}</span>
              <h3 className="font-semibold text-white">{MEAL_LABELS[mealType]}</h3>
              <span className="text-sm text-dark-400">
                {Math.round(mealCals)} kcal
              </span>
            </div>

            {items.map((item, idx) => (
              <div
                key={`${item.food.id}-${idx}`}
                className="flex items-center justify-between rounded-xl bg-dark-800 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {getCategoryEmoji(item.food.category)}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {item.food.name}
                    </h4>
                    <p className="text-xs text-dark-400">
                      {item.servings} serving{item.servings !== 1 ? 's' : ''} &middot;{' '}
                      {item.food.servingSize * item.servings} {item.food.servingUnit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary-400">
                    {Math.round(item.food.calories * item.servings)} kcal
                  </span>
                  <div className="flex gap-1.5 text-[11px] text-dark-400">
                    <span>P {Math.round(item.food.protein * item.servings)}g</span>
                    <span>C {Math.round(item.food.carbs * item.servings)}g</span>
                    <span>F {Math.round(item.food.fat * item.servings)}g</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        );
      })}

      {/* Log this plan button */}
      {mealPlan.length > 0 && (
        <Button onClick={handleLogPlan} fullWidth size="lg">
          <Plus size={18} />
          Log This Plan
        </Button>
      )}

      {mealPlan.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-8">
          <UtensilsCrossed size={40} className="text-dark-500" />
          <p className="text-sm text-dark-400">
            No foods found matching your diet preferences. Try adjusting your diet type
            in your profile settings.
          </p>
        </Card>
      )}
    </div>
  );
}

// ── Shared small components ─────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
        ${
          active
            ? 'bg-primary-500 text-white'
            : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
        }
      `}
    >
      {label}
    </button>
  );
}

function MacroCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-dark-800 p-2">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="block text-[11px] text-dark-400">
        {unit} {label.toLowerCase()}
      </span>
    </div>
  );
}
