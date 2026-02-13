import { useState, useMemo } from 'react';
import { Flame, Heart, ChevronDown, ChevronUp, Timer } from 'lucide-react';

import { Card } from '@/components/ui';
import {
  CARDIO_ACTIVITIES,
  caloriesPerMinuteHR,
  caloriesPerMinuteMET,
  getMotivationalTip,
} from '@/lib/cardio-calculator';
import type { CardioActivity, CardioActivityInfo } from '@/lib/cardio-calculator';

// ── Helpers ───────────────────────────────────────────────────────

function getHeartRateZone(activity: CardioActivityInfo): string {
  const low = Math.round(activity.avgHeartRate * 0.85);
  const high = Math.round(activity.avgHeartRate * 1.15);
  return `${low} - ${high} BPM`;
}

const SESSION_SLOTS = [30, 60, 90, 120]; // 30-min increments

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

  // Calculate cal/min for each activity
  const activityData = useMemo(() => {
    return CARDIO_ACTIVITIES.map((activity) => {
      const calPerMin = heartRate
        ? caloriesPerMinuteHR(heartRate, weightKg, age, gender)
        : caloriesPerMinuteMET(activity.metValue, weightKg);

      const sessions = SESSION_SLOTS.map((minutes) => ({
        minutes,
        caloriesBurned: Math.round(calPerMin * minutes),
      }));

      // Find which 30-min slot covers the target
      const minutesToTarget = caloriesToBurn > 0 ? Math.ceil(caloriesToBurn / calPerMin) : 0;

      return { activity, calPerMin, sessions, minutesToTarget };
    });
  }, [heartRate, weightKg, age, gender, caloriesToBurn]);

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
                Cardio Calorie Burn
              </h2>
              <p className="text-sm text-dark-300">
                Calories burned per 30-min session
              </p>
            </div>
          </div>
        </div>

        {/* Target + Heart rate row */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-dark-800 px-4 py-3">
            <span className="text-sm font-medium text-dark-300">Remaining</span>
            <span className="text-xl font-bold text-primary-400">
              {Math.round(caloriesToBurn)}{' '}
              <span className="text-xs font-normal text-dark-400">kcal</span>
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-dark-800 px-4 py-3">
            <Heart className="h-4 w-4 shrink-0 text-red-400" />
            <input
              type="number"
              placeholder="Heart rate (BPM)"
              min={40}
              max={250}
              value={heartRate ?? ''}
              onChange={handleHeartRateChange}
              className="h-8 w-full bg-transparent text-sm text-white placeholder:text-dark-500 focus:outline-none"
            />
            {heartRate && (
              <span className="shrink-0 rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                HR
              </span>
            )}
          </div>
        </div>

        {/* Activity cards */}
        <div className="stagger-children grid gap-3 sm:grid-cols-2">
          {activityData.map(({ activity, calPerMin, sessions, minutesToTarget }) => {
            const isExpanded = expandedActivity === activity.id;

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
                {/* Card header */}
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

                {/* 30-min session highlight */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary-400">
                    {sessions[0].caloriesBurned}
                  </span>
                  <span className="text-sm text-dark-400">kcal / 30 min</span>
                </div>

                {/* Rate per minute */}
                <p className="mt-1 text-xs text-dark-500">
                  {calPerMin.toFixed(1)} kcal/min
                </p>

                {/* Expanded: session breakdown table */}
                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-dark-700 pt-3 animate-fade-in">
                    {/* Session table */}
                    <div className="space-y-1.5">
                      {sessions.map((session) => {
                        const coversTarget = caloriesToBurn > 0 && session.caloriesBurned >= caloriesToBurn;
                        const isFirstCover = coversTarget && (session.minutes === 30 || sessions.find(s => s.minutes === session.minutes - 30)!.caloriesBurned < caloriesToBurn);

                        return (
                          <div
                            key={session.minutes}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                              isFirstCover
                                ? 'bg-primary-500/15 ring-1 ring-primary-500/30'
                                : 'bg-dark-900/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Timer className="h-3.5 w-3.5 text-dark-400" />
                              <span className="text-sm font-medium text-white">
                                {session.minutes} min
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isFirstCover ? 'text-primary-400' : 'text-white'}`}>
                                {session.caloriesBurned} kcal
                              </span>
                              {isFirstCover && (
                                <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[9px] font-bold text-white">
                                  GOAL
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Time to reach target */}
                    {caloriesToBurn > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-dark-900/50 px-3 py-2">
                        <span className="text-xs text-dark-400">Time to burn {Math.round(caloriesToBurn)} kcal</span>
                        <span className="text-sm font-bold text-primary-400">
                          ~{minutesToTarget} min
                        </span>
                      </div>
                    )}

                    {/* HR zone */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Heart rate zone</span>
                      <span className="font-semibold text-red-400">
                        {getHeartRateZone(activity)}
                      </span>
                    </div>

                    {/* Tip */}
                    <div className="rounded-lg bg-primary-500/10 px-3 py-2">
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
