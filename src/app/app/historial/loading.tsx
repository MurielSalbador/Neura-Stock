export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-28 rounded-lg bg-panel2" />
        <div className="h-4 w-60 rounded bg-panel2" />
      </div>
      <div className="rounded-xl border border-rail bg-panel">
        <div className="border-b border-rail bg-panel2 px-5 py-3.5">
          <div className="flex gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-panel" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-rail">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-6 w-20 rounded-md bg-panel2" />
              <div className="h-4 w-36 rounded bg-panel2" />
              <div className="ml-auto h-4 w-20 rounded bg-panel2" />
              <div className="h-4 w-24 rounded bg-panel2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
