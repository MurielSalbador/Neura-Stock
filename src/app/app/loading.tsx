export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-panel2" />
        <div className="h-4 w-64 rounded bg-panel2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-rail bg-panel p-5">
            <div className="h-3 w-14 rounded bg-panel2" />
            <div className="mt-2.5 h-7 w-10 rounded bg-panel2" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-rail bg-panel">
        <div className="border-b border-rail px-5 py-3.5">
          <div className="h-3 w-32 rounded bg-panel2" />
        </div>
        <div className="divide-y divide-rail">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-8 w-8 rounded-full bg-panel2" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-36 rounded bg-panel2" />
                <div className="h-3 w-24 rounded bg-panel2" />
              </div>
              <div className="h-5 w-16 rounded-md bg-panel2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
