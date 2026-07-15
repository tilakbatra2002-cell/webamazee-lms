import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, AlertTriangle, CalendarDays, ListChecks } from 'lucide-react';
import { followUpsApi } from '../api/endpoints';
import { EmptyState } from '../components/ui';

const BUCKETS = [
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-500' },
  { key: 'today', label: 'Today', icon: Clock, color: 'text-amber-500' },
  { key: 'tomorrow', label: 'Tomorrow', icon: CalendarDays, color: 'text-blue-500' },
  { key: 'thisWeek', label: 'This Week', icon: CalendarDays, color: 'text-ink-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-brand-500' },
];

export default function FollowUps() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['followups'],
    queryFn: () => followUpsApi.list().then((r) => r.data.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => followUpsApi.update(id, { status: 'completed' }),
    onSuccess: () => {
      toast.success('Marked complete');
      qc.invalidateQueries({ queryKey: ['followups'] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-64" />
        ))}
      </div>
    );
  }

  const totalPending = BUCKETS.slice(0, 4).reduce((sum, b) => sum + (data[b.key]?.length || 0), 0);

  return (
    <div className="space-y-4">
      {totalPending === 0 ? (
        <EmptyState icon={ListChecks} title="All caught up!" description="No pending follow-ups right now." />
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {BUCKETS.map((bucket) => (
          <div key={bucket.key} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm flex items-center gap-2">
                <bucket.icon size={16} className={bucket.color} /> {bucket.label}
              </h3>
              <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500">{data[bucket.key]?.length || 0}</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(data[bucket.key] || []).map((f) => (
                <div key={f._id} className="rounded-lg border border-ink-100 dark:border-ink-800 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{f.title}</p>
                      <Link to={`/leads/${f.lead?._id}`} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        {f.lead?.businessName}
                      </Link>
                      <p className="text-[11px] text-ink-400 mt-0.5">{new Date(f.dueDate).toLocaleString()}</p>
                    </div>
                    {bucket.key !== 'completed' && (
                      <button
                        onClick={() => completeMutation.mutate(f._id)}
                        className="text-brand-500 hover:text-brand-600"
                        title="Mark complete"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(data[bucket.key] || []).length === 0 && (
                <p className="text-xs text-ink-400 py-4 text-center">Nothing here</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
