export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-brand-200 dark:border-ink-800" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
        </div>
        <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
      </div>
    </div>
  );
}
