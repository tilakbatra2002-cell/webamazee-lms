import { useState } from 'react';
import { Menu, Sun, Moon, LogOut, ChevronDown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-200 dark:border-ink-800 bg-white/80 dark:bg-ink-900/80 backdrop-blur px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-ink-500 hover:text-ink-800 dark:hover:text-ink-200"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-display font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 dark:text-ink-300"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || <User size={16} />}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-[11px] text-ink-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={14} className="text-ink-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card p-1.5 animate-fade-in">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  Profile & Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
