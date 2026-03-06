import Link from "next/link";

import type { EvolutionNode } from "@/lib/pokeapi/types";

type EvolutionChainProps = {
  chain: EvolutionNode;
  currentName: string;
};

export function EvolutionChain({ chain, currentName }: EvolutionChainProps) {
  if (chain.children.length === 0 && !chain.trigger) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-muted-foreground">
        This Pokémon does not evolve.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-muted/10 p-6">
      <div className="inline-flex min-w-full items-start justify-center">
        <EvolutionNodeComponent node={chain} currentName={currentName} isRoot />
      </div>
    </div>
  );
}

type EvolutionNodeProps = {
  node: EvolutionNode;
  currentName: string;
  isRoot?: boolean;
};

function EvolutionNodeComponent({
  node,
  currentName,
  isRoot = false,
}: EvolutionNodeProps) {
  const isCurrent = node.name === currentName;
  const hasBranching = node.children.length > 1;

  return (
    <div className="flex items-start gap-2">
      {!isRoot && node.trigger && (
        <div className="flex flex-col items-center justify-center self-center px-2">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M13 5l7 7-7 7M5 12h14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {node.triggerDetail && (
            <span className="mt-1 max-w-[100px] text-center text-[10px] leading-tight text-muted-foreground">
              {node.triggerDetail}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col items-center">
        <Link
          className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all hover:shadow-md ${
            isCurrent
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-transparent hover:border-border"
          }`}
          href={`/pokedex/${node.name}`}
        >
          {node.spriteUrl ? (
            <img
              alt={node.name}
              className="h-20 w-20 object-contain"
              height={80}
              loading="lazy"
              src={node.spriteUrl}
              width={80}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-lg text-muted-foreground">
              ?
            </div>
          )}
          <span
            className={`mt-1 text-sm font-medium capitalize ${
              isCurrent ? "text-primary" : ""
            }`}
          >
            {node.name.replace(/-/g, " ")}
          </span>
        </Link>

        {node.children.length > 0 && (
          <div
            className={`mt-2 flex ${
              hasBranching ? "flex-col gap-1 sm:flex-row sm:gap-2" : "flex-row gap-2"
            }`}
          >
            {node.children.map((child) => (
              <EvolutionNodeComponent
                key={child.name}
                currentName={currentName}
                node={child}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
