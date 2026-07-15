import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  MessageCircle,
  PhoneCall,
  ThumbsUp,
  ThumbsDown,
  CalendarPlus,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  FileEdit,
  Wallet,
  Trash2,
  Send,
} from 'lucide-react';
import { leadsApi, meetingsApi, usersApi } from '../api/endpoints';
import { Badge, Modal } from '../components/ui';

const STATUS_OPTIONS = [
  'New Lead',
  'Contacted',
  'Interested',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id).then((r) => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['lead', id] });

  const updateMutation = useMutation({
    mutationFn: (payload) => leadsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success('Lead updated');
    },
  });

  const activityMutation = useMutation({
    mutationFn: (payload) => leadsApi.addActivity(id, payload),
    onSuccess: () => {
      invalidate();
      setNote('');
      toast.success('Note added');
    },
  });

  const waMutation = useMutation({
    mutationFn: () => leadsApi.whatsapp(id, waMessage),
    onSuccess: (res) => {
      invalidate();
      window.open(res.data.waLink, '_blank');
      setWaMessage('');
      toast.success('WhatsApp opened');
    },
  });

  const emailMutation = useMutation({
    mutationFn: () => leadsApi.email(id, emailForm),
    onSuccess: () => {
      invalidate();
      setEmailForm({ subject: '', body: '' });
      toast.success('Email sent');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Email failed'),
  });

  const markMutation = useMutation({
    mutationFn: (action) => leadsApi.mark(id, action),
    onSuccess: () => {
      invalidate();
      toast.success('Lead updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.remove(id),
    onSuccess: () => {
      toast.success('Lead deleted');
      navigate('/leads');
    },
  });

  const meetingMutation = useMutation({
    mutationFn: (payload) => meetingsApi.create({ ...payload, lead: id }),
    onSuccess: () => {
      invalidate();
      setMeetingModalOpen(false);
      toast.success('Meeting scheduled');
    },
  });

  if (isLoading || !lead) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const wa = lead.websiteAnalysis || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-ink-200">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => deleteMutation.mutate()} className="btn-danger !py-1.5 text-xs">
          <Trash2 size={14} /> Delete Lead
        </button>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">{lead.businessName}</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">{lead.category}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300">
              {lead.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {lead.phone}</span>}
              {lead.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {lead.email}</span>}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:underline">
                  <Globe size={14} /> Visit Website
                </a>
              )}
              {lead.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {lead.address}</span>}
              {lead.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="fill-amber-400 text-amber-400" /> {lead.rating} ({lead.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <select
              className="input !w-auto"
              value={lead.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Badge>{lead.priority}</Badge>
              {lead.assignedTo && <Badge className="bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-300">{lead.assignedTo.name}</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <select
            className="input"
            value={lead.assignedTo?._id || ''}
            onChange={(e) => updateMutation.mutate({ assignedTo: e.target.value || null })}
          >
            <option value="">Unassigned</option>
            {(users || []).map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            defaultValue={lead.dealValue}
            placeholder="Deal Value (₹)"
            onBlur={(e) => updateMutation.mutate({ dealValue: Number(e.target.value) })}
          />
          <button onClick={() => setMeetingModalOpen(true)} className="btn-outline">
            <CalendarPlus size={15} /> Book Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Outreach Actions */}
        <div className="card p-5 lg:col-span-1 space-y-4">
          <h3 className="font-display font-bold text-sm">Outreach Actions</h3>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => markMutation.mutate('called')} className="btn-secondary !text-xs !py-1.5">
              <PhoneCall size={13} /> Mark Called
            </button>
            <button onClick={() => markMutation.mutate('interested')} className="btn-secondary !text-xs !py-1.5">
              <ThumbsUp size={13} /> Interested
            </button>
            <button onClick={() => markMutation.mutate('not_interested')} className="btn-danger !text-xs !py-1.5">
              <ThumbsDown size={13} /> Not Interested
            </button>
          </div>

          <div className="border-t border-ink-200 dark:border-ink-800 pt-3">
            <label className="label flex items-center gap-1.5"><MessageCircle size={13} /> Send WhatsApp</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Hi! I noticed your business could use a website upgrade..."
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
            />
            <button
              onClick={() => waMutation.mutate()}
              disabled={!lead.phone || waMutation.isPending}
              className="btn-primary w-full mt-2 !text-xs !py-1.5"
            >
              <Send size={13} /> Open WhatsApp
            </button>
          </div>

          <div className="border-t border-ink-200 dark:border-ink-800 pt-3">
            <label className="label flex items-center gap-1.5"><Mail size={13} /> Send Email</label>
            <input
              className="input mb-2"
              placeholder="Subject"
              value={emailForm.subject}
              onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
            />
            <textarea
              className="input"
              rows={3}
              placeholder="Email body (HTML supported)"
              value={emailForm.body}
              onChange={(e) => setEmailForm((f) => ({ ...f, body: e.target.value }))}
            />
            <button
              onClick={() => emailMutation.mutate()}
              disabled={!lead.email || !emailForm.subject || emailMutation.isPending}
              className="btn-primary w-full mt-2 !text-xs !py-1.5"
            >
              <Send size={13} /> Send Email
            </button>
          </div>
        </div>

        {/* Website Analysis */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-sm mb-3">Website Analysis</h3>
          {!lead.website ? (
            <p className="text-sm text-ink-400">No website on file — this is a high-priority opportunity.</p>
          ) : !wa.analyzed ? (
            <p className="text-sm text-ink-400">{wa.error || 'Not analyzed yet'}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <ScoreBar score={wa.score} />
              <AnalysisRow label="SSL Secured" value={wa.hasSSL} />
              <AnalysisRow label="Mobile Friendly" value={wa.isMobileFriendly} />
              <AnalysisRow label="Contact Form" value={wa.hasContactForm} />
              <AnalysisRow label="WhatsApp Button" value={wa.hasWhatsAppButton} />
              <div className="flex justify-between py-1 text-xs text-ink-500">
                <span>Load Time</span>
                <span>{wa.loadTimeMs}ms</span>
              </div>
              {wa.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {wa.technologies.map((t) => (
                    <Badge key={t} className="bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-300">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-sm mb-3">Activity Timeline</h3>
          <div className="mb-3 flex gap-2">
            <input
              className="input !text-sm"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && note && activityMutation.mutate({ type: 'note', message: note })}
            />
            <button
              onClick={() => note && activityMutation.mutate({ type: 'note', message: note })}
              className="btn-secondary !px-3"
            >
              <FileEdit size={14} />
            </button>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {[...(lead.activityLog || [])].reverse().map((entry, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <p className="text-ink-700 dark:text-ink-200">{entry.message}</p>
                  <p className="text-ink-400">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(lead.activityLog || []).length === 0 && <p className="text-xs text-ink-400">No activity yet</p>}
          </div>
        </div>
      </div>

      <Modal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)} title="Book Meeting">
        <MeetingForm onSubmit={(data) => meetingMutation.mutate(data)} />
      </Modal>
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score >= 70 ? 'bg-brand-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-500">Website Score</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function AnalysisRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-ink-600 dark:text-ink-300">{label}</span>
      {value ? (
        <ShieldCheck size={15} className="text-brand-500" />
      ) : (
        <ShieldAlert size={15} className="text-ink-300 dark:text-ink-600" />
      )}
    </div>
  );
}

function MeetingForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    scheduledAt: '',
    durationMinutes: 30,
    mode: 'video',
    requirements: '',
    budget: '',
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-3"
    >
      <div>
        <label className="label">Meeting Title</label>
        <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date & Time</label>
          <input
            type="datetime-local"
            className="input"
            required
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Mode</label>
          <select className="input" value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}>
            <option value="video">Video</option>
            <option value="call">Call</option>
            <option value="in_person">In Person</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Requirements</label>
        <textarea className="input" rows={2} value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} />
      </div>
      <div>
        <label className="label flex items-center gap-1"><Wallet size={13} /> Budget (₹)</label>
        <input type="number" className="input" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
      </div>
      <button type="submit" className="btn-primary w-full">
        Schedule Meeting
      </button>
    </form>
  );
}
