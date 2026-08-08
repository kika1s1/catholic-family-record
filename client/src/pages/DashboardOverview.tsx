import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { api, type DashboardAnalytics } from "../lib/api";
import { StatusPill } from "../components/ui/StatusPill";

const COLORS = ["#0C2D5E", "#0E3F4A", "#D9B44A", "#9C7822", "#5E6B78", "#8B2B22", "#2C5F3E"];

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .analytics()
      .then((res) => {
        if (active) setData(res);
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
  }, []);

  if (loading) {
    return <div className="empty-state">Loading overview…</div>;
  }

  if (error || !data) {
    return <div className="empty-state">{error || "No analytics available"}</div>;
  }

  const daySeries = data.byDay.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <>
      <header className="dash-top">
        <div>
          <div className="dash-eyebrow">Operations</div>
          <h1>Discovery pipeline</h1>
          <p>Everything submitted from the landing page, with conversion and role mix.</p>
        </div>
        <Link to="/dashboard/leads" style={{ color: "var(--d-navy)", fontSize: 14 }}>
          Open all inquiries →
        </Link>
      </header>

      <section className="kpi-grid">
        <article className="kpi">
          <div className="label">Total inquiries</div>
          <div className="value">{data.kpis.totalLeads}</div>
          <div className="hint">{data.kpis.last7Days} in the last 7 days</div>
        </article>
        <article className="kpi">
          <div className="label">New / unread</div>
          <div className="value">{data.kpis.newLeads}</div>
          <div className="hint">{data.kpis.scheduled} sessions scheduled</div>
        </article>
        <article className="kpi">
          <div className="label">Landing views</div>
          <div className="value">{data.kpis.pageViews}</div>
          <div className="hint">{data.kpis.formStarts} form starts tracked</div>
        </article>
        <article className="kpi">
          <div className="label">Conversion</div>
          <div className="value">{data.kpis.conversionRate}%</div>
          <div className="hint">Submissions ÷ page views</div>
        </article>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <h3>Inquiries over time</h3>
          <p className="panel-sub">Last 30 days from the Discovery Session form</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <AreaChart data={daySeries}>
                <defs>
                  <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0C2D5E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0C2D5E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EBE6DA" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#8A94A0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#8A94A0", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #DED8CA",
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0C2D5E"
                  strokeWidth={2}
                  fill="url(#leadFill)"
                  name="Inquiries"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3>By role</h3>
          <p className="panel-sub">Who is requesting Discovery Sessions</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.byRole}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.byRole.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #DED8CA",
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel-grid three">
        <div className="panel">
          <h3>Pipeline funnel</h3>
          <p className="panel-sub">Status progression</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={data.funnel} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid stroke="#EBE6DA" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#8A94A0", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={80}
                  tick={{ fill: "#5E6B78", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #DED8CA",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" fill="#D9B44A" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3>Top organizations</h3>
          <p className="panel-sub">Dioceses, parishes, and schools</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={data.byOrganization} margin={{ bottom: 40 }}>
                <CartesianGrid stroke="#EBE6DA" vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "#8A94A0", fontSize: 10 }}
                />
                <YAxis allowDecimals={false} tick={{ fill: "#8A94A0", fontSize: 11 }} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #DED8CA",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="value" fill="#0E3F4A" radius={[4, 4, 0, 0]} name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3>Status mix</h3>
          <p className="panel-sub">Current book of work</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={data.byStatus}>
                <CartesianGrid stroke="#EBE6DA" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8A94A0", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#8A94A0", fontSize: 11 }} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #DED8CA",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="value" fill="#0C2D5E" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="table-panel" style={{ marginTop: 14 }}>
        <div className="table-head">
          <h3>Recent inquiries</h3>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeads.map((lead) => (
                <tr key={lead.id}>
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
                    {format(parseISO(lead.created_at.replace(" ", "T") + "Z"), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
