import { useState, useMemo } from 'react';
import { Flame, Heart, ChevronDown, ChevronUp } from 'lucide-react';

import { Card } from '@/components/ui';
import {
  CARDIO_ACTIVITIES,
  getCardioSuggestions,
  caloriesPerMinuteHR,
  caloriesPerMinuteMET,
  getMotivationalTip,
} from '@/lib/cardio-calculator';
import type { CardioActivity, CardioActivityInfo } from '@/lib/cardio-calculator';

// ── Helpers ───────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}min`;
}

function getHeartRateZone(activity: CardioActivityInfo): string {
  const low = Math.round(activity.avgHeartRate * 0.85);
  const high = Math.round(activity.avgHeartRate * 1.15);
  return `${low} - ${high} BPM`;
}

// ── Props ─────────────────────────────────────────────────────────

interface CardioSuggestionsProps {
  caloriesToBurn: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female';
}

// ── Component ─────────────────────────────────────────────────────

export default function CardioSuggestions({
  caloriesToBurn,
  weightKg,
  age,
  gender,
}: CardioSuggestionsProps) {
  const [heartRate, setHeartRate] = useState<number | undefined>(undefined);
  const [expandedActivity, setExpandedActivity] = useState<CardioActivity | null>(null);

  const suggestions = useMemo(
    () => getCardioSuggestions(caloriesToBurn, weightKg, age, gender, heartRate),
    [caloriesToBurn, weightKg, age, gender, heartRate],
  );

  const handleCardClick = (activityId: CardioActivity) => {
    setExpandedActivity((prev) => (prev === activityId ? null : activityId));
  };

  const handleHeartRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setHeartRate(undefined);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0 && num <= 250) {
        setHeartRate(num);
      }
    }
  };

  return (
    <div className="animate-fade-in-up">
      <Card className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Burn Calories With Cardio
              </h2>
              <p className="text-sm text-dark-300">
                Choose an activity to hit your calorie goal
              </p>
            </div>
          </div>
        </div>

        {/* Target calories display */}
        <div className="flex items-center justify-between rounded-xl bg-dark-800 px-4 py-3">
          <span className="text-sm font-medium text-dark-300">Target to burn</span>
          <span className="text-2xl font-bold text-primary-400">
            {Math.round(caloriesToBurn)}{' '}
            <span className="text-sm font-normal text-dark-400">kcal</span>
          </span>
        </div>

        {/* Heart rate input */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <Heart className="h-4 w-4 text-red-400" />
          </div>
          <input
            type="number"
            placeholder="Enter heart rate (BPM)"
            min={40}
            max={250}
            value={heartRate ?? ''}
            onChange={handleHeartRateChange}
            className="h-10 w-full rounded-xl border-2 border-dark-700 bg-dark-800 px-3 text-sm text-white placeholder:text-dark-500 transition-colors focus:border-primary-400 focus:outline-none"
          />
          {heartRate && (
            <span className="shrink-0 text-xs text-primary-400 font-medium">
              HR mode
            </span>
          )}
        </div>

        {/* Activity cards grid */}
        <div className="stagger-children grid gap-3 sm:grid-cols-2">
          {suggestions.map(({ activity, durationMinutes, caloriesBurned }) => {
            const isExpanded = expandedActivity === activity.id;

            // Calculate cal/min for expanded view
            const calPerMin = heartRate
              ? caloriesPerMinuteHR(heartRate, weightKg, age, gender)
              : caloriesPerMinuteMET(activity.metValue, weightKg);

            return (
              <div
                key={activity.id}
                className={`
                  cursor-pointer rounded-2xl border bg-dark-800 p-4 transition-all duration-200
                  hover:bg-dark-700 hover:border-primary-500/40
                  ${isExpanded ? 'border-primary-500/50 ring-1 ring-primary-500/20' : 'border-dark-700'}
                `}
                onClick={() => handleCardClick(activity.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(activity.id);
                  }
                }}
              >
                {/* Card content */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{activity.emoji}</span>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {activity.name}
                      </h3>
                      <p className="text-xs text-dark-400">{activity.description}</p>
                    </div>
                  </div>
                  <div className="mt-1 text-dark-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="mt-3">
                  <span className="text-2xl font-bold text-primary-400">
                    {formatDuration(durationMinutes)}
                  </span>
                  <p className="mt-0.5 text-xs text-dark-400">
                    to burn {caloriesBurned} kcal
                  </p>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-dark-700 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Calories / min</span>
                      <span className="font-semibold text-white">
                        {calPerMin.toFixed(1)} kcal
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Heart rate zone</span>
                      <span className="font-semibold text-red-400">
                        {getHeartRateZone(activity)}
                      </span>
                    </div>
                    <div className="mt-1 rounded-lg bg-primary-500/10 px-3 py-2">
                      <p className="text-xs leading-relaxed text-primary-300">
                        {getMotivationalTip(activity.id)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
