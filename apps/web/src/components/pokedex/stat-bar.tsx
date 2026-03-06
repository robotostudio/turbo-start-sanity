import type { PokemonStat } from "@/lib/pokeapi/types";

type StatBarProps = {
  stat: PokemonStat;
  maxValue?: number;
};

const STAT_COLORS: Record<string, string> = {
  hp: "bg-red-500",
  attack: "bg-orange-500",
  defense: "bg-yellow-500",
  "special-attack": "bg-blue-500",
  "special-defense": "bg-green-500",
  speed: "bg-pink-500",
};

export function StatBar({ stat, maxValue = 255 }: StatBarProps) {
  const pct = Math.min((stat.value / maxValue) * 100, 100);
  const barColor = STAT_COLORS[stat.name] ?? "bg-gray-400";

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-right font-medium text-muted-foreground text-xs">
        {stat.abbr}
      </span>
      <span className="w-8 text-right font-semibold text-xs tabular-nums">
        {stat.value}
      </span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ComparisonStatBar({
  stat1,
  stat2,
  maxValue = 255,
}: {
  stat1: PokemonStat;
  stat2: PokemonStat;
  maxValue?: number;
}) {
  const pct1 = Math.min((stat1.value / maxValue) * 100, 100);
  const pct2 = Math.min((stat2.value / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-right font-medium text-muted-foreground text-xs">
        {stat1.abbr}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
              style={{ width: `${pct1}%` }}
            />
          </div>
          <span className="w-7 text-right font-semibold text-blue-600 text-xs tabular-nums">
            {stat1.value}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-red-500"
              style={{ width: `${pct2}%` }}
            />
          </div>
          <span className="w-7 text-right font-semibold text-red-600 text-xs tabular-nums">
            {stat2.value}
          </span>
        </div>
      </div>
    </div>
  );
}
