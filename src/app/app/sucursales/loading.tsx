export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-36 rounded-lg bg-panel2" />
        <div className="h-4 w-60 rounded bg-panel2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-rail bg-panel p-5">
            <div className="h-5 w-28 rounded bg-panel2" />
            <div className="mt-2 h-3.5 w-36 rounded bg-panel2" />
            <div className="mt-4 h-8 w-20 rounded-lg bg-panel2" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-rail bg-panel p-5">
        <div className="mb-4 h-4 w-32 rounded bg-panel2" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-panel2" />
          ))}
        </div>
      </div>
    </div>
  );
}
