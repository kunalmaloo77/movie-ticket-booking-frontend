import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import { getCookie } from '../utils/cookie';
import { toSlug } from '../utils/utils';
import { Search } from 'lucide-react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setMovies([]);
      setCinemas([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const [movieRes, cinemaRes] = await Promise.all([
          get(`/movie?search=${encodeURIComponent(query.trim())}`),
          get(`/cinema/search?q=${encodeURIComponent(query.trim())}`),
        ]);
        setMovies(movieRes.data?.slice(0, 5) || []);
        setCinemas(cinemaRes.data?.slice(0, 5) || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const region = getCookie('selected_region');
  const cityName = region?.city_name;
  const hasResults = movies.length > 0 || cinemas.length > 0;

  function handleSelect() {
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasResults && setOpen(true)}
          placeholder="Search movies, cinemas..."
          className="bg-gray-800 text-white text-sm rounded pl-8 pr-3 py-1.5 w-40 sm:w-56 md:w-72 lg:w-80 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-40 sm:w-56 md:w-72 lg:w-80 bg-white rounded shadow-lg border z-50 max-h-96 overflow-y-auto text-gray-900">
          {loading && (
            <p className="text-xs text-gray-400 px-3 py-2">Searching...</p>
          )}

          {!loading && !hasResults && (
            <p className="text-xs text-gray-400 px-3 py-2">No results found.</p>
          )}

          {!loading && movies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-1.5 bg-gray-50 border-b">
                Movies
              </p>
              {movies.map((movie) =>
                cityName ? (
                  <Link
                    key={movie.id}
                    to={`/movies/${cityName}/${toSlug(movie.title)}/${movie.id}`}
                    onClick={handleSelect}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {movie.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Rating: {movie.rating}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={movie.id}
                    className="flex items-center gap-3 px-3 py-2 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {movie.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Rating: {movie.rating}
                      </p>
                      <p className="text-xs text-gray-400">
                        Select a city to book
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {!loading && cinemas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-1.5 bg-gray-50 border-b border-t">
                Cinemas
              </p>
              {cinemas.map((cinema) => (
                <div
                  key={cinema.id}
                  className="px-3 py-2 hover:bg-gray-50 border-b last:border-0"
                >
                  <p className="text-sm font-medium">{cinema.cinema_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {cinema.address} &middot; {cinema.city_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
