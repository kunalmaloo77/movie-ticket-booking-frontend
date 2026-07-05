import { useCallback, useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { del, get, post, put } from '../../api';
import Button from '../../components/Button';
import { useTheme } from '../../context/useTheme';
import { getSelectStyles } from '../../utils/selectStyles';
import { showError, showSuccess } from '../../utils/swal';
import { debounce } from '../../utils/utils';

const EMPTY_FORM = {
  movie_id: '',
  screen_id: '',
  start_time: '',
  language_id: '',
  category_prices: [],
};

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

function ShowSkeleton() {
  return (
    <div className="animate-pulse rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-3 h-4 w-36 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-4 h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function formatShowDateTime(value) {
  if (!value) return 'Schedule pending';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule pending';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function toDateTimeLocalValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function buildShowPayload(form) {
  return {
    movie_id: Number(form.movie_id),
    screen_id: Number(form.screen_id),
    start_time: form.start_time,
    language_id: form.language_id ? Number(form.language_id) : undefined,
    category_price: form.category_prices.map((category) => ({
      category_id: Number(category.category_id),
      price: Number(category.price),
    })),
  };
}

function normalizeCategoryPrices(prices = []) {
  return prices.map((item) => ({
    category_id: Number(item.category_id),
    price:
      item.price === null || item.price === undefined ? '' : String(item.price),
    category_name: item.category_name ?? '',
  }));
}

export default function Shows() {
  const { isDark } = useTheme();
  const selectStyles = getSelectStyles(isDark);

  const [form, setForm] = useState(EMPTY_FORM);
  const [shows, setShows] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);

  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);
  const [screensLoading, setScreensLoading] = useState(false);

  const [filterRegion, setFilterRegion] = useState(null);
  const [filterCinema, setFilterCinema] = useState(null);
  const [filterCinemas, setFilterCinemas] = useState([]);
  const [filterCinemasLoading, setFilterCinemasLoading] = useState(false);

  const isEditing = Boolean(editingShow);

  const loadLanguages = useCallback(async () => {
    try {
      const { data } = await get('/show/languages');
      setLanguages(
        Array.isArray(data)
          ? data.map((language) => ({
              value: language.id,
              label: language.name,
            }))
          : []
      );
    } catch (err) {
      showError(err.message, 'Could not load languages');
    }
  }, []);

  const loadShows = useCallback(async (page = 1, query = '', filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) {
        params.set('search', query);
      }
      if (filters.region_id) {
        params.set('region_id', String(filters.region_id));
      }
      if (filters.cinema_id) {
        params.set('cinema_id', String(filters.cinema_id));
      }

      const { data, pagination: pageInfo } = await get(`/show?${params}`);
      setShows(Array.isArray(data) ? data : []);
      setPagination({
        page: pageInfo?.page ?? page,
        totalPages: Math.max(pageInfo?.totalPages ?? 1, 1),
        totalItems: pageInfo?.totalItems ?? data?.length ?? 0,
      });
    } catch (err) {
      showError(err.message, 'Could not load shows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    loadShows(1, search, {
      region_id: filterRegion?.value,
      cinema_id: filterCinema?.value,
    });
  }, [loadShows, search, filterRegion, filterCinema]);

  const fetchRegions = useCallback(async (inputValue) => {
    try {
      const params = new URLSearchParams();
      if (inputValue?.trim()) {
        params.set('search', inputValue.trim());
      }
      const { data } = await get(
        `/region${params.toString() ? `?${params}` : ''}`
      );
      return Array.isArray(data)
        ? data.map((region) => ({
            value: region.id,
            label: region.city_name,
          }))
        : [];
    } catch (err) {
      console.error('Failed to fetch regions:', err);
      return [];
    }
  }, []);

  const fetchMovies = useCallback(async (inputValue) => {
    try {
      const params = new URLSearchParams();
      if (inputValue?.trim()) {
        params.set('q', inputValue.trim());
      }
      const { data } = await get(
        `/movie${params.toString() ? `?${params}` : ''}`
      );
      return Array.isArray(data)
        ? data.map((movie) => ({
            value: movie.id,
            label: movie.title,
          }))
        : [];
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      return [];
    }
  }, []);

  const debouncedFetchFilterRegions = useMemo(
    () => debounce(fetchRegions, 300),
    [fetchRegions]
  );

  const debouncedFetchSearchRegions = useMemo(
    () => debounce(fetchRegions, 300),
    [fetchRegions]
  );

  const debouncedFetchMovies = useMemo(
    () => debounce(fetchMovies, 300),
    [fetchMovies]
  );

  const fetchCinemas = useCallback(async (regionId, setter, loadingSetter) => {
    if (!regionId) {
      setter([]);
      return;
    }

    loadingSetter(true);
    try {
      const { data } = await get(`/cinema?region_id=${regionId}`);
      setter(
        Array.isArray(data)
          ? data.map((cinema) => ({
              value: cinema.id,
              label: cinema.cinema_name,
            }))
          : []
      );
    } catch (err) {
      setter([]);
      showError(err.message, 'Could not load cinemas');
    } finally {
      loadingSetter(false);
    }
  }, []);

  const fetchScreens = useCallback(async (cinemaId) => {
    if (!cinemaId) {
      setScreens([]);
      return;
    }

    setScreensLoading(true);
    try {
      const { data } = await get(`/screen/cinema/${cinemaId}`);
      setScreens(
        Array.isArray(data)
          ? data.map((screen) => ({
              value: screen.id,
              label: screen.name,
            }))
          : []
      );
    } catch (err) {
      setScreens([]);
      showError(err.message, 'Could not load screens');
    } finally {
      setScreensLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (screenId) => {
    if (!screenId) {
      setCategories([]);
      return;
    }

    try {
      const { data } = await get(`/seats/categories/screen/${screenId}`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
      showError(err.message, 'Could not load seat categories');
    }
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingShow(null);
    setSelectedMovie(null);
    setSelectedRegion(null);
    setSelectedCinema(null);
    setSelectedScreen(null);
    setCinemas([]);
    setScreens([]);
    setCategories([]);
  }

  async function handleRegionChange(option) {
    setSelectedRegion(option);
    setSelectedCinema(null);
    setSelectedScreen(null);
    setCinemas([]);
    setScreens([]);
    setCategories([]);
    setForm((prev) => ({
      ...prev,
      screen_id: '',
      category_prices: [],
    }));

    if (option?.value) {
      await fetchCinemas(option.value, setCinemas, setCinemasLoading);
    }
  }

  async function handleCinemaChange(option) {
    setSelectedCinema(option);
    setSelectedScreen(null);
    setScreens([]);
    setCategories([]);
    setForm((prev) => ({
      ...prev,
      screen_id: '',
      category_prices: [],
    }));

    if (option?.value) {
      await fetchScreens(option.value);
    }
  }

  async function handleScreenChange(option) {
    setSelectedScreen(option);
    setForm((prev) => ({
      ...prev,
      screen_id: option?.value ?? '',
      category_prices: [],
    }));

    if (option?.value) {
      await fetchCategories(option.value);
    } else {
      setCategories([]);
    }
  }

  function handleCategoryPriceChange(categoryId, value) {
    setForm((prev) => {
      const nextPrices = [...prev.category_prices];
      const index = nextPrices.findIndex(
        (category) => Number(category.category_id) === Number(categoryId)
      );

      if (index >= 0) {
        nextPrices[index] = {
          ...nextPrices[index],
          price: value,
        };
      } else {
        nextPrices.push({ category_id: Number(categoryId), price: value });
      }

      return { ...prev, category_prices: nextPrices };
    });
  }

  async function handleEdit(show) {
    setDeleteTarget(null);
    setEditingShow(show);
    setSelectedMovie({
      value: show.movie_id,
      label: show.movie_title,
    });

    const nextRegion = {
      value: show.region_id,
      label: show.region_name,
    };
    const nextCinema = {
      value: show.cinema_id,
      label: show.cinema_name,
    };
    const nextScreen = {
      value: show.screen_id,
      label: show.screen_name,
    };

    setSelectedRegion(nextRegion);
    setSelectedCinema(nextCinema);
    setSelectedScreen(nextScreen);

    await fetchCinemas(show.region_id, setCinemas, setCinemasLoading);
    await fetchScreens(show.cinema_id);
    await fetchCategories(show.screen_id);

    setForm({
      movie_id: String(show.movie_id),
      screen_id: String(show.screen_id),
      start_time: toDateTimeLocalValue(show.start_time),
      language_id: String(show.language_id),
      category_prices: normalizeCategoryPrices(show.category_prices),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = buildShowPayload(form);

    if (
      !payload.movie_id ||
      !payload.screen_id ||
      !payload.start_time ||
      payload.category_price.length === 0
    ) {
      showError('Fill in all show details before saving.', 'Missing details');
      return;
    }

    if (
      payload.category_price.some(
        (item) => Number.isNaN(item.price) || item.price <= 0
      )
    ) {
      showError(
        'Enter a valid price greater than zero for each seat category.',
        'Invalid pricing'
      );
      return;
    }

    setSaving(true);
    try {
      if (editingShow) {
        await put(`/show/${editingShow.id}`, payload);
      } else {
        await post('/show', payload);
      }

      const nextPage = editingShow ? pagination.page : 1;
      const action = editingShow ? 'updated' : 'created';

      resetForm();
      await loadShows(nextPage, search, {
        region_id: filterRegion?.value,
        cinema_id: filterCinema?.value,
      });

      showSuccess(
        `Show ${action} successfully.`,
        editingShow ? 'Show updated' : 'Show created'
      );
    } catch (err) {
      showError(
        err.message,
        editingShow ? 'Could not update show' : 'Could not create show'
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleting(true);

    try {
      await del(`/show/${target.id}`);
      setDeleteTarget(null);

      if (editingShow?.id === target.id) {
        resetForm();
      }

      const nextPage =
        shows.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadShows(nextPage, search, {
        region_id: filterRegion?.value,
        cinema_id: filterCinema?.value,
      });

      showSuccess('Show removed from the schedule.', 'Show deleted');
    } catch (err) {
      showError(err.message, 'Could not delete show');
    } finally {
      setDeleting(false);
    }
  }

  async function handleFilterRegionChange(option) {
    setFilterRegion(option);
    setFilterCinema(null);
    setFilterCinemas([]);

    if (option?.value) {
      await fetchCinemas(
        option.value,
        setFilterCinemas,
        setFilterCinemasLoading
      );
    }
  }

  const totalShows = pagination.totalItems;
  const visibleShows = shows.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Admin · Shows
            </p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              Manage shows
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Create schedules, revise timings, and manage seat pricing from one
              place without bouncing across separate admin flows.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatCard label="Shows" value={totalShows} />
            <StatCard label="Visible" value={visibleShows} />
            <StatCard label="Mode" value={isEditing ? 'Edit' : 'Create'} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Show scheduler
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditing ? 'Edit show' : 'Create a show'}
              </h2>
            </div>
            {isEditing && (
              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                Live edit
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Start with the movie, then narrow down region, cinema, and screen
            before setting language and seat pricing.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Movie
              </span>
              <AsyncSelect
                placeholder="Search movie"
                defaultOptions
                cacheOptions
                loadOptions={debouncedFetchMovies}
                value={selectedMovie}
                onChange={(option) => {
                  setSelectedMovie(option);
                  setForm((prev) => ({
                    ...prev,
                    movie_id: option?.value ? String(option.value) : '',
                  }));
                }}
                styles={selectStyles}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Region
              </span>
              <AsyncSelect
                placeholder="Search region"
                defaultOptions
                cacheOptions
                loadOptions={debouncedFetchSearchRegions}
                value={selectedRegion}
                onChange={handleRegionChange}
                styles={selectStyles}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cinema
              </span>
              <Select
                placeholder={
                  cinemasLoading ? 'Loading cinemas...' : 'Select cinema'
                }
                options={cinemas}
                value={selectedCinema}
                onChange={handleCinemaChange}
                isDisabled={!selectedRegion || cinemasLoading}
                styles={selectStyles}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Screen
              </span>
              <Select
                placeholder={
                  screensLoading ? 'Loading screens...' : 'Select screen'
                }
                options={screens}
                value={selectedScreen}
                onChange={handleScreenChange}
                isDisabled={!selectedCinema || screensLoading}
                styles={selectStyles}
              />
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start time
              </span>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    start_time: event.target.value,
                  }))
                }
                className={inputClass}
                required
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </span>
              <Select
                placeholder="Select language"
                options={languages}
                value={
                  languages.find(
                    (language) =>
                      String(language.value) === String(form.language_id)
                  ) ?? null
                }
                onChange={(option) =>
                  setForm((prev) => ({
                    ...prev,
                    language_id: option?.value ? String(option.value) : '',
                  }))
                }
                styles={selectStyles}
              />
            </div>

            {categories.length > 0 && (
              <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Seat category pricing
                </p>
                <div className="mt-3 space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={
                            form.category_prices.find(
                              (item) =>
                                Number(item.category_id) === Number(category.id)
                            )?.price ?? ''
                          }
                          onChange={(event) =>
                            handleCategoryPriceChange(
                              category.id,
                              event.target.value
                            )
                          }
                          className="w-full rounded border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-gray-600"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-300">
              <p className="font-medium">Scheduling note</p>
              <p>
                Overlapping shows on the same screen are blocked automatically.
                If a show already has bookings, moving it to another screen is
                blocked as well.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                fullWidth
                loading={saving}
                loadingText={isEditing ? 'Saving…' : 'Creating…'}
              >
                {isEditing ? 'Save changes' : 'Create show'}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Show library
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Search, update, or retire shows
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Filter by title, location, or screen to manage the active show
                  schedule without leaving this page.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  loadShows(pagination.page, search, {
                    region_id: filterRegion?.value,
                    cinema_id: filterCinema?.value,
                  })
                }
                disabled={loading}
              >
                Refresh list
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by movie, cinema, screen, or language"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
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

              <AsyncSelect
                placeholder="Filter region"
                defaultOptions
                cacheOptions
                loadOptions={debouncedFetchFilterRegions}
                value={filterRegion}
                onChange={handleFilterRegionChange}
                styles={selectStyles}
                isClearable
              />

              <Select
                placeholder={
                  filterCinemasLoading ? 'Loading cinemas...' : 'Filter cinema'
                }
                options={filterCinemas}
                value={filterCinema}
                onChange={setFilterCinema}
                isDisabled={!filterRegion || filterCinemasLoading}
                styles={selectStyles}
                isClearable
              />
            </div>
          </div>

          {deleteTarget && (
            <div className="mt-5 rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-4 text-sm text-red-900 dark:text-red-200">
              <p className="font-medium">
                Delete {deleteTarget.movie_title} at {deleteTarget.screen_name}?
              </p>
              <p className="mt-1 leading-6 text-red-800 dark:text-red-300">
                This removes the show schedule and seat inventory. If active
                bookings already exist, the delete request will be blocked.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setDeleteTarget(null)}
                >
                  Keep show
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  fullWidth
                  loading={deleting}
                  loadingText="Deleting…"
                  onClick={confirmDelete}
                >
                  Delete show
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                <ShowSkeleton />
                <ShowSkeleton />
                <ShowSkeleton />
              </div>
            ) : shows.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {search || filterRegion || filterCinema
                    ? 'No shows matched your filters.'
                    : 'No shows scheduled yet.'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {search || filterRegion || filterCinema
                    ? 'Try a different search term or clear one of the filters to browse the full show library.'
                    : 'Create your first show to publish a bookable schedule for a movie and screen.'}
                </p>
              </div>
            ) : (
              shows.map((show) => {
                const active = editingShow?.id === show.id;

                return (
                  <article
                    key={show.id}
                    className={`rounded border p-4 transition sm:p-5 ${
                      active
                        ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {show.movie_title}
                          </h3>
                          <span className="rounded bg-gray-900 dark:bg-gray-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white dark:text-gray-900">
                            {show.language_name}
                          </span>
                          {active && (
                            <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                              Editing now
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>
                            {show.region_name} · {show.cinema_name} ·{' '}
                            {show.screen_name}
                          </p>
                          <p>{formatShowDateTime(show.start_time)}</p>
                          <p>
                            {Array.isArray(show.category_prices) &&
                            show.category_prices.length > 0
                              ? show.category_prices
                                  .map(
                                    (category) =>
                                      `${category.category_name}: ₹${category.price}`
                                  )
                                  .join(' • ')
                              : 'Pricing not configured'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(show)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteTarget(show)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {pagination.totalPages > 1 && !loading && (
            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    loadShows(pagination.page - 1, search, {
                      region_id: filterRegion?.value,
                      cinema_id: filterCinema?.value,
                    })
                  }
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    loadShows(pagination.page + 1, search, {
                      region_id: filterRegion?.value,
                      cinema_id: filterCinema?.value,
                    })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
