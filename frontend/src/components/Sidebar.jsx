import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Radar,
  Kanban,
  CalendarClock,
  FileText,
  BarChart3,
  UserCog,
  Settings,
  Target,
  X,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users2 },
  { to: '/scraper', label: 'Maps Scraper', icon: Radar },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/followups', label: 'Follow-ups', icon: ListChecks },
  { to: '/meetings', label: 'Meetings', icon: CalendarClock },
  { to: '/proposals', label: 'Proposals', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, company } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 shrink-0 transform bg-white dark:bg-ink-900 border-r border-ink-200 dark:border-ink-800 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-ink-200 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-glow">
              <Target size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-sm">{company?.name || 'Webamazee'}</p>
              <p className="text-[11px] text-ink-400">Lead Management</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-ink-400 hover:text-ink-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3 overflow-y-auto h-[calc(100%-4rem)]">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role)).map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
                  }`
                }
              >
                <item.icon size={18} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>
    </>
  );
}
