export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  type: string;
  daysPerWeek: number;
  days: {
    name: string;
    exerciseIds: string[];
  }[];
};

export const workoutPlans: WorkoutPlan[] = [
  // ── Push / Pull / Legs (6 days) ──────────────────────────────────
  {
    id: 'plan-ppl',
    name: 'Push / Pull / Legs',
    description:
      'A classic 6-day split that groups muscles by movement pattern. Each muscle group is trained twice per week for optimal hypertrophy.',
    type: 'split',
    daysPerWeek: 6,
    days: [
      {
        name: 'Push A',
        exerciseIds: ['ex-001', 'ex-002', 'ex-005', 'ex-011', 'ex-012', 'ex-024'],
      },
      {
        name: 'Pull A',
        exerciseIds: ['ex-006', 'ex-007', 'ex-008', 'ex-013', 'ex-023', 'ex-025'],
      },
      {
        name: 'Legs A',
        exerciseIds: ['ex-016', 'ex-017', 'ex-018', 'ex-020', 'ex-022', 'ex-028'],
      },
      {
        name: 'Push B',
        exerciseIds: ['ex-002', 'ex-003', 'ex-004', 'ex-015', 'ex-012', 'ex-026'],
      },
      {
        name: 'Pull B',
        exerciseIds: ['ex-009', 'ex-010', 'ex-008', 'ex-014', 'ex-023', 'ex-030'],
      },
      {
        name: 'Legs B',
        exerciseIds: ['ex-016', 'ex-017', 'ex-021', 'ex-019', 'ex-022', 'ex-029'],
      },
    ],
  },

  // ── Upper / Lower (4 days) ───────────────────────────────────────
  {
    id: 'plan-ul',
    name: 'Upper / Lower',
    description:
      'A balanced 4-day split alternating between upper-body and lower-body sessions. Great for intermediate lifters who want adequate recovery.',
    type: 'split',
    daysPerWeek: 4,
    days: [
      {
        name: 'Upper A',
        exerciseIds: ['ex-001', 'ex-008', 'ex-011', 'ex-012', 'ex-023', 'ex-024'],
      },
      {
        name: 'Lower A',
        exerciseIds: ['ex-016', 'ex-017', 'ex-018', 'ex-022', 'ex-028'],
      },
      {
        name: 'Upper B',
        exerciseIds: ['ex-002', 'ex-007', 'ex-015', 'ex-013', 'ex-025', 'ex-026'],
      },
      {
        name: 'Lower B',
        exerciseIds: ['ex-016', 'ex-021', 'ex-019', 'ex-020', 'ex-029'],
      },
    ],
  },

  // ── Full Body (3 days) ───────────────────────────────────────────
  {
    id: 'plan-fb',
    name: 'Full Body',
    description:
      'A 3-day full-body program built around big compound lifts. Ideal for beginners or those with limited training days.',
    type: 'full_body',
    daysPerWeek: 3,
    days: [
      {
        name: 'Day A',
        exerciseIds: ['ex-016', 'ex-001', 'ex-008', 'ex-011', 'ex-023', 'ex-028'],
      },
      {
        name: 'Day B',
        exerciseIds: ['ex-006', 'ex-002', 'ex-007', 'ex-012', 'ex-024', 'ex-030'],
      },
      {
        name: 'Day C',
        exerciseIds: ['ex-016', 'ex-004', 'ex-010', 'ex-015', 'ex-027', 'ex-029'],
      },
    ],
  },
];
