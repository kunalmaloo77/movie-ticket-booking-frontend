import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { get } from '../api';
import { getCookie, setCookie } from '../utils/cookie';
import { MovieGridSkeleton, ImageWithSkeleton } from '../components/Skeleton';
import { toSlug, capitalize } from '../utils/utils';

export default function MoviesPage() {
  const { city_name } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [region, setRegion] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ languages: [], genres: [], screen_types: [] });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingRegion, setLoadingRegion] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const language = searchParams.get('language') || '';
  const genre_id = searchParams.get('genre_id') || '';
  const screen_type_id = searchParams.get('screen_type_id') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    setLoadingRegion(true);

    async function resolveRegion() {
      try {
        const cookie_region = getCookie('selected_region');
        if (cookie_region?.city_name === city_name) {
          setRegion(cookie_region);
          return;
        }
        const { data } = await get('/region/' + city_name);
        if (data != null) {
          setRegion(data);
          setCookie('selected_region', data);
          return;
        }
        navigate(-1);
      } catch (error) {
        console.error(error);
        navigate(-1);
      } finally {
        setLoadingRegion(false);
      }
    }

    resolveRegion();
  }, [city_name]);

  useEffect(() => {
    if (!region) return;

    setLoadingOptions(true);
    get(`/movie/region/${region.id}/options`)
      .then(({ data }) => setFilterOptions(data))
      .catch(console.error)
      .finally(() => setLoadingOptions(false));
  }, [region]);

  useEffect(() => {
    if (!region) return;

    setLoadingMovies(true);

    const params = new URLSearchParams();
    params.set('page', page);
    if (language) params.set('language', language);
    if (genre_id) params.set('genre_id', genre_id);
    if (screen_type_id) params.set('screen_type_id', screen_type_id);

    get(`/movie/region/${region.id}/filtered?${params.toString()}`)
      .then(({ data, pagination: p }) => {
        setMovies(data);
        setPagination({ page: p.page, totalPages: p.totalPages, total: p.total });
      })
      .catch((err) => {
        console.error(err);
        setMovies([]);
      })
      .finally(() => setLoadingMovies(false));
  }, [region, language, genre_id, screen_type_id, page]);

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = language || genre_id || screen_type_id;

  if (loadingRegion) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <MovieGridSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => navigate(`/explore/home/${city_name}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Movies in {region.city_name}</h1>
        {!loadingMovies && (
          <span className="text-sm text-gray-400">{pagination.total} movies</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        {/* Language */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Language</label>
          <select
            value={language}
            onChange={(e) => setFilter('language', e.target.value)}
            disabled={loadingOptions}
            className="border rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="">All languages</option>
            {filterOptions.languages.map((l) => (
              <option key={l} value={l}>{capitalize(l)}</option>
            ))}
          </select>
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Genre</label>
          <select
            value={genre_id}
            onChange={(e) => setFilter('genre_id', e.target.value)}
            disabled={loadingOptions}
            className="border rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="">All genres</option>
            {filterOptions.genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Format</label>
          <select
            value={screen_type_id}
            onChange={(e) => setFilter('screen_type_id', e.target.value)}
            disabled={loadingOptions}
            className="border rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="">All formats</option>
            {filterOptions.screen_types.map((st) => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 border rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Movie grid */}
      {loadingMovies && <MovieGridSkeleton />}

      {!loadingMovies && movies.length === 0 && (
        <p className="text-gray-400">
          No movies found{hasActiveFilters ? ' for selected filters' : ''}.
        </p>
      )}

      {!loadingMovies && movies.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {movies.map((m) => (
              <Link
                to={`/movies/${city_name}/${toSlug(m.title)}/${m.id}`}
                key={m.id}
                className="border rounded overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <ImageWithSkeleton
                  src={`https://image.tmdb.org/t/p/original${m.poster_image_url}`}
                  alt={m.title}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-56"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">&#9733; {m.rating}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{m.genres}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setFilter('page', page - 1)}
                className="border rounded px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setFilter('page', page + 1)}
                className="border rounded px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
