export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-panel2" />
          <div className="h-4 w-52 rounded bg-panel2" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-panel2" />
      </div>
      <div className="rounded-xl border border-rail bg-panel">
        <div className="border-b border-rail bg-panel2 px-5 py-3.5">
          <div className="flex gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-panel" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-rail">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-40 rounded bg-panel2" />
              <div className="ml-auto h-4 w-16 rounded bg-panel2" />
              <div className="h-4 w-16 rounded bg-panel2" />
              <div className="h-4 w-8 rounded bg-panel2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
