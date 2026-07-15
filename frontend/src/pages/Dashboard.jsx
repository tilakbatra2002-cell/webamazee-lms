import { useQuery } from '@tanstack/react-query';
import {
  Users2,
  UserPlus,
  Send,
  CalendarClock,
  BellRing,
  FileText,
  Trophy,
  XCircle,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi } from '../api/endpoints';
import { StatCard } from '../components/ui';

const FUNNEL_COLORS = ['#3ccbae', '#ffa524', '#72e0c9', '#1cae93', '#f9860a', '#dd6405', '#128d78', '#ef4444'];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const cards = data?.cards || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Total Leads" value={cards.totalLeads ?? 0} icon={Users2} loading={isLoading} />
        <StatCard label="Today's Leads" value={cards.todaysLeads ?? 0} icon={UserPlus} accent="blue" loading={isLoading} />
        <StatCard label="Today's Outreach" value={cards.todaysOutreach ?? 0} icon={Send} accent="amber" loading={isLoading} />
        <StatCard label="Today's Meetings" value={cards.todaysMeetings ?? 0} icon={CalendarClock} accent="blue" loading={isLoading} />
        <StatCard label="Pending Follow-ups" value={cards.pendingFollowups ?? 0} icon={BellRing} accent="amber" loading={isLoading} />
        <StatCard label="Proposals" value={cards.proposals ?? 0} icon={FileText} loading={isLoading} />
        <StatCard label="Won Deals" value={cards.wonDeals ?? 0} icon={Trophy} accent="brand" loading={isLoading} />
        <StatCard label="Lost Deals" value={cards.lostDeals ?? 0} icon={XCircle} accent="red" loading={isLoading} />
        <StatCard
          label="Revenue"
          value={`₹${(cards.revenue ?? 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          accent="brand"
          loading={isLoading}
        />
        <StatCard label="Monthly Conversion" value={cards.monthlyConversion ?? 0} suffix="%" icon={TrendingUp} accent="amber" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-display font-bold mb-4">Daily Leads (Last 14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.dailyLeads || []}>
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1cae93" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1cae93" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e4e9eb' }} />
              <Area type="monotone" dataKey="count" stroke="#1cae93" strokeWidth={2} fill="url(#leadGradient)" name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={charts.conversionFunnel || []}
                dataKey="count"
                nameKey="_id"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {(charts.conversionFunnel || []).map((entry, idx) => (
                  <Cell key={entry._id} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {(charts.conversionFunnel || []).map((entry, idx) => (
              <span key={entry._id} className="flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] }}
                />
                {entry._id} ({entry.count})
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="revenue" fill="#f9860a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h3 className="font-display font-bold mb-4">Meetings (Last 14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.meetingsTrend || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3ccbae" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
