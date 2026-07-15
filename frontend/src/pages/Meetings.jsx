import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, Video, Phone, MapPinned, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { meetingsApi } from '../api/endpoints';
import { Badge, EmptyState, Modal } from '../components/ui';

const MODE_ICON = { video: Video, call: Phone, in_person: MapPinned };

export default function Meetings() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', statusFilter],
    queryFn: () => meetingsApi.list({ status: statusFilter || undefined, limit: 100 }).then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => meetingsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Meeting updated');
      qc.invalidateQueries({ queryKey: ['meetings'] });
      setSelected(null);
    },
  });

  const meetings = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {['', 'scheduled', 'completed', 'cancelled', 'no_show'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn-outline !py-1.5 !text-xs capitalize ${statusFilter === s ? '!bg-brand-500 !text-white !border-brand-500' : ''}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      )}

      {!isLoading && meetings.length === 0 && (
        <EmptyState icon={CalendarClock} title="No meetings" description="Book a meeting from any lead's detail page." />
      )}

      <div className="space-y-2">
        {meetings.map((m) => {
          const ModeIcon = MODE_ICON[m.mode] || Video;
          return (
            <div
              key={m._id}
              onClick={() => setSelected(m)}
              className="card p-4 flex items-center justify-between cursor-pointer hover:border-brand-400"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <ModeIcon size={17} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{m.title}</p>
                  <Link
                    to={`/leads/${m.lead?._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {m.lead?.businessName}
                  </Link>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500">{new Date(m.scheduledAt).toLocaleString()}</p>
                <Badge className="mt-1">{m.status}</Badge>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-ink-500">
              With <Link to={`/leads/${selected.lead?._id}`} className="text-brand-600 dark:text-brand-400 hover:underline">{selected.lead?.businessName}</Link>
            </p>
            <p>{new Date(selected.scheduledAt).toLocaleString()} • {selected.durationMinutes} min</p>
            {selected.requirements && (
              <div>
                <p className="label">Requirements</p>
                <p>{selected.requirements}</p>
              </div>
            )}
            {selected.budget > 0 && (
              <p className="flex items-center gap-1"><Wallet size={14} /> ₹{selected.budget.toLocaleString('en-IN')}</p>
            )}
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                defaultValue={selected.notes}
                onBlur={(e) => updateMutation.mutate({ id: selected._id, payload: { notes: e.target.value } })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => updateMutation.mutate({ id: selected._id, payload: { status: 'completed' } })}
                className="btn-primary flex-1"
              >
                <CheckCircle2 size={15} /> Mark Completed
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: selected._id, payload: { status: 'cancelled' } })}
                className="btn-danger flex-1"
              >
                <XCircle size={15} /> Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
