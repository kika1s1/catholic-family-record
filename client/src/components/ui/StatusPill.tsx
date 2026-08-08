const STATUS_CLASS: Record<string, string> = {
  new: "status-new",
  contacted: "status-contacted",
  qualified: "status-qualified",
  scheduled: "status-scheduled",
  closed: "status-closed",
  archived: "status-archived",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? "status-closed";
  return <span className={`status-pill ${cls}`}>{status}</span>;
}
