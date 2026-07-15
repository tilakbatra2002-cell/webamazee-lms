import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, ListOrdered, Tags, Mail, MessageSquareText, Trash2, Plus } from 'lucide-react';
import { settingsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'profile', label: 'Company Profile', icon: Building2 },
  { key: 'statuses', label: 'Pipeline Stages', icon: ListOrdered },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'email', label: 'Email Templates', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp Templates', icon: MessageSquareText },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
  });

  const isAdmin = user.role === 'admin';

  if (isLoading) return <div className="skeleton h-96 w-full" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
              tab === t.key
                ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="lg:col-span-3 card p-5">
        {!isAdmin && tab !== 'profile' && (
          <p className="text-sm text-ink-400 mb-3">Only admins can edit these settings. Viewing read-only.</p>
        )}
        {tab === 'profile' && <ProfileTab company={data} isAdmin={isAdmin} />}
        {tab === 'statuses' && <StatusesTab statuses={data.settings.leadStatuses} isAdmin={isAdmin} />}
        {tab === 'categories' && <CategoriesTab categories={data.settings.leadCategories} isAdmin={isAdmin} />}
        {tab === 'email' && <EmailTemplatesTab templates={data.settings.emailTemplates} isAdmin={isAdmin} />}
        {tab === 'whatsapp' && <WhatsAppTemplatesTab templates={data.settings.whatsappTemplates} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

function ProfileTab({ company, isAdmin }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: company.name,
    industry: company.industry,
    website: company.website,
    phone: company.phone,
    address: company.address,
    currency: company.currency,
  });

  const mutation = useMutation({
    mutationFn: () => settingsApi.updateProfile(form),
    onSuccess: () => {
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold">Company Profile</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Company Name</label>
          <input className="input" disabled={!isAdmin} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Industry</label>
          <input className="input" disabled={!isAdmin} value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" disabled={!isAdmin} value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" disabled={!isAdmin} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" disabled={!isAdmin} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" disabled={!isAdmin} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>
      {isAdmin && (
        <button onClick={() => mutation.mutate()} className="btn-primary">
          Save Changes
        </button>
      )}
    </div>
  );
}

function StatusesTab({ statuses, isAdmin }) {
  const qc = useQueryClient();
  const [list, setList] = useState(statuses);
  const [newStatus, setNewStatus] = useState('');

  const mutation = useMutation({
    mutationFn: () => settingsApi.updateStatuses(list),
    onSuccess: () => {
      toast.success('Pipeline stages updated');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold">Pipeline Stages</h3>
      <p className="text-xs text-ink-400">Order matters — this defines your Kanban board columns.</p>
      <div className="space-y-2">
        {list.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input"
              disabled={!isAdmin}
              value={s}
              onChange={(e) => setList((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
            />
            {isAdmin && (
              <button onClick={() => setList((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <>
          <div className="flex gap-2">
            <input className="input" placeholder="New stage name" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} />
            <button
              onClick={() => {
                if (newStatus.trim()) {
                  setList((prev) => [...prev, newStatus.trim()]);
                  setNewStatus('');
                }
              }}
              className="btn-secondary"
            >
              <Plus size={15} />
            </button>
          </div>
          <button onClick={() => mutation.mutate()} className="btn-primary">
            Save Pipeline Stages
          </button>
        </>
      )}
    </div>
  );
}

function CategoriesTab({ categories, isAdmin }) {
  const qc = useQueryClient();
  const [list, setList] = useState(categories);
  const [newCat, setNewCat] = useState('');

  const mutation = useMutation({
    mutationFn: () => settingsApi.updateCategories(list),
    onSuccess: () => {
      toast.success('Categories updated');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold">Lead Categories</h3>
      <div className="flex flex-wrap gap-2">
        {list.map((c, i) => (
          <span key={i} className="badge bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 gap-1.5">
            {c}
            {isAdmin && (
              <button onClick={() => setList((prev) => prev.filter((_, idx) => idx !== i))}>
                <Trash2 size={11} />
              </button>
            )}
          </span>
        ))}
      </div>
      {isAdmin && (
        <>
          <div className="flex gap-2">
            <input className="input" placeholder="e.g. Restaurant" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button
              onClick={() => {
                if (newCat.trim()) {
                  setList((prev) => [...prev, newCat.trim()]);
                  setNewCat('');
                }
              }}
              className="btn-secondary"
            >
              <Plus size={15} />
            </button>
          </div>
          <button onClick={() => mutation.mutate()} className="btn-primary">
            Save Categories
          </button>
        </>
      )}
    </div>
  );
}

function EmailTemplatesTab({ templates, isAdmin }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', subject: '', body: '' });

  const saveMutation = useMutation({
    mutationFn: () => settingsApi.upsertEmailTemplate(form),
    onSuccess: () => {
      toast.success('Template saved');
      setForm({ name: '', subject: '', body: '' });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (name) => settingsApi.deleteEmailTemplate(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold">Email Templates</h3>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.name} className="rounded-lg border border-ink-200 dark:border-ink-800 p-3">
            <div className="flex justify-between">
              <p className="font-semibold text-sm">{t.name}</p>
              {isAdmin && (
                <button onClick={() => deleteMutation.mutate(t.name)} className="text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-ink-500 mt-1">Subject: {t.subject}</p>
            <p className="text-xs text-ink-400 mt-1 line-clamp-2">{t.body}</p>
          </div>
        ))}
      </div>
      {isAdmin && (
        <div className="border-t border-ink-200 dark:border-ink-800 pt-4 space-y-2">
          <input className="input" placeholder="Template name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <textarea className="input" rows={3} placeholder="Body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <button onClick={() => saveMutation.mutate()} disabled={!form.name} className="btn-primary">
            Save Template
          </button>
        </div>
      )}
    </div>
  );
}

function WhatsAppTemplatesTab({ templates, isAdmin }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', body: '' });

  const saveMutation = useMutation({
    mutationFn: () => settingsApi.upsertWhatsAppTemplate(form),
    onSuccess: () => {
      toast.success('Template saved');
      setForm({ name: '', body: '' });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (name) => settingsApi.deleteWhatsAppTemplate(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold">WhatsApp Templates</h3>
      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.name} className="rounded-lg border border-ink-200 dark:border-ink-800 p-3">
            <div className="flex justify-between">
              <p className="font-semibold text-sm">{t.name}</p>
              {isAdmin && (
                <button onClick={() => deleteMutation.mutate(t.name)} className="text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-1 line-clamp-2">{t.body}</p>
          </div>
        ))}
      </div>
      {isAdmin && (
        <div className="border-t border-ink-200 dark:border-ink-800 pt-4 space-y-2">
          <input className="input" placeholder="Template name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <textarea className="input" rows={3} placeholder="Message body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <button onClick={() => saveMutation.mutate()} disabled={!form.name} className="btn-primary">
            Save Template
          </button>
        </div>
      )}
    </div>
  );
}
