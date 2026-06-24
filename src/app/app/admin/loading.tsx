export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-24 rounded-lg bg-panel2" />
        <div className="h-4 w-56 rounded bg-panel2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-rail bg-panel p-4">
            <div className="h-3 w-12 rounded bg-panel2" />
            <div className="mt-2 h-8 w-8 rounded bg-panel2" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        <div className="border-b border-rail bg-panel2 px-5 py-3.5">
          <div className="flex gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-3 w-14 rounded bg-panel" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-rail">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-8 w-8 rounded-full bg-panel2" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded bg-panel2" />
                <div className="h-3 w-40 rounded bg-panel2" />
              </div>
              <div className="h-5 w-20 rounded-md bg-panel2" />
              <div className="h-5 w-28 rounded-md bg-panel2" />
              <div className="h-5 w-14 rounded-md bg-panel2" />
              <div className="h-4 w-16 rounded bg-panel2" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-rail bg-panel p-5">
        <div className="mb-4 h-4 w-28 rounded bg-panel2" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-panel2" />
          ))}
        </div>
      </div>
    </div>
  );
}
