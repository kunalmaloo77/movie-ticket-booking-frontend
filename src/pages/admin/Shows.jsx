import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { del, get, post, put } from '../../api';
import Button from '../../components/Button';
import MovieScreenSelectors from '../../components/admin/MovieScreenSelectors';
import { useShowScheduleSelectors } from '../../hooks/useShowScheduleSelectors';
import { useTheme } from '../../hooks/useTheme';
import { getSelectStyles } from '../../utils/selectStyles';
import { showError, showSuccess } from '../../utils/swal_utils';
import { convertMinutes, debounce } from '../../utils/utils';

const EMPTY_FORM = {
  movie_id: '',
  screen_id: '',
  start_time: '',
  language_id: '',
  category_prices: [],
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FILTER_REGION_STORAGE_KEY = 'admin_shows_filter_region';

function loadStoredFilterRegion() {
  try {
    const stored = JSON.parse(localStorage.getItem(FILTER_REGION_STORAGE_KEY));
    return stored?.value && stored?.label ? stored : null;
  } catch {
    return null;
  }
}

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

function formatShowTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
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

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const selectors = useShowScheduleSelectors();
  const {
    selectedMovie,
    setSelectedMovie,
    selectedRegion,
    selectedCinema,
    selectedScreen,
    cinemas,
    screens,
    categories,
    cinemasLoading,
    screensLoading,
    debouncedFetchMovies,
    debouncedFetchRegions,
    fetchRegions,
    fetchCinemas,
    resetSelectors,
    loadSelectorsForShow,
  } = selectors;

  const [filterRegion, setFilterRegion] = useState(loadStoredFilterRegion);
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

  const loadShows = useCallback(async (month, query = '', filters = {}) => {
    setLoading(true);
    try {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const params = new URLSearchParams({
        date_from: monthStart.toISOString(),
        date_to: monthEnd.toISOString(),
      });
      if (query) {
        params.set('search', query);
      }
      if (filters.region_id) {
        params.set('region_id', String(filters.region_id));
      }
      if (filters.cinema_id) {
        params.set('cinema_id', String(filters.cinema_id));
      }

      const { data } = await get(`/show?${params}`);
      setShows(Array.isArray(data) ? data : []);
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
    if (filterRegion?.value) {
      fetchCinemas(filterRegion.value, setFilterCinemas, setFilterCinemasLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    loadShows(visibleMonth, search, {
      region_id: filterRegion?.value,
      cinema_id: filterCinema?.value,
    });
  }, [loadShows, visibleMonth, search, filterRegion, filterCinema]);

  const debouncedFetchFilterRegions = useMemo(
    () => debounce(fetchRegions, 300),
    [fetchRegions]
  );

  const showsByDate = useMemo(() => {
    const map = new Map();
    shows.forEach((show) => {
      const key = dateKey(show.start_time);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(show);
    });
    map.forEach((dayShows) =>
      dayShows.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    );
    return map;
  }, [shows]);

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const cellDate = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index
      );
      return {
        date: cellDate,
        key: dateKey(cellDate),
        inCurrentMonth: cellDate.getMonth() === month,
        isToday: dateKey(cellDate) === dateKey(new Date()),
      };
    });
  }, [visibleMonth]);

  const selectedDayShows = selectedDateKey
    ? showsByDate.get(selectedDateKey) ?? []
    : [];
  const selectedDate = selectedDateKey
    ? calendarCells.find((cell) => cell.key === selectedDateKey)?.date
    : null;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingShow(null);
    resetSelectors();
  }

  async function handleRegionChange(option) {
    setForm((prev) => ({
      ...prev,
      screen_id: '',
      category_prices: [],
    }));
    await selectors.handleRegionChange(option);
  }

  async function handleCinemaChange(option) {
    setForm((prev) => ({
      ...prev,
      screen_id: '',
      category_prices: [],
    }));
    await selectors.handleCinemaChange(option);
  }

  async function handleScreenChange(option) {
    setForm((prev) => ({
      ...prev,
      screen_id: option?.value ?? '',
      category_prices: [],
    }));
    await selectors.handleScreenChange(option);
  }

  function handleMovieChange(option) {
    setSelectedMovie(option);
    setForm((prev) => ({
      ...prev,
      movie_id: option?.value ? String(option.value) : '',
    }));
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
    setSelectedDateKey(null);
    setEditingShow(show);

    await loadSelectorsForShow(show);

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

      const action = editingShow ? 'updated' : 'created';
      const showDate = new Date(payload.start_time);
      const targetMonth = Number.isNaN(showDate.getTime())
        ? visibleMonth
        : new Date(showDate.getFullYear(), showDate.getMonth(), 1);

      resetForm();
      setVisibleMonth(targetMonth);
      await loadShows(targetMonth, search, {
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

      await loadShows(visibleMonth, search, {
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

    try {
      if (option?.value) {
        localStorage.setItem(FILTER_REGION_STORAGE_KEY, JSON.stringify(option));
      } else {
        localStorage.removeItem(FILTER_REGION_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors (e.g. private browsing)
    }

    if (option?.value) {
      await fetchCinemas(
        option.value,
        setFilterCinemas,
        setFilterCinemasLoading
      );
    }
  }

  function goToMonth(offset) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToToday() {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  const monthLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const totalShows = shows.length;

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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <StatCard label={`Shows in ${monthLabel}`} value={totalShows} />
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

          <Link
            to="/admin/shows/bulk"
            className="mt-3 inline-block text-sm font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Bulk add shows for a date range →
          </Link>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <MovieScreenSelectors
              selectStyles={selectStyles}
              selectedMovie={selectedMovie}
              onMovieChange={handleMovieChange}
              debouncedFetchMovies={debouncedFetchMovies}
              selectedRegion={selectedRegion}
              onRegionChange={handleRegionChange}
              debouncedFetchRegions={debouncedFetchRegions}
              selectedCinema={selectedCinema}
              onCinemaChange={handleCinemaChange}
              cinemas={cinemas}
              cinemasLoading={cinemasLoading}
              selectedScreen={selectedScreen}
              onScreenChange={handleScreenChange}
              screens={screens}
              screensLoading={screensLoading}
            />

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
                  Show calendar
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Browse, edit, or retire shows by date
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Click a date to see every show scheduled that day and manage
                  it from there.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  loadShows(visibleMonth, search, {
                    region_id: filterRegion?.value,
                    cinema_id: filterCinema?.value,
                  })
                }
                disabled={loading}
              >
                Refresh
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

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="rounded border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="rounded border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
              <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {monthLabel}
              </h3>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded border border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-800 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="bg-gray-50 dark:bg-gray-900/60 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b border-x border-b border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-800">
            {calendarCells.map((cell) => {
              const dayShows = showsByDate.get(cell.key) ?? [];
              const visibleDayShows = dayShows.slice(0, 3);
              const extraCount = dayShows.length - visibleDayShows.length;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.key)}
                  className={`flex min-h-[92px] flex-col items-stretch gap-1 p-1.5 text-left transition sm:min-h-[108px] ${
                    cell.inCurrentMonth
                      ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      : 'bg-gray-50 dark:bg-gray-900/40 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <span
                    className={`self-start rounded-full px-1.5 text-xs font-medium ${
                      cell.isToday
                        ? 'bg-red-600 text-white'
                        : cell.inCurrentMonth
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>

                  {loading ? (
                    <span className="mt-1 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  ) : (
                    <div className="flex flex-1 flex-col gap-1">
                      {visibleDayShows.map((show) => (
                        <span
                          key={show.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            editingShow?.id === show.id
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {formatShowTime(show.start_time)} · {show.movie_title}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {selectedDateKey && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-10 sm:p-6">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-800 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Shows on
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedDate &&
                    new Intl.DateTimeFormat('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(selectedDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDateKey(null);
                  setDeleteTarget(null);
                }}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
              {selectedDayShows.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    No shows scheduled on this date.
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Use the scheduler on the left to create one — the start
                    time will default to this day.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayShows.map((show) => {
                    const active = editingShow?.id === show.id;
                    const confirmingDelete = deleteTarget?.id === show.id;

                    return (
                      <article
                        key={show.id}
                        className={`rounded border p-4 transition ${
                          active
                            ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {show.movie_title}
                          </h3>
                          <span className="rounded bg-gray-900 dark:bg-gray-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-white dark:text-gray-900">
                            {show.language_name}
                          </span>
                          <span className="rounded bg-gray-900 dark:bg-gray-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-white dark:text-gray-900">
                            {convertMinutes(show.movie_runtime).formatted}
                          </span>
                          {active && (
                            <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                              Editing now
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
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

                        {confirmingDelete ? (
                          <div className="mt-3 rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-3 text-sm text-red-900 dark:text-red-200">
                            <p className="leading-5">
                              Delete this show and its seat inventory? Blocked
                              if active bookings exist.
                            </p>
                            <div className="mt-3 flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                fullWidth
                                onClick={() => setDeleteTarget(null)}
                              >
                                Keep show
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                fullWidth
                                loading={deleting}
                                loadingText="Deleting…"
                                onClick={confirmDelete}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex gap-2">
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
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
