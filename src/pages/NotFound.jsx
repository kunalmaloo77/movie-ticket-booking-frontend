import { Link } from 'react-router-dom';
import { ArrowRight, Clapperboard, Film, Home, Ticket } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-900/20" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-900/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_55%,rgba(249,250,251,0.7)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0,transparent_55%,rgba(3,7,18,0.7)_100%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <section className="text-center md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 shadow-sm dark:border-rose-900/70 dark:bg-gray-900/80 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Lost your seat?
          </div>

          <p className="mb-2 text-sm font-bold tracking-[0.3em] text-gray-400 dark:text-gray-500">
            ERROR 404
          </p>
          <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl dark:text-white">
            This page is
            <span className="mt-1 block bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              out of the picture.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-600 sm:text-lg md:mx-0 dark:text-gray-400">
            Looks like this link missed its screening. The page may have moved,
            or it might never have made the cut.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/15 transition hover:-translate-y-0.5 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200 dark:focus-visible:ring-offset-gray-950"
            >
              <Home size={17} />
              Back to homepage
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <div
          aria-hidden="true"
          className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center"
        >
          <div className="absolute inset-6 rotate-[-8deg] rounded-[2rem] border border-white/80 bg-white/50 shadow-2xl shadow-rose-950/10 backdrop-blur-sm dark:border-gray-700/70 dark:bg-gray-900/40" />
          <div className="absolute inset-12 rotate-[7deg] rounded-[1.75rem] bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 shadow-xl shadow-rose-900/25" />
          <div className="relative flex aspect-[4/5] w-2/3 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-gray-950/90 text-white shadow-2xl">
            <div className="absolute inset-x-0 top-0 flex h-8 items-center justify-around border-b border-dashed border-white/20 bg-white/5">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className="h-2 w-2 rounded-full bg-gray-50 dark:bg-gray-950"
                />
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-around border-t border-dashed border-white/20 bg-white/5">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className="h-2 w-2 rounded-full bg-gray-50 dark:bg-gray-950"
                />
              ))}
            </div>
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-300/20">
              <Clapperboard size={34} strokeWidth={1.5} />
            </div>
            <span className="text-7xl font-black tracking-tighter">404</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Scene not found
            </span>
            <div className="mt-6 flex items-center gap-2 text-rose-300">
              <Ticket size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Your next movie awaits
              </span>
              <Film size={16} />
            </div>
          </div>
          <div className="absolute right-3 top-10 flex h-12 w-12 rotate-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-rose-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <Film size={23} />
          </div>
        </div>
      </div>
    </main>
  );
}
