  export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

const base =
  'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  outline:
    'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-50 dark:hover:border-zinc-400 dark:hover:bg-zinc-800',
  // Outlined so destructive actions never look like the crimson primary button.
  danger:
    'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40',
};

const sizes = {
  md: 'px-4 py-2',
  sm: 'px-3 py-1 text-sm',
};

export default function Button({
  loading = false,
  loadingText,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {loading ? (loadingText ?? children) : children}
    </button>
  );
}
