import { useCallback, useEffect, useState } from 'react';
import { get, post } from '../../api';
import Button from '../../components/Button';
import { showSuccess, showError } from '../../utils/swal_utils';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500';

function StatCard({ label, value }) {
  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

function CinemaSkeleton() {
  return (
    <div className="animate-pulse rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-3 h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-4 h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default function Cinemas() {
  const [cinemaName, setCinemaName] = useState('');
  const [address, setAddress] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCinemas = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);

      const { data } = await get(`/cinema?${params}`);
      setCinemas(Array.isArray(data) ? data : []);
    } catch (err) {
      showError(err.message, 'Could not load cinemas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCities = useCallback(async () => {
    setCitiesLoading(true);
    try {
      const { data } = await get('/region?limit=1000');
      setCities(Array.isArray(data) ? data : []);
    } catch (err) {
      showError(err.message, 'Could not load cities');
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    loadCinemas(search);
  }, [loadCinemas, search]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await post('/cinema/', {
        cinema_name: cinemaName,
        address,
        city_code: cityCode,
      });
      setCinemaName('');
      setAddress('');
      setCityCode('');
      await loadCinemas(search);
      showSuccess(
        `Cinema created: ${data.cinema_name} (code: ${data.cinema_code})`
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Admin · Cinemas
            </p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              Manage cinemas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Create new theatres and search existing listings by city, name, or code.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatCard label="Cinemas" value={cinemas.length} />
            <StatCard label="Search" value={search ? 'Live' : 'All'} />
            <StatCard label="City" value={search || 'Any'} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 xl:sticky xl:top-6 xl:self-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cinema registry
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add a new cinema
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Select a city from the regions list, then add the theatre name and address.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cinema name
              </span>
              <input
                type="text"
                placeholder="PVR Orion"
                value={cinemaName}
                onChange={(e) => setCinemaName(e.target.value)}
                className={inputClass}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </span>
              <input
                type="text"
                placeholder="MG Road, Bengaluru"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </span>
              <select
                value={cityCode}
                onChange={(e) => setCityCode(e.target.value)}
                className={inputClass}
                disabled={citiesLoading || cities.length === 0}
                required
              >
                <option value="" disabled>
                  {citiesLoading
                    ? 'Loading cities…'
                    : cities.length === 0
                    ? 'No cities available — add one in Regions'
                    : 'Select a city'}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.city_code}>
                    {city.city_name} ({city.city_code})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-300">
              <p className="font-medium">City lookup</p>
              <p>Search by a city name or code below to see theatres already mapped to that region.</p>
            </div>

            <Button type="submit" fullWidth loading={saving} loadingText="Creating…">
              Create cinema
            </Button>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Cinema library
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Search existing cinemas
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Filter by city name, city code, or cinema name to find the right screen list.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => loadCinemas(search)} disabled={loading}>
              Refresh list
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by city or cinema name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={inputClass}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              {search ? `Showing results for "${search}"` : 'Showing all cinemas'}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                <CinemaSkeleton />
                <CinemaSkeleton />
                <CinemaSkeleton />
              </div>
            ) : cinemas.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {search ? 'No cinemas matched your search.' : 'No cinemas yet.'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {search
                    ? 'Try a different city or cinema name, or clear the search to browse all theatres.'
                    : 'Create your first cinema to start linking screens and show schedules.'}
                </p>
                {search && (
                  <Button type="button" variant="outline" className="mt-5" onClick={() => setSearchInput('')}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              cinemas.map((cinema) => (
                <article key={cinema.cinema_id ?? cinema.id} className="rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {cinema.cinema_name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">
                          {cinema.cinema_code}
                        </span>
                        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">
                          {cinema.city_name || cinema.city_code || 'Unknown city'}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>{cinema.address}</p>
                    <p>
                      City: <span className="font-medium text-gray-800 dark:text-gray-200">{cinema.city_name || cinema.city_code || 'Not linked'}</span>
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
