import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Search,
  Plus,
  Trash2,
  UserPlus,
  Globe,
  GlobeLock,
  Star,
  Filter,
  X,
  Users2,
} from 'lucide-react';
import { leadsApi, usersApi } from '../api/endpoints';
import { Badge, Modal, Pagination, EmptyState } from '../components/ui';

export default function Leads() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', city: '', priority: '', status: '', hasWebsite: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const params = { page, limit: 15, search: search || undefined, ...filters };
  Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.list(params).then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: filterMeta } = useQuery({
    queryKey: ['leads-filter-meta'],
    queryFn: () => leadsApi.filterMeta().then((r) => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  });

  const leads = data?.data || [];
  const meta = data?.meta || {};

  const bulkDeleteMutation = useMutation({
    mutationFn: () => leadsApi.bulkDelete(selected),
    onSuccess: () => {
      toast.success('Leads deleted');
      setSelected([]);
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (assignedTo) => leadsApi.bulkAssign(selected, assignedTo),
    onSuccess: () => {
      toast.success('Leads assigned');
      setSelected([]);
      setAssignModalOpen(false);
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const toggleSelectAll = () => {
    if (selected.length === leads.length) setSelected([]);
    else setSelected(leads.map((l) => l._id));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search business, city, category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((v) => !v)} className="btn-outline">
            <Filter size={15} /> Filters
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-slide-up">
          <select
            className="input"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {(filterMeta?.categories || []).filter(Boolean).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          >
            <option value="">All Cities</option>
            {(filterMeta?.cities || []).filter(Boolean).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {['New Lead', 'Contacted', 'Interested', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
          <select
            className="input"
            value={filters.hasWebsite}
            onChange={(e) => setFilters((f) => ({ ...f, hasWebsite: e.target.value }))}
          >
            <option value="">Website: Any</option>
            <option value="true">Has Website</option>
            <option value="false">No Website</option>
          </select>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-brand-500/10 border border-brand-500/20 px-4 py-2.5 animate-slide-up">
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selected.length} lead{selected.length > 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setAssignModalOpen(true)} className="btn-secondary !py-1.5 text-xs">
              <UserPlus size={14} /> Assign
            </button>
            <button
              onClick={() => bulkDeleteMutation.mutate()}
              className="btn-danger !py-1.5 text-xs"
            >
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => setSelected([])} className="btn-outline !py-1.5 text-xs">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 dark:border-ink-800 text-left text-xs text-ink-500 dark:text-ink-400 uppercase tracking-wide">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={leads.length > 0 && selected.length === leads.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="p-3">Business</th>
              <th className="p-3">Category</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Website</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-ink-100 dark:border-ink-800/50">
                  <td colSpan={9} className="p-3">
                    <div className="skeleton h-8 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading &&
              leads.map((lead) => (
                <tr
                  key={lead._id}
                  className="border-b border-ink-100 dark:border-ink-800/50 hover:bg-ink-50 dark:hover:bg-ink-800/40"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(lead._id)}
                      onChange={() => toggleSelect(lead._id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <Link to={`/leads/${lead._id}`} className="font-semibold hover:text-brand-600 dark:hover:text-brand-400">
                      {lead.businessName}
                    </Link>
                    <p className="text-xs text-ink-400">{lead.city}</p>
                  </td>
                  <td className="p-3 text-ink-600 dark:text-ink-300">{lead.category}</td>
                  <td className="p-3 text-ink-600 dark:text-ink-300">{lead.phone || '—'}</td>
                  <td className="p-3">
                    {lead.website ? (
                      <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 text-xs">
                        <Globe size={13} /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-ink-400 text-xs">
                        <GlobeLock size={13} /> None
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {lead.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Star size={13} className="fill-amber-400 text-amber-400" /> {lead.rating}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">
                    <Badge>{lead.priority}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge>{lead.status}</Badge>
                  </td>
                  <td className="p-3 text-xs text-ink-500">{lead.assignedTo?.name || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {!isLoading && leads.length === 0 && (
          <EmptyState
            icon={Users2}
            title="No leads found"
            description="Try adjusting your filters, or scrape new leads from Google Maps."
            action={
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                <Plus size={15} /> Add Lead Manually
              </button>
            }
          />
        )}
      </div>

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 1} onChange={setPage} />

      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} categories={filterMeta?.categories} />

      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign leads to" size="sm">
        <div className="space-y-2">
          {(users || []).map((u) => (
            <button
              key={u._id}
              onClick={() => bulkAssignMutation.mutate(u._id)}
              className="flex w-full items-center gap-3 rounded-lg p-2.5 hover:bg-ink-100 dark:hover:bg-ink-800 text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 font-semibold text-xs">
                {u.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-ink-400 capitalize">{u.role.replace('_', ' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function LeadFormModal({ open, onClose, categories }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: (payload) => leadsApi.create(payload),
    onSuccess: () => {
      toast.success('Lead created');
      qc.invalidateQueries({ queryKey: ['leads'] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create lead'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add New Lead">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
        <div>
          <label className="label">Business Name *</label>
          <input className="input" {...register('businessName', { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <input className="input" list="cat-list" {...register('category')} />
            <datalist id="cat-list">
              {(categories || []).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" {...register('city')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" {...register('email')} />
          </div>
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" {...register('website')} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Priority</label>
            <select className="input" {...register('priority')}>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="label">Deal Value (₹)</label>
            <input type="number" className="input" {...register('dealValue')} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} {...register('notes')} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          Create Lead
        </button>
      </form>
    </Modal>
  );
}
