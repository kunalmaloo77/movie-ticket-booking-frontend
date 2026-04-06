import { useState, useMemo } from 'react';
import { get, post } from '../../api';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { debounce } from '../../utils/cookie';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.25rem',
    borderColor: '#000000',
    paddingTop: '0.175rem',
    paddingBottom: '0.175rem',
    boxShadow: state.isFocused ? '0 0 0 2px #d1d5db' : base.boxShadow,
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0.175rem 0.75rem',
  }),
};

export default function Shows() {
  const [form, setForm] = useState({
    movie_id: '',
    screen_id: '',
    start_time: '',
    language: '',
    category_prices: [],
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [movies, setMovies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [screens, setScreens] = useState(null);
  const [screensLoading, setScreensLoading] = useState(false);
  const [categories, setCategories] = useState([]);

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
    setMsg('');
    setError('');

    console.log('Submitting form with data:', form);

    const category_price = form.category_prices.map((c) => ({
      category_id: c.category_id,
      price: parseFloat(c.price),
    }));

    if (category_price.some((c) => isNaN(c.price) || c.price <= 0)) {
      setError('Please enter a valid price for all seat categories.');
      return;
    }

    try {
      const body = {
        movie_id: parseInt(form.movie_id),
        screen_id: parseInt(form.screen_id),
        start_time: form.start_time,
        language: form.language,
        category_price,
      };
      const { data } = await post('/show', body);
      setMsg(`Show created (id: ${data.id}) on ${data.start_time}`);
      setForm({
        movie_id: '',
        screen_id: '',
        start_time: '',
        language: '',
        category_prices: [],
      });
      setSelectedRegion(null);
      setSelectedCinema(null);
      setCinemas([]);
      setScreens(null);
    } catch (err) {
      setError(err.message);
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
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

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
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />

        <input
          type="text"
          name="language"
          placeholder="Language (e.g. English, Hindi)"
          value={form.language}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, language: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />

        {categories.length > 0 && (
          <div className="border rounded p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Price per Seat Category
            </p>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-gray-400">{cat.description}</p>
                  )}
                </div>
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
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
                    className="w-full border rounded pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 cursor-pointer"
        >
          Create Show
        </button>
      </form>
    </div>
  );
}
