import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { TrendingUp, Users2, CalendarClock, FileText, Percent } from 'lucide-react';
import { analyticsApi } from '../api/endpoints';
import { StatCard } from '../components/ui';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.analytics().then((r) => r.data.data),
  });

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Leads" value={summary.totalLeads ?? 0} icon={Users2} loading={isLoading} />
        <StatCard label="Conversion Rate" value={summary.conversionRate ?? 0} suffix="%" icon={TrendingUp} accent="brand" loading={isLoading} />
        <StatCard label="Total Meetings" value={summary.totalMeetings ?? 0} icon={CalendarClock} accent="blue" loading={isLoading} />
        <StatCard label="Total Proposals" value={summary.totalProposals ?? 0} icon={FileText} accent="amber" loading={isLoading} />
        <StatCard label="Proposal Ratio" value={summary.proposalRatio ?? 0} suffix="%" icon={Percent} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-bold mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.topCategories || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill="#1cae93" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold mb-4">Top Cities</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.topCities || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill="#f9860a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-bold mb-4">Monthly Report — Leads vs Won vs Lost</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data?.monthlyReport || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="totalLeads" stroke="#586d79" strokeWidth={2} name="Total Leads" />
              <Line type="monotone" dataKey="won" stroke="#1cae93" strokeWidth={2} name="Won" />
              <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} name="Lost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
