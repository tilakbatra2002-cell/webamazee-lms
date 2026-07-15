import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Radar,
  Play,
  Square,
  Pause,
  RotateCcw,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { scraperApi } from '../api/endpoints';
import { getSocket } from '../api/socket';
import { Badge, EmptyState } from '../components/ui';

const STATUS_COLORS = {
  queued: 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  running: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  paused: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  stopped: 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  completed: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export default function Scraper() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ keyword: '', location: '', maxLeads: 50 });
  const [liveProgress, setLiveProgress] = useState({});
  const activeJobRef = useRef(null);

  const { data: jobs } = useQuery({
    queryKey: ['scrape-jobs'],
    queryFn: () => scraperApi.listJobs().then((r) => r.data.data),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    if (!socket.connected) socket.connect();

    const onProgress = (payload) => {
      setLiveProgress((prev) => ({ ...prev, [payload.jobId]: payload }));
      if (['completed', 'stopped', 'failed'].includes(payload.status)) {
        qc.invalidateQueries({ queryKey: ['scrape-jobs'] });
        qc.invalidateQueries({ queryKey: ['leads'] });
        if (payload.status === 'completed') {
          toast.success(`Scraping complete: ${payload.totalSaved ?? ''} new leads saved`);
        }
      }
    };

    socket.on('scrape:progress', onProgress);
    return () => socket.off('scrape:progress', onProgress);
  }, [qc]);

  const startMutation = useMutation({
    mutationFn: () => scraperApi.start(form),
    onSuccess: (res) => {
      toast.success('Scraping started');
      activeJobRef.current = res.data.data._id;
      qc.invalidateQueries({ queryKey: ['scrape-jobs'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start scraping'),
  });

  const stopMutation = useMutation({
    mutationFn: (id) => scraperApi.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scrape-jobs'] }),
  });
  const pauseMutation = useMutation({
    mutationFn: (id) => scraperApi.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scrape-jobs'] }),
  });
  const resumeMutation = useMutation({
    mutationFn: (id) => scraperApi.resume(id),
    onSuccess: () => {
      toast.success('Resumed');
      qc.invalidateQueries({ queryKey: ['scrape-jobs'] });
    },
  });

  const runningJob = (jobs || []).find((j) => ['running', 'paused', 'queued'].includes(j.status));

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <Radar size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold">New Scrape Job</h3>
            <p className="text-xs text-ink-400">Pulls business listings from Google Maps into your Leads</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            startMutation.mutate();
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <div className="sm:col-span-2">
            <label className="label">Keyword</label>
            <input
              className="input"
              placeholder="e.g. gyms, dentists, restaurants"
              required
              value={form.keyword}
              onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="label">Location</label>
            <input
              className="input"
              placeholder="e.g. Mohali, Punjab"
              required
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Max Leads</label>
            <input
              type="number"
              min={1}
              max={500}
              className="input"
              value={form.maxLeads}
              onChange={(e) => setForm((f) => ({ ...f, maxLeads: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={!!runningJob || startMutation.isPending}
              className="btn-primary"
            >
              <Play size={15} /> Start Scraping
            </button>
            {runningJob && (
              <span className="ml-3 text-xs text-ink-400">
                A job is already running — stop it first to start a new one.
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Live progress panel */}
      {(jobs || [])
        .filter((j) => ['running', 'paused', 'queued'].includes(j.status))
        .map((job) => {
          const live = liveProgress[job._id] || {};
          const totalFound = live.totalFound ?? job.totalFound;
          const totalSaved = live.totalSaved ?? job.totalSaved;
          const totalDuplicates = live.totalDuplicates ?? job.totalDuplicates;
          const pct = Math.min(Math.round((totalFound / job.maxLeads) * 100), 100);
          const eta = live.etaSeconds;

          return (
            <div key={job._id} className="card p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-display font-bold text-sm flex items-center gap-2">
                    "{job.keyword}" in {job.location}
                    <Badge className={STATUS_COLORS[live.status || job.status]}>{live.status || job.status}</Badge>
                  </p>
                  <p className="text-xs text-ink-400 flex items-center gap-1 mt-1">
                    <Building2 size={12} /> {live.currentBusiness || job.currentBusiness || 'Starting...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.status === 'running' && (
                    <button onClick={() => pauseMutation.mutate(job._id)} className="btn-secondary !text-xs !py-1.5">
                      <Pause size={13} /> Pause
                    </button>
                  )}
                  {job.status === 'paused' && (
                    <button onClick={() => resumeMutation.mutate(job._id)} className="btn-secondary !text-xs !py-1.5">
                      <Play size={13} /> Resume
                    </button>
                  )}
                  <button onClick={() => stopMutation.mutate(job._id)} className="btn-danger !text-xs !py-1.5">
                    <Square size={13} /> Stop
                  </button>
                </div>
              </div>

              <div className="h-2.5 w-full rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Stat label="Found" value={totalFound} />
                <Stat label="Saved" value={totalSaved} />
                <Stat label="Duplicates Skipped" value={totalDuplicates} />
                <Stat
                  label="ETA"
                  value={eta ? `${Math.floor(eta / 60)}m ${eta % 60}s` : '—'}
                  icon={Clock}
                />
              </div>
            </div>
          );
        })}

      {/* Job history */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-sm mb-3">Scrape History</h3>
        {(jobs || []).length === 0 ? (
          <EmptyState icon={Radar} title="No scrape jobs yet" description="Start your first scrape above." />
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="flex items-center justify-between rounded-lg border border-ink-100 dark:border-ink-800 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-ink-400" />
                  <span className="font-medium">{job.keyword}</span>
                  <span className="text-ink-400">in</span>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} /> {job.totalSaved} saved
                  </span>
                  <Badge className={STATUS_COLORS[job.status]}>{job.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg bg-ink-50 dark:bg-ink-800/60 p-2.5">
      <p className="text-ink-400 flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
      </p>
      <p className="font-display font-bold text-sm mt-0.5">{value}</p>
    </div>
  );
}
