export function PokemonGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border"
        >
          <div className="flex items-center justify-center bg-muted/30 p-4">
            <div className="h-28 w-28 rounded-full bg-muted" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-5 w-24 rounded bg-muted" />
            <div className="flex gap-1.5">
              <div className="h-5 w-14 rounded-full bg-muted" />
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-3 w-8 rounded bg-muted" />
                  <div className="h-2.5 flex-1 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
