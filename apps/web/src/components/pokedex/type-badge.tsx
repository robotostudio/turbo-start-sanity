import { TYPE_COLORS, type PokemonTypeName } from "@/lib/pokeapi/types";

type TypeBadgeProps = {
  type: string;
  size?: "sm" | "md" | "lg";
};

export function TypeBadge({ type, size = "md" }: TypeBadgeProps) {
  const colorClass = TYPE_COLORS[type as PokemonTypeName] ?? "bg-gray-400 text-white";

  const sizeClass = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size];

  return (
    <span className={`inline-block rounded-full font-medium capitalize ${colorClass} ${sizeClass}`}>
      {type}
    </span>
  );
}
