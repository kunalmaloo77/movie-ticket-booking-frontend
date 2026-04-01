import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get } from '../api';
import { deleteCookie, getCookie, setCookie } from '../utils/cookie';
import { MovieGridSkeleton, ImageWithSkeleton } from '../components/Skeleton';

export default function ExplorePage() {
  const { city_name } = useParams();
  const navigate = useNavigate();

  const [region, setRegion] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loadingRegion, setLoadingRegion] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    setLoadingRegion(true);
    setRegion(null);
    setMovies([]);

    async function resolveRegion() {
      try {
        const cookie_region = getCookie('selected_region');
        if (cookie_region.city_name == city_name) {
          setRegion(cookie_region);
          return;
        }
        const { data } = await get('/region/' + city_name);
        if (data != null) {
          setRegion(data);
          setCookie('selected_region', data);
          navigate(`/explore/home/${city_name}`);
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

  // Fetch movies once region is known
  useEffect(() => {
    if (!region) return;

    setLoadingMovies(true);

    async function fetchMovies() {
      try {
        const { data } = await get(`/movie/region/${region.id}`);
        setMovies(data);
      } catch (error) {
        console.error(error);
        setMovies([]);
      } finally {
        setLoadingMovies(false);
      }
    }

    fetchMovies();
  }, [region]);

  const changeCity = () => {
    // Clear the selected region cookie and navigate back to home
    deleteCookie('selected_region');
    navigate('/');
  };

  if (loadingRegion) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <MovieGridSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Movies in {region.city_name}</h1>
        </div>
        <button
          onClick={changeCity}
          className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          Change city
        </button>
      </div>

      {loadingMovies && <MovieGridSkeleton />}

      {!loadingMovies && movies.length === 0 && (
        <p className="text-gray-400">No movies found for {region.city_name}.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {movies.map((m) => (
          <Link
            to={`/movies/${city_name}/${m.id}`}
            key={m.id || m.movie_name}
            className="border rounded overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <ImageWithSkeleton
              src={`https://image.tmdb.org/t/p/original${m.poster_image_url}`}
              alt={m.movie_name}
              className="w-full h-full object-cover"
              containerClassName="w-full h-56"
            />
            <div className="p-3">
              <h3 className="font-semibold text-sm truncate">{m.movie_name}</h3>
              <p className="text-xs text-gray-500 mt-1">Rating: {m.rating}</p>
              <p className="text-xs text-gray-400 mt-1">{m.genres}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
