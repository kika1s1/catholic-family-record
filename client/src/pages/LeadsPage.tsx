import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { api, type Lead } from "../lib/api";
import { StatusPill } from "../components/ui/StatusPill";

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
      <header className="dash-top">
        <div>
          <div className="dash-eyebrow">Inbound</div>
          <h1>Discovery Session requests</h1>
          <p>
            {total} total · every field captured from the landing page contact form
          </p>
        </div>
      </header>

      {error ? <p className="login-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <div className="leads-layout">
        <section className="table-panel">
          <div className="table-head">
            <h3>All inquiries</h3>
            <div className="filters">
              <input
                type="search"
                aria-label="Search inquiries"
                placeholder="e.g. Margaret Chen, St. Mary's, or pastor@"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
            <div className="empty-state">Loading inquiries…</div>
          ) : items.length === 0 ? (
            <div className="empty-state">No inquiries match these filters.</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Organization</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((lead) => (
                    <tr
                      key={lead.id}
                      className={lead.id === selectedId ? "active" : undefined}
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <td>
                        <div className="name-cell">{lead.name}</div>
                        <div className="muted-cell">{lead.email}</div>
                      </td>
                      <td>{lead.organization}</td>
                      <td>{lead.role}</td>
                      <td>
                        <StatusPill status={lead.status} />
                      </td>
                      <td className="muted-cell">
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
          <aside className="detail-card">
            <div className="dash-eyebrow">Inquiry detail</div>
            <h2>{selected.name}</h2>
            <StatusPill status={selected.status} />

            <div className="detail-meta">
              <div className="detail-row">
                <label>Email</label>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </div>
              <div className="detail-row">
                <label>Diocese, parish, or school</label>
                <div>{selected.organization}</div>
              </div>
              <div className="detail-row">
                <label>Role</label>
                <div>{selected.role}</div>
              </div>
              <div className="detail-row">
                <label>What they want answered</label>
                <div className="message-box">
                  {selected.message?.trim() || "(not given)"}
                </div>
              </div>
              <div className="detail-row">
                <label>Pipeline status</label>
                <select
                  className="detail-select"
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
              <div className="detail-row">
                <label>Source</label>
                <div>{selected.source}</div>
              </div>
              <div className="detail-row">
                <label>Received</label>
                <div>
                  {format(
                    parseISO(selected.created_at.replace(" ", "T") + "Z"),
                    "MMMM d, yyyy · h:mm a",
                  )}
                </div>
              </div>
              <div className="detail-row">
                <label>Last updated</label>
                <div>
                  {format(
                    parseISO(selected.updated_at.replace(" ", "T") + "Z"),
                    "MMMM d, yyyy · h:mm a",
                  )}
                </div>
              </div>
              {selected.ip ? (
                <div className="detail-row">
                  <label>IP</label>
                  <div className="muted-cell">{selected.ip}</div>
                </div>
              ) : null}
              {selected.user_agent ? (
                <div className="detail-row">
                  <label>User agent</label>
                  <div className="muted-cell" style={{ wordBreak: "break-word" }}>
                    {selected.user_agent}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        ) : (
          <aside className="detail-card empty">
            Select an inquiry to inspect every field submitted from the landing page.
          </aside>
        )}
      </div>
    </>
  );
}
