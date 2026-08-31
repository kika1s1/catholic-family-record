import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { api, type Lead } from "../lib/api";
import { StatusPill } from "../components/ui/StatusPill";
import { card, eyebrow, fieldInput, pageHead } from "../components/ui/classes";

const STATUSES = ["new", "contacted", "qualified", "scheduled", "closed", "archived"];

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const query = useMemo(() => ({ status: status || undefined, q: q || undefined }), [status, q]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .leads(query)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
        setSelectedId((current) => current ?? res.items[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    let active = true;
    api
      .lead(selectedId)
      .then((res) => {
        if (active) setSelected(res.lead);
      })
      .catch(() => {
        if (active) setSelected(null);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  async function onStatusChange(next: string) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.updateLeadStatus(selected.id, next);
      setSelected(res.lead);
      setItems((prev) => prev.map((l) => (l.id === res.lead.id ? res.lead : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className={pageHead}>
        <div>
          <p className={eyebrow}>Inbound</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-slate-900">
            Discovery Session requests
          </h1>
          <p className="mt-1 text-slate-600">
            {total} total · every field captured from the landing page contact form
          </p>
        </div>
      </header>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className={card}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-serif text-lg font-semibold text-slate-900">All inquiries</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                aria-label="Search inquiries"
                placeholder="e.g. Margaret Chen, St. Mary's, or pastor@"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`${fieldInput} sm:w-64`}
              />
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${fieldInput} sm:w-40`}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading inquiries…</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No inquiries match these filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Organization</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`cursor-pointer border-b border-stone-100 hover:bg-stone-50 ${
                        lead.id === selectedId ? "bg-amber-50" : ""
                      }`}
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="text-slate-500">{lead.email}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{lead.organization}</td>
                      <td className="px-3 py-3 text-slate-700">{lead.role}</td>
                      <td className="px-3 py-3">
                        <StatusPill status={lead.status} />
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {format(
                          parseISO(lead.created_at.replace(" ", "T") + "Z"),
                          "MMM d · h:mm a",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected ? (
          <aside className={card}>
            <p className={eyebrow}>Inquiry detail</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-900">{selected.name}</h2>
            <div className="mt-2">
              <StatusPill status={selected.status} />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className={eyebrow}>Email</p>
                <a className="mt-1 block text-slate-800 no-underline hover:text-amber-800" href={`mailto:${selected.email}`}>
                  {selected.email}
                </a>
              </div>
              <div>
                <p className={eyebrow}>Diocese, parish, or school</p>
                <p className="mt-1 text-slate-800">{selected.organization}</p>
              </div>
              <div>
                <p className={eyebrow}>Role</p>
                <p className="mt-1 text-slate-800">{selected.role}</p>
              </div>
              <div>
                <p className={eyebrow}>What they want answered</p>
                <p className="mt-1 rounded-md bg-stone-50 p-3 text-slate-800">
                  {selected.message?.trim() || "(not given)"}
                </p>
              </div>
              <div>
                <p className={eyebrow}>Pipeline status</p>
                <select
                  className={`${fieldInput} mt-1`}
                  value={selected.status}
                  disabled={saving}
                  onChange={(e) => void onStatusChange(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className={eyebrow}>Source</p>
                <p className="mt-1 text-slate-800">{selected.source}</p>
              </div>
              <div>
                <p className={eyebrow}>Received</p>
                <p className="mt-1 text-slate-800">
                  {format(
                    parseISO(selected.created_at.replace(" ", "T") + "Z"),
                    "MMMM d, yyyy · h:mm a",
                  )}
                </p>
              </div>
              <div>
                <p className={eyebrow}>Last updated</p>
                <p className="mt-1 text-slate-800">
                  {format(
                    parseISO(selected.updated_at.replace(" ", "T") + "Z"),
                    "MMMM d, yyyy · h:mm a",
                  )}
                </p>
              </div>
              {selected.ip ? (
                <div>
                  <p className={eyebrow}>IP</p>
                  <p className="mt-1 break-all text-sm text-slate-500">{selected.ip}</p>
                </div>
              ) : null}
              {selected.user_agent ? (
                <div>
                  <p className={eyebrow}>User agent</p>
                  <p className="mt-1 break-all text-sm text-slate-500">{selected.user_agent}</p>
                </div>
              ) : null}
            </div>
          </aside>
        ) : (
          <aside className={`${card} text-slate-500`}>
            Select an inquiry to inspect every field submitted from the landing page.
          </aside>
        )}
      </div>
    </>
  );
}
