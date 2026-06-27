import { useState, useMemo, useEffect } from 'react';
import { get, post } from '../../api';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { debounce } from '../../utils/cookie';
import { useTheme } from '../../context/useTheme';
import { getSelectStyles } from '../../utils/selectStyles';
import Button from '../../components/Button';
import { showSuccess, showError } from '../../utils/swal';

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500";

export default function Shows() {
  const { isDark } = useTheme();
  const selectStyles = getSelectStyles(isDark);

  const [form, setForm] = useState({
    movie_id: '',
    screen_id: '',
    start_time: '',
    language_id: '',
    category_prices: [],
  });
  const [movies, setMovies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [screens, setScreens] = useState(null);
  const [screensLoading, setScreensLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    get('/show/languages')
      .then(({ data }) =>
        setLanguages(data.map((l) => ({ value: l.id, label: l.name })))
      )
      .catch((err) => console.error('Failed to fetch languages:', err));
  }, []);

  const fetchCategories = async (screen_id) => {
    try {
      const { data } = await get('/seats/categories/screen/' + screen_id);
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch seat categories:', err);
    }
  };

  const fetchRegions = async (inputValue, callback) => {
    try {
      const { data } = await get(
        '/region' + (inputValue && `?search=${inputValue}`)
      );
      callback(data.map((r) => ({ value: r.id, label: r.city_name })));
    } catch (err) {
      console.error('Failed to fetch regions:', err);
      callback([]);
    }
  };

  const debouncedFetchRegions = useMemo(() => debounce(fetchRegions, 300), []);

  async function fetchMovies(inputValue, callback) {
    try {
      const { data } = await get(
        '/movie' + (inputValue && `?search=${inputValue}`)
      );
      const options = data.map((m) => ({
        value: m.id,
        label: m.title,
        source: m.source,
      }));
      setMovies(options);
      callback(options);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      callback([]);
    }
  }

  const debouncedFetchMovies = useMemo(() => debounce(fetchMovies, 300), []);

  async function handleRegionChange(selected) {
    setSelectedRegion(selected);
    setCinemas([]);
    setScreens(null);
    setSelectedCinema(null);
    if (!selected) return;
    setCinemasLoading(true);
    try {
      const { data } = await get(`/cinema/search?region_id=${selected.value}`);
      setCinemas(data.map((c) => ({ value: c.id, label: c.cinema_name })));
    } catch (err) {
      console.error('Failed to fetch cinemas:', err);
    } finally {
      setCinemasLoading(false);
    }
  }

  async function handleCinemaChange(selected) {
    setSelectedCinema(selected);
    setScreens(null);
    setForm((prev) => ({ ...prev, screen_id: '' }));
    setScreensLoading(true);
    try {
      const { data } = await get(`/screen/cinema/${selected.value}`);
      setScreens(data.map((s) => ({ value: s.id, label: s.name })));
    } catch (err) {
      console.error('Failed to fetch screens:', err);
    } finally {
      setScreensLoading(false);
    }
  }

  function handleCategoryPriceChange(categoryId, value) {
    const id = Number(categoryId);
    const price = Number(value);
    setForm((prev) => {
      const category_prices = prev.category_prices || [];
      const exists = category_prices.find((c) => c.category_id === id);
      return {
        ...prev,
        category_prices: exists
          ? category_prices.map((c) =>
              c.category_id === id ? { ...c, price } : c
            )
          : [...category_prices, { category_id: id, price }],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const category_price = form.category_prices.map((c) => ({
      category_id: c.category_id,
      price: parseFloat(c.price),
    }));

    if (category_price.some((c) => isNaN(c.price) || c.price <= 0)) {
      showError(
        'Please enter a valid price for all seat categories.',
        'Invalid input'
      );
      return;
    }

    setLoading(true);
    try {
      const body = {
        movie_id: parseInt(form.movie_id),
        screen_id: parseInt(form.screen_id),
        start_time: form.start_time,
        language_id: form.language_id ? parseInt(form.language_id) : undefined,
        category_price,
      };
      const { data } = await post('/show', body);
      setForm({
        movie_id: '',
        screen_id: '',
        start_time: '',
        language_id: '',
        category_prices: [],
      });
      setSelectedRegion(null);
      setSelectedCinema(null);
      setCinemas([]);
      setScreens(null);
      showSuccess(`Show created (id: ${data.id}) on ${data.start_time}`);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleScreenChange = (selected) => {
    setForm((prev) => ({ ...prev, screen_id: selected ? selected.value : '' }));
    if (selected) {
      fetchCategories(selected.value);
    } else {
      setCategories([]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Create Show</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AsyncSelect
          placeholder="Select Movie"
          defaultOptions
          loadOptions={debouncedFetchMovies}
          value={movies.find((m) => m.value === form.movie_id) || null}
          onChange={(selected) =>
            setForm((prev) => ({ ...prev, movie_id: selected?.value ?? '' }))
          }
          styles={selectStyles}
        />

        <AsyncSelect
          placeholder="Select Region"
          defaultOptions
          loadOptions={debouncedFetchRegions}
          value={selectedRegion}
          onChange={handleRegionChange}
          styles={selectStyles}
        />

        <Select
          placeholder={cinemasLoading ? 'Loading cinemas...' : 'Select Cinema'}
          options={cinemas}
          value={selectedCinema}
          onChange={handleCinemaChange}
          isDisabled={!selectedRegion || cinemasLoading}
          styles={selectStyles}
          required
        />

        <Select
          placeholder={screensLoading ? 'Loading screens...' : 'Select Screen'}
          options={screens}
          value={
            screens
              ? (screens.find((s) => s.value === form.screen_id) ?? null)
              : null
          }
          onChange={handleScreenChange}
          isDisabled={!selectedCinema || screensLoading}
          styles={selectStyles}
          required
        />

        <input
          type="datetime-local"
          name="start_time"
          value={form.start_time}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, start_time: e.target.value }))
          }
          className={inputClass}
          required
        />
        <Select
          placeholder={screensLoading ? 'Loading screens...' : 'Select Screen'}
          options={languages}
          value={
            screens
              ? (screens.find((s) => s.value === form.screen_id) ?? null)
              : null
          }
          onChange={handleScreenChange}
          isDisabled={!selectedCinema || screensLoading}
          styles={selectStyles}
          required
        />
        <Select
          placeholder="Select Language"
          options={languages}
          value={
            languages.find((l) => l.value === form.language_id) ?? null
          }
          onChange={(selected) =>
            setForm((prev) => ({ ...prev, language_id: selected?.value ?? '' }))
          }
          styles={selectStyles}
        />

        {categories.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Price per Seat Category
            </p>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{cat.description}</p>
                  )}
                </div>
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      form.category_prices.find((c) => c.category_id === cat.id)
                        ?.price || ''
                    }
                    onChange={(e) =>
                      handleCategoryPriceChange(cat.id, e.target.value)
                    }
                    className={`w-full border border-gray-300 dark:border-gray-600 rounded pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600`}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} loadingText="Creating…">
          Create Show
        </Button>
      </form>
    </div>
  );
}
