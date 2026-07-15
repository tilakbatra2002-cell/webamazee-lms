import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Upload, Download, Plus, IndianRupee } from 'lucide-react';
import { proposalsApi, leadsApi } from '../api/endpoints';
import { Badge, EmptyState, Modal, Pagination } from '../components/ui';

const STATUS_TABS = ['', 'Pending', 'Sent', 'Accepted', 'Rejected'];

export default function Proposals() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', status, page],
    queryFn: () => proposalsApi.list({ status: status || undefined, page, limit: 10 }).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }) => {
      const formData = new FormData();
      formData.append('status', newStatus);
      return proposalsApi.update(id, formData);
    },
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  const proposals = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`btn-outline !py-1.5 !text-xs ${status === s ? '!bg-brand-500 !text-white !border-brand-500' : ''}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={15} /> New Proposal
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      )}

      {!isLoading && proposals.length === 0 && (
        <EmptyState icon={FileText} title="No proposals" description="Create a proposal for a lead to get started." />
      )}

      <div className="space-y-2">
        {proposals.map((p) => (
          <div key={p._id} className="card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <FileText size={17} />
              </div>
              <div>
                <p className="font-semibold text-sm">{p.title}</p>
                <Link to={`/leads/${p.lead?._id}`} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  {p.lead?.businessName}
                </Link>
                <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                  <IndianRupee size={11} /> {p.amount?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.fileUrl && (
                <a href={proposalsApi.downloadUrl(p._id)} className="btn-outline !py-1.5 !text-xs" target="_blank" rel="noreferrer">
                  <Download size={13} /> PDF
                </a>
              )}
              <select
                value={p.status}
                onChange={(e) => statusMutation.mutate({ id: p._id, newStatus: e.target.value })}
                className="input !w-auto !py-1.5 !text-xs"
              >
                {['Pending', 'Sent', 'Accepted', 'Rejected'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 1} onChange={setPage} />

      <ProposalFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function ProposalFormModal({ open, onClose }) {
  const qc = useQueryClient();
  const [leadSearch, setLeadSearch] = useState('');
  const [form, setForm] = useState({ lead: '', title: '', amount: '', notes: '' });
  const [file, setFile] = useState(null);

  const { data: leadOptions } = useQuery({
    queryKey: ['lead-search', leadSearch],
    queryFn: () => leadsApi.list({ search: leadSearch, limit: 8 }).then((r) => r.data.data),
    enabled: leadSearch.length > 1,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('file', file);
      return proposalsApi.create(formData);
    },
    onSuccess: () => {
      toast.success('Proposal created');
      qc.invalidateQueries({ queryKey: ['proposals'] });
      setForm({ lead: '', title: '', amount: '', notes: '' });
      setFile(null);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create proposal'),
  });

  return (
    <Modal open={open} onClose={onClose} title="New Proposal">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-3"
      >
        <div>
          <label className="label">Lead</label>
          <input
            className="input"
            placeholder="Search business name..."
            value={leadSearch}
            onChange={(e) => setLeadSearch(e.target.value)}
          />
          {leadOptions?.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-ink-200 dark:border-ink-800">
              {leadOptions.map((l) => (
                <button
                  type="button"
                  key={l._id}
                  onClick={() => {
                    setForm((f) => ({ ...f, lead: l._id }));
                    setLeadSearch(l.businessName);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  {l.businessName}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="label">Proposal Title</label>
          <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="label">Amount (₹)</label>
          <input type="number" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        <div>
          <label className="label flex items-center gap-1"><Upload size={13} /> Upload PDF (optional)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} className="input" />
        </div>
        <button type="submit" disabled={!form.lead || mutation.isPending} className="btn-primary w-full">
          Create Proposal
        </button>
      </form>
    </Modal>
  );
}
