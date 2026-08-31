import { useEffect, useState, type ReactNode } from "react";
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
import { card, eyebrow, pageHead } from "../components/ui/classes";

const CHART = {
  slate: "var(--color-slate-800)",
  amber: "var(--color-amber-700)",
  teal: "var(--color-teal-700)",
  grid: "var(--color-stone-200)",
  tick: "var(--color-slate-400)",
};

const PIE = [
  "var(--color-slate-800)",
  "var(--color-teal-700)",
  "var(--color-amber-600)",
  "var(--color-stone-500)",
  "var(--color-sky-700)",
  "var(--color-rose-800)",
  "var(--color-emerald-700)",
];

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      {label ? <p className="mb-1 font-medium text-slate-900">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className={card}>
      <h3 className="font-serif text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{sub}</p>
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}

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
    return <div className="py-16 text-center text-slate-500">Loading overview…</div>;
  }

  if (error || !data) {
    return <div className="py-16 text-center text-slate-500">{error || "No analytics available"}</div>;
  }

  const daySeries = data.byDay.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <>
      <header className={pageHead}>
        <div>
          <p className={eyebrow}>Operations</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-slate-900">Discovery pipeline</h1>
          <p className="mt-1 text-slate-600">
            Everything submitted from the landing page, with conversion and role mix.
          </p>
        </div>
        <Link
          to="/dashboard/leads"
          className="text-sm font-semibold text-slate-800 no-underline hover:text-amber-800"
        >
          Open all inquiries →
        </Link>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={card}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total inquiries</div>
          <div className="mt-2 font-serif text-3xl font-semibold text-slate-900">{data.kpis.totalLeads}</div>
          <div className="mt-1 text-sm text-slate-500">{data.kpis.last7Days} in the last 7 days</div>
        </article>
        <article className={card}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">New / unread</div>
          <div className="mt-2 font-serif text-3xl font-semibold text-slate-900">{data.kpis.newLeads}</div>
          <div className="mt-1 text-sm text-slate-500">{data.kpis.scheduled} sessions scheduled</div>
        </article>
        <article className={card}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Landing views</div>
          <div className="mt-2 font-serif text-3xl font-semibold text-slate-900">{data.kpis.pageViews}</div>
          <div className="mt-1 text-sm text-slate-500">{data.kpis.formStarts} form starts tracked</div>
        </article>
        <article className={card}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Conversion</div>
          <div className="mt-2 font-serif text-3xl font-semibold text-slate-900">{data.kpis.conversionRate}%</div>
          <div className="mt-1 text-sm text-slate-500">Submissions ÷ page views</div>
        </article>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Inquiries over time" sub="Last 30 days from the Discovery Session form">
          <ResponsiveContainer>
            <AreaChart data={daySeries}>
              <defs>
                <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.slate} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.slate} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: CHART.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: CHART.tick, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART.slate}
                strokeWidth={2}
                fill="url(#leadFill)"
                name="Inquiries"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="By role" sub="Who is requesting Discovery Sessions">
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
                  <Cell key={i} fill={PIE[i % PIE.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Pipeline funnel" sub="Status progression">
          <ResponsiveContainer>
            <BarChart data={data.funnel} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: CHART.tick, fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="stage"
                width={80}
                tick={{ fill: CHART.tick, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" fill={CHART.amber} radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top organizations" sub="Dioceses, parishes, and schools">
          <ResponsiveContainer>
            <BarChart data={data.byOrganization} margin={{ bottom: 40 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-28}
                textAnchor="end"
                height={60}
                tick={{ fill: CHART.tick, fontSize: 10 }}
              />
              <YAxis allowDecimals={false} tick={{ fill: CHART.tick, fontSize: 11 }} width={28} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" fill={CHART.teal} radius={[4, 4, 0, 0]} name="Inquiries" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Status mix" sub="Current book of work">
          <ResponsiveContainer>
            <BarChart data={data.byStatus}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: CHART.tick, fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: CHART.tick, fontSize: 11 }} width={28} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" fill={CHART.slate} radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      <section className={card}>
        <h3 className="font-serif text-lg font-semibold text-slate-900">Recent inquiries</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Organization</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-stone-100">
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
