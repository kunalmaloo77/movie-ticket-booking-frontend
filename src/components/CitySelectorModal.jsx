import { useEffect, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { get } from '../api';
import { capitalize } from '../utils/utils';

const inputClass =
  'w-full border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-3 pl-11 bg-white dark:bg-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-500';

export default function CitySelectorModal({ open, onClose, onSelect }) {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [open, searchInput]);

  useEffect(() => {
    if (!open) return;

    async function fetchRegions() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: '1' });
        if (search) params.set('q', search);

        const { data, pagination: pageInfo } = await get(`/region?${params}`);
        setRegions(Array.isArray(data) ? data : []);
        setPagination({
          page: pageInfo?.page ?? 1,
          totalPages: Math.max(pageInfo?.totalPages ?? 1, 1),
          totalItems: pageInfo?.totalItems ?? data?.length ?? 0,
        });
      } catch (error) {
        console.error(error);
        setRegions([]);
        setPagination({ page: 1, totalPages: 1, totalItems: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
  }, [open, search]);

  async function loadMoreRegions() {
    if (loadingMore || pagination.page >= pagination.totalPages) return;

    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const params = new URLSearchParams({ page: String(nextPage) });
      if (search) params.set('q', search);

      const { data, pagination: pageInfo } = await get(`/region?${params}`);
      const nextRows = Array.isArray(data) ? data : [];
      setRegions((prev) => [...prev, ...nextRows]);
      setPagination({
        page: pageInfo?.page ?? nextPage,
        totalPages: Math.max(pageInfo?.totalPages ?? nextPage, 1),
        totalItems: pageInfo?.totalItems ?? 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-10 sm:p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Select your city
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Choose a city to see movies playing near you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
            aria-label="Close city picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
              <input
                type="text"
                placeholder="Search by city name or code"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={inputClass}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
              {search
                ? `${pagination.totalItems} match${pagination.totalItems === 1 ? '' : 'es'}`
                : `${regions.length} of ${pagination.totalItems} cities shown`}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : regions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center mt-6">
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {search
                  ? 'No cities matched your search.'
                  : 'No cities available.'}
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {search
                  ? 'Try a different city name or code.'
                  : 'Region data will appear here once cities are available.'}
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => onSelect(region)}
                    className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors group bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-medium">
                          {capitalize(region.city_name)}
                        </span>
                        <span className="block text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {region.city_code}
                        </span>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </button>
                ))}
              </div>

              {pagination.page < pagination.totalPages && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreRegions}
                    disabled={loadingMore}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? 'Loading more…' : 'Load more cities'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
