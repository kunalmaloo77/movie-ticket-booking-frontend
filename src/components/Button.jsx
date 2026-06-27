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
  primary:
    'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200',
  outline:
    'border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400 hover:border-gray-800 dark:hover:border-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
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
