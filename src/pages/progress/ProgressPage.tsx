import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Hash,
  Trash2,
  Activity,
  Save,
  LineChart,
} from 'lucide-react';

import { useProgressStore } from '@/stores/progress-store';
import { useUserStore } from '@/stores/user-store';
import { calculateHealthMetrics } from '@/lib/calculators';
import { calculateBMI, getBMICategory, getBMILabel } from '@/lib/calculators';
import { Card, Button, Input } from '@/components/ui';

// ── Constants ──────────────────────────────────────────────────────────

const MEASUREMENTS_STORAGE_KEY = 'better-shape-body-measurements';

const BMI_BADGE_COLORS: Record<string, string> = {
  underweight: 'bg-blue-500/20 text-blue-400',
  normal: 'bg-green-500/20 text-green-400',
  overweight: 'bg-yellow-500/20 text-yellow-400',
  obese: 'bg-red-500/20 text-red-400',
};

type BodyMeasurements = {
  chest: string;
  waist: string;
  hips: string;
  arms: string;
  thighs: string;
};

const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  chest: '',
  waist: '',
  hips: '',
  arms: '',
  thighs: '',
};

function loadMeasurements(): BodyMeasurements {
  try {
    const raw = localStorage.getItem(MEASUREMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_MEASUREMENTS;
}

// ── SVG Weight Chart ──────────────────────────────────────────────────

function WeightChart({ entries }: { entries: { date: string; weightKg: number }[] }) {
  const chartWidth = 600;
  const chartHeight = 260;
  const paddingTop = 20;
  const paddingBottom = 40;
  const paddingLeft = 50;
  const paddingRight = 20;

  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  const weights = entries.map((e) => e.weightKg);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const range = rawMax - rawMin || 1;
  const yMin = rawMin - range * 0.1;
  const yMax = rawMax + range * 0.1;

  const points = entries.map((entry, i) => {
    const x = paddingLeft + (entries.length > 1 ? (i / (entries.length - 1)) * plotW : plotW / 2);
    const y = paddingTop + plotH - ((entry.weightKg - yMin) / (yMax - yMin)) * plotH;
    return { x, y, ...entry };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid lines (5 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const fraction = i / 4;
    const y = paddingTop + plotH - fraction * plotH;
    const val = yMin + fraction * (yMax - yMin);
    return { y, label: val.toFixed(1) };
  });

  // X axis labels: show ~5 dates spread across entries
  const xLabels: { x: number; label: string }[] = [];
  const labelCount = Math.min(entries.length, 5);
  for (let i = 0; i < labelCount; i++) {
    const idx =
      labelCount === 1
        ? 0
        : Math.round((i / (labelCount - 1)) * (entries.length - 1));
    const entry = entries[idx];
    const x =
      paddingLeft +
      (entries.length > 1 ? (idx / (entries.length - 1)) * plotW : plotW / 2);
    xLabels.push({ x, label: format(parseISO(entry.date), 'MMM d') });
  }

  // Area fill points
  const areaPoints = [
    `${points[0].x},${paddingTop + plotH}`,
    ...polylinePoints.split(' '),
    `${points[points.length - 1].x},${paddingTop + plotH}`,
  ].join(' ');

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect
        x={paddingLeft}
        y={paddingTop}
        width={plotW}
        height={plotH}
        rx={8}
        className="fill-dark-800"
      />

      {/* Grid lines + Y labels */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={paddingLeft}
            y1={line.y}
            x2={paddingLeft + plotW}
            y2={line.y}
            className="stroke-dark-700"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
          <text
            x={paddingLeft - 8}
            y={line.y + 4}
            textAnchor="end"
            className="fill-dark-400"
            fontSize={10}
          >
            {line.label}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {xLabels.map((lbl, i) => (
        <text
          key={i}
          x={lbl.x}
          y={chartHeight - 8}
          textAnchor="middle"
          className="fill-dark-400"
          fontSize={10}
        >
          {lbl.label}
        </text>
      ))}

      {/* Area fill */}
      <polygon
        points={areaPoints}
        className="fill-primary-500/10"
      />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        className="stroke-primary-500"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            className="fill-primary-400 stroke-dark-800"
            strokeWidth={2}
          />
          {/* Tooltip-like weight label on hover area */}
          <title>
            {format(parseISO(p.date), 'MMM d, yyyy')}: {p.weightKg.toFixed(1)} kg
          </title>
        </g>
      ))}

      {/* Y axis label */}
      <text
        x={12}
        y={paddingTop + plotH / 2}
        textAnchor="middle"
        className="fill-dark-300"
        fontSize={10}
        transform={`rotate(-90, 12, ${paddingTop + plotH / 2})`}
      >
        Weight (kg)
      </text>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function ProgressPage() {
  // ── Stores ──────────────────────────────────────────────────────────
  const weightEntries = useProgressStore((s) => s.weightEntries);
  const addWeightEntry = useProgressStore((s) => s.addWeightEntry);
  const removeWeightEntry = useProgressStore((s) => s.removeWeightEntry);
  const getLatestWeight = useProgressStore((s) => s.getLatestWeight);

  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const setHealthMetrics = useUserStore((s) => s.setHealthMetrics);
  const healthMetrics = useUserStore((s) => s.healthMetrics);

  // ── Local state ─────────────────────────────────────────────────────
  const [weightInput, setWeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [measurements, setMeasurements] = useState<BodyMeasurements>(loadMeasurements);
  const [measurementsSaved, setMeasurementsSaved] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────
  const latestWeight = getLatestWeight();
  const currentWeight = latestWeight?.weightKg ?? profile?.weightKg ?? 0;

  const chartEntries = useMemo(
    () => weightEntries.slice(-30),
    [weightEntries],
  );

  const firstEntry = weightEntries.length > 0 ? weightEntries[0] : null;
  const weightChange =
    latestWeight && firstEntry
      ? latestWeight.weightKg - firstEntry.weightKg
      : 0;

  const currentBMI =
    currentWeight > 0 && profile?.heightCm
      ? calculateBMI(currentWeight, profile.heightCm)
      : healthMetrics?.bmi ?? null;
  const currentBMICategory =
    currentBMI !== null ? getBMICategory(currentBMI) : null;

  // ── Handlers ────────────────────────────────────────────────────────

  function handleLogWeight() {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    const entry = {
      id: crypto.randomUUID(),
      weightKg: weight,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: noteInput.trim() || undefined,
    };

    addWeightEntry(entry);

    // Update profile weight and recalculate health metrics
    if (profile) {
      updateProfile({ weightKg: weight });

      const metrics = calculateHealthMetrics({
        weightKg: weight,
        heightCm: profile.heightCm,
        birthDate: profile.birthDate,
        gender: profile.gender,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      });
      setHealthMetrics(metrics);
    }

    setWeightInput('');
    setNoteInput('');
  }

  function handleSaveMeasurements() {
    localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(measurements));
    setMeasurementsSaved(true);
    setTimeout(() => setMeasurementsSaved(false), 2000);
  }

  function updateMeasurement(key: keyof BodyMeasurements, value: string) {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Progress</h1>
        <p className="mt-1 text-dark-300">
          Track your weight and body measurements
        </p>
      </div>

      {/* ── Log Weight Section ─────────────────────────────────────── */}
      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15">
            <Scale className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
              Log Weight
            </h2>
          </div>
        </div>

        {/* Current weight display */}
        <div className="text-center">
          <p className="text-sm text-dark-400">Current Weight</p>
          <p className="mt-1 text-4xl font-bold text-white">
            {currentWeight > 0 ? `${currentWeight.toFixed(1)}` : '--'}
            <span className="ml-1 text-lg font-normal text-dark-400">kg</span>
          </p>
          {latestWeight && (
            <p className="mt-1 text-xs text-dark-400">
              Last logged {format(parseISO(latestWeight.date), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Input row */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 75.0"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <Input
            label="Notes (optional)"
            type="text"
            placeholder="e.g. After morning workout"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
          />
        </div>

        <Button
          fullWidth
          onClick={handleLogWeight}
          disabled={!weightInput || isNaN(parseFloat(weightInput)) || parseFloat(weightInput) <= 0}
        >
          <Scale className="h-4 w-4" />
          Log Weight
        </Button>
      </Card>

      {/* ── Weight Chart ───────────────────────────────────────────── */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15">
            <LineChart className="h-5 w-5 text-primary-400" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
            Weight Trend
          </h2>
        </div>

        {chartEntries.length < 2 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dark-800">
              <LineChart className="h-7 w-7 text-dark-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Not enough data</p>
              <p className="mt-1 text-xs text-dark-400">
                Log at least 2 weight entries to see your progress chart
              </p>
            </div>
          </div>
        ) : (
          <WeightChart entries={chartEntries} />
        )}
      </Card>

      {/* ── Stats Cards Row ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Current BMI */}
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-700">
            <Activity className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              BMI
            </p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-white">
                {currentBMI !== null ? currentBMI.toFixed(1) : '--'}
              </p>
              {currentBMICategory && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${BMI_BADGE_COLORS[currentBMICategory]}`}
                >
                  {getBMILabel(currentBMICategory)}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Weight Change */}
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-700">
            {weightChange < 0 ? (
              <TrendingDown className="h-5 w-5 text-green-400" />
            ) : weightChange > 0 ? (
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            ) : (
              <Minus className="h-5 w-5 text-dark-400" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              Weight Change
            </p>
            <p
              className={`text-lg font-bold ${
                weightChange < 0
                  ? 'text-green-400'
                  : weightChange > 0
                    ? 'text-yellow-400'
                    : 'text-white'
              }`}
            >
              {weightEntries.length >= 2
                ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`
                : '--'}
            </p>
            {weightEntries.length >= 2 && (
              <p className="text-xs text-dark-400">
                Since {format(parseISO(firstEntry!.date), 'MMM d')}
              </p>
            )}
          </div>
        </Card>

        {/* Total Entries */}
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-700">
            <Hash className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              Total Entries
            </p>
            <p className="text-lg font-bold text-white">{weightEntries.length}</p>
            <p className="text-xs text-dark-400">Weight logs</p>
          </div>
        </Card>
      </div>

      {/* ── Weight History List ─────────────────────────────────────── */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-300">
          Weight History
        </h2>

        {weightEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dark-800">
              <Scale className="h-7 w-7 text-dark-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">No entries yet</p>
              <p className="mt-1 text-xs text-dark-400">
                Log your first weight above to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-80 space-y-0 overflow-y-auto">
            <div className="divide-y divide-dark-800">
              {[...weightEntries]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    {/* Date */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}
                      </p>
                      {entry.note && (
                        <p className="mt-0.5 truncate text-xs text-dark-400">
                          {entry.note}
                        </p>
                      )}
                    </div>

                    {/* Weight */}
                    <p className="shrink-0 text-sm font-bold text-primary-400">
                      {entry.weightKg.toFixed(1)} kg
                    </p>

                    {/* Delete */}
                    <button
                      onClick={() => removeWeightEntry(entry.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-red-500/15 hover:text-red-400"
                      aria-label="Delete weight entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Body Measurements Section ──────────────────────────────── */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
            Body Measurements
          </h2>
          {measurementsSaved && (
            <span className="text-xs font-medium text-green-400">Saved!</span>
          )}
        </div>

        {/* Current values grid */}
        {(measurements.chest ||
          measurements.waist ||
          measurements.hips ||
          measurements.arms ||
          measurements.thighs) && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {(
              [
                ['Chest', measurements.chest],
                ['Waist', measurements.waist],
                ['Hips', measurements.hips],
                ['Arms', measurements.arms],
                ['Thighs', measurements.thighs],
              ] as const
            ).map(
              ([label, value]) =>
                value && (
                  <div
                    key={label}
                    className="rounded-xl bg-dark-800 p-3 text-center"
                  >
                    <p className="text-xs text-dark-400">{label}</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {value}
                      <span className="ml-0.5 text-xs font-normal text-dark-400">
                        cm
                      </span>
                    </p>
                  </div>
                ),
            )}
          </div>
        )}

        {/* Measurement inputs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Chest (cm)"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 100"
            value={measurements.chest}
            onChange={(e) => updateMeasurement('chest', e.target.value)}
          />
          <Input
            label="Waist (cm)"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 80"
            value={measurements.waist}
            onChange={(e) => updateMeasurement('waist', e.target.value)}
          />
          <Input
            label="Hips (cm)"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 95"
            value={measurements.hips}
            onChange={(e) => updateMeasurement('hips', e.target.value)}
          />
          <Input
            label="Arms (cm)"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 35"
            value={measurements.arms}
            onChange={(e) => updateMeasurement('arms', e.target.value)}
          />
          <Input
            label="Thighs (cm)"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 55"
            value={measurements.thighs}
            onChange={(e) => updateMeasurement('thighs', e.target.value)}
          />
        </div>

        <Button onClick={handleSaveMeasurements} variant="secondary" fullWidth>
          <Save className="h-4 w-4" />
          Save Measurements
        </Button>
      </Card>
    </div>
  );
}
