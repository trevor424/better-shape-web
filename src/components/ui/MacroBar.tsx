interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

export type { MacroBarProps };

export default function MacroBar({
  label,
  current,
  target,
  unit = 'g',
  color = 'var(--color-primary-500)',
}: MacroBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-dark-300">{label}</span>
        <span className="text-white">
          {current}
          <span className="text-dark-400">
            /{target}
            {unit}
          </span>
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-dark-700">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-in-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
