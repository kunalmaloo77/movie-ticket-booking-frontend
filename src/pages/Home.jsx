import { useState, useEffect } from 'react';
import { get } from '../api';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie } from '../utils/cookie';
import { CityGridSkeleton } from '../components/Skeleton';
import { capitalize } from '../utils/utils';
import { ArrowRight, Search } from 'lucide-react';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-11 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500';

export default function Home() {
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
  const navigate = useNavigate();

  useEffect(() => {
    const saved = getCookie('selected_region');
    if (saved?.city_name) {
      navigate(`/explore/home/${saved.city_name}`, { replace: true });
      return;
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    async function fetchRegions() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: '1' });
        if (search) {
          params.set('q', search);
        }

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
  }, [search]);

  function handleSelect(region) {
    setCookie('selected_region', region);
    navigate(`/explore/home/${region.city_name}`);
  }

  async function loadMoreRegions() {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const params = new URLSearchParams({ page: String(nextPage) });
      if (search) {
        params.set('q', search);
      }

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

  if (loading) {
    return <CityGridSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">Select your city</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-6">
          Choose a city to see movies playing near you. Search if your city is
          not in the first set of results.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
            {search
              ? `${pagination.totalItems} match${pagination.totalItems === 1 ? '' : 'es'}`
              : `${regions.length} of ${pagination.totalItems} cities shown`}
          </div>
        </div>
      </div>

      {regions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center mt-6">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {search ? 'No cities matched your search.' : 'No cities available.'}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                onClick={() => handleSelect(region)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors group bg-white dark:bg-gray-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium">
                      {capitalize(region.city_name)}
                    </span>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {region.city_code}
                    </span>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading more…' : 'Load more cities'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
