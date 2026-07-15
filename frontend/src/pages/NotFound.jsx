import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 dark:bg-ink-950 text-center p-4">
      <Compass size={40} className="text-ink-300 dark:text-ink-700 mb-3" />
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary mt-5">
        Back to Dashboard
      </Link>
    </div>
  );
}
