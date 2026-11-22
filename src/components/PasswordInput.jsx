import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// The wrapper owns the outer margin so the toggle button stays vertically
// centred on the input; pass input styles without margin via `className`.
export default function PasswordInput({
  className = '',
  wrapperClassName = 'mb-4',
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
