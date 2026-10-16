import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { get, post } from '../../api';
import Button from '../../components/Button';
import MovieScreenSelectors from '../../components/admin/MovieScreenSelectors';
import { useShowScheduleSelectors } from '../../hooks/useShowScheduleSelectors';
import { useTheme } from '../../hooks/useTheme';
import {
  combineDateAndTimeSlots,
  generateDatesInRange,
  getCurrentMonthRange,
} from '../../utils/bulkShowDates';
import { getSelectStyles } from '../../utils/selectStyles';
import { showBulkResultSummary, showError } from '../../utils/swal_utils';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500';

const WEEKDAY_OPTIONS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

const DEFAULT_WEEKDAYS = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };

function formatDateLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function BulkAddShows() {
  const { isDark } = useTheme();
  const selectStyles = getSelectStyles(isDark);
  const navigate = useNavigate();

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
    handleRegionChange,
    handleCinemaChange,
    handleScreenChange,
  } = useShowScheduleSelectors();

  const defaultRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [weekdays, setWeekdays] = useState(DEFAULT_WEEKDAYS);
  const [timeSlots, setTimeSlots] = useState(['']);
  const [excludedDates, setExcludedDates] = useState(new Set());
  const [languageId, setLanguageId] = useState('');
  const [languages, setLanguages] = useState([]);
  const [categoryPrices, setCategoryPrices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    get('/show/languages')
      .then(({ data }) =>
        setLanguages(
          Array.isArray(data)
            ? data.map((language) => ({ value: language.id, label: language.name }))
            : []
        )
      )
      .catch((err) => showError(err.message, 'Could not load languages'));
  }, []);

  const allDates = useMemo(
    () => generateDatesInRange(startDate, endDate, weekdays),
    [startDate, endDate, weekdays]
  );

  useEffect(() => {
    setExcludedDates(new Set());
  }, [startDate, endDate, weekdays]);

  const includedDates = useMemo(
    () => allDates.filter((date) => !excludedDates.has(date)),
    [allDates, excludedDates]
  );

  const validTimeSlots = useMemo(
    () => [...new Set(timeSlots.filter(Boolean))].sort(),
    [timeSlots]
  );

  const finalStartTimes = useMemo(
    () => combineDateAndTimeSlots(includedDates, validTimeSlots),
    [includedDates, validTimeSlots]
  );

  function toggleDateExcluded(date) {
    setExcludedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  function toggleWeekday(day) {
    setWeekdays((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  function handleTimeSlotChange(index, value) {
    setTimeSlots((prev) => prev.map((slot, i) => (i === index ? value : slot)));
  }

  function addTimeSlot() {
    setTimeSlots((prev) => [...prev, '']);
  }

  function removeTimeSlot(index) {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCategoryPriceChange(categoryId, value) {
    setCategoryPrices((prev) => {
      const next = [...prev];
      const index = next.findIndex(
        (item) => Number(item.category_id) === Number(categoryId)
      );
      if (index >= 0) {
        next[index] = { ...next[index], price: value };
      } else {
        next.push({ category_id: Number(categoryId), price: value });
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedMovie?.value || !selectedScreen?.value) {
      showError('Pick a movie and screen before creating shows.', 'Missing details');
      return;
    }

    if (categories.length === 0 || categoryPrices.length < categories.length) {
      showError('Set a price for every seat category.', 'Missing pricing');
      return;
    }

    if (
      categoryPrices.some((item) => Number.isNaN(Number(item.price)) || Number(item.price) <= 0)
    ) {
      showError(
        'Enter a valid price greater than zero for each seat category.',
        'Invalid pricing'
      );
      return;
    }

    if (finalStartTimes.length === 0) {
      showError('Add at least one date and time slot.', 'Nothing to create');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        movie_id: Number(selectedMovie.value),
        screen_id: Number(selectedScreen.value),
        language_id: languageId ? Number(languageId) : undefined,
        category_price: categoryPrices.map((item) => ({
          category_id: Number(item.category_id),
          price: Number(item.price),
        })),
        start_times: finalStartTimes,
      };

      const { data } = await post('/show/bulk', payload);
      await showBulkResultSummary(data);
      if (data.created_count > 0) {
        navigate('/admin/shows');
      }
    } catch (err) {
      showError(err.message, 'Could not create shows');
    } finally {
      setSubmitting(false);
    }
  }

  function handleMovieChange(option) {
    setSelectedMovie(option);
  }

  const canSubmit =
    Boolean(selectedMovie?.value) &&
    Boolean(selectedScreen?.value) &&
    categories.length > 0 &&
    finalStartTimes.length > 0 &&
    !submitting;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          Admin · Shows
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
          Bulk add shows
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
          Pick a movie and screen, describe a date range and daily showtimes, and
          create every show in one go. Conflicting slots are skipped, not blocking
          the rest of the batch.
        </p>
        <Link
          to="/admin/shows"
          className="mt-3 inline-block text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          ← Back to show list
        </Link>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Movie & screen
          </h2>
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

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Language
            </span>
            <Select
              placeholder="Select language"
              options={languages}
              value={languages.find((l) => String(l.value) === String(languageId)) ?? null}
              onChange={(option) => setLanguageId(option?.value ? String(option.value) : '')}
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
                          categoryPrices.find(
                            (item) => Number(item.category_id) === Number(category.id)
                          )?.price ?? ''
                        }
                        onChange={(event) =>
                          handleCategoryPriceChange(category.id, event.target.value)
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
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Date range & days of week
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start date
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End date
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Days of week
            </span>
            <div className="flex flex-wrap gap-3">
              {WEEKDAY_OPTIONS.map(({ day, label }) => (
                <label
                  key={day}
                  className="flex items-center gap-2 rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(weekdays[day])}
                    onChange={() => toggleWeekday(day)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Showtimes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These times apply to every selected date.
          </p>
          <div className="space-y-3">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="time"
                  value={slot}
                  onChange={(event) => handleTimeSlotChange(index, event.target.value)}
                  className={inputClass}
                />
                {timeSlots.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
            + Add another time
          </Button>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Preview
            </h2>
            <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400">
              {finalStartTimes.length} shows will be created
            </span>
          </div>

          {allDates.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No dates match the selected range and days of week.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {allDates.map((date) => {
                const included = !excludedDates.has(date);
                return (
                  <label
                    key={date}
                    className="flex items-start gap-3 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleDateExcluded(date)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {formatDateLabel(date)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {validTimeSlots.length > 0
                          ? validTimeSlots.join(', ')
                          : 'No time slots added yet'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            loadingText="Creating shows…"
            disabled={!canSubmit}
          >
            Create shows
          </Button>
          <Link to="/admin/shows" className="w-full sm:w-auto">
            <Button type="button" variant="outline" fullWidth>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
