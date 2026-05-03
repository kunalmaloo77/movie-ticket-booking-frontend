import { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export default ThemeContext;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'system'
  );
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(t) {
      let dark;
      if (t === 'dark') {
        dark = true;
      } else if (t === 'light') {
        dark = false;
      } else {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      dark ? root.classList.add('dark') : root.classList.remove('dark');
      setIsDark(dark);
    }

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      e.matches ? root.classList.add('dark') : root.classList.remove('dark');
      setIsDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
