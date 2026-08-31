const STATUS_CLASS: Record<string, string> = {
  new: "bg-sky-100 text-sky-800",
  contacted: "bg-indigo-100 text-indigo-800",
  qualified: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-amber-100 text-amber-900",
  closed: "bg-slate-100 text-slate-700",
  archived: "bg-stone-200 text-stone-700",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.closed;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}
