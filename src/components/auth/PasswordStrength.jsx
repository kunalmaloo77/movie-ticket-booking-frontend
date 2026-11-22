import { useEffect, useState } from 'react';

// zxcvbn's dictionaries are large, so they load only when a strength meter
// is first shown
let checkerPromise;
function loadChecker() {
  checkerPromise ??= Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-common'),
  ]).then(([core, common]) => {
    const zxcvbn = new core.ZxcvbnFactory({
      graphs: common.adjacencyGraphs,
      dictionary: common.dictionary,
    });
    return (password, userInputs) => zxcvbn.check(password, userInputs);
  });
  return checkerPromise;
}

const LEVELS = [
  { label: 'Very weak', color: 'bg-red-500' },
  { label: 'Weak', color: 'bg-orange-500' },
  { label: 'Fair', color: 'bg-yellow-500' },
  { label: 'Good', color: 'bg-lime-500' },
  { label: 'Strong', color: 'bg-green-600' },
];

// Advisory only: the server enforces length and the breached-password check.
// The text has an id so the password input can reference it with
// aria-describedby.
export default function PasswordStrength({ id, password, userInputs = [] }) {
  // Score for the password it was computed for, so a stale result never shows
  const [result, setResult] = useState({ password: '', score: null });
  const inputsKey = userInputs.join('|');

  useEffect(() => {
    if (!password) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      loadChecker()
        .then((check) => {
          const { score } = check(password, inputsKey.split('|').filter(Boolean));
          if (!cancelled) setResult({ password, score });
        })
        .catch(() => {});
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [password, inputsKey]);

  const score = password && result.password === password ? result.score : null;
  const level = score === null ? null : LEVELS[score];
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <span
            key={l.label}
            className={`h-1.5 flex-1 rounded-full ${
              level && i <= score ? level.color : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
      <p id={id} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {level ? `Password strength: ${level.label}` : 'Use 8 or more characters. A short phrase works well.'}
      </p>
    </div>
  );
}
