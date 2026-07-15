import { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function StatCard({ label, value, icon: Icon, accent = 'brand', suffix = '', loading }) {
  const accentClasses = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    red: 'bg-red-500/10 text-red-600 dark:text-red-300',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
        {Icon && <Icon size={20} strokeWidth={2} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-500 dark:text-ink-400 truncate">{label}</p>
        {loading ? (
          <div className="skeleton h-6 w-16 mt-1" />
        ) : (
          <p className="text-xl font-display font-bold truncate">
            {value}
            {suffix}
          </p>
        )}
      </div>
    </div>
  );
}

const BADGE_COLORS = {
  High: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Low: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  'New Lead': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Contacted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Interested: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'Meeting Scheduled': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'Proposal Sent': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  Negotiation: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Won: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  Lost: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Pending: 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  Sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Accepted: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  Rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function Badge({ children, className = '' }) {
  const color = BADGE_COLORS[children] || 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-300';
  return <span className={`badge ${color} ${className}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xl animate-slide-up`}
      >
        <div className="flex items-center justify-between border-b border-ink-200 dark:border-ink-800 px-5 py-4 sticky top-0 bg-white dark:bg-ink-900">
          <h3 className="font-display font-bold text-base">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn-outline !px-3 !py-1.5 text-xs"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-lg text-xs font-semibold ${
            p === page
              ? 'bg-brand-500 text-white'
              : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="btn-outline !px-3 !py-1.5 text-xs"
      >
        Next
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800 text-ink-400">
          <Icon size={26} />
        </div>
      )}
      <p className="font-display font-bold text-base">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
