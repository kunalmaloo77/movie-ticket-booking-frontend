import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get } from '../api';
import { deleteCookie, getCookie, setCookie } from '../utils/cookie';
import { MovieSliderSkeleton, ImageWithSkeleton } from '../components/Skeleton';
import { toSlug } from '../utils/utils';

const SLIDER_MAX = 10;

export default function ExplorePage() {
  const { city_name } = useParams();
  const navigate = useNavigate();

  const [region, setRegion] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loadingRegion, setLoadingRegion] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const sliderRef = useRef(null);

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

  useEffect(() => {
    if (!region) return;

    setLoadingMovies(true);

    async function fetchMovies() {
      try {
        const { data } = await get(`/movie/region/${region.id}`);
        setMovies(data.slice(0, SLIDER_MAX));
      } catch (error) {
        console.error(error);
        setMovies([]);
      } finally {
        setLoadingMovies(false);
      }
    }

    fetchMovies();
  }, [region]);

  const scroll = (dir) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const changeCity = () => {
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
        <MovieSliderSkeleton />
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

      {loadingMovies && <MovieSliderSkeleton />}

      {!loadingMovies && movies.length === 0 && (
        <p className="text-gray-400">No movies found for {region.city_name}.</p>
      )}

      {!loadingMovies && movies.length > 0 && (
        <div>
          <div className="relative">
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              &#8249;
            </button>

            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {movies.map((m) => (
                <Link
                  to={`/movies/${city_name}/${toSlug(m.title)}/${m.id}`}
                  key={m.id}
                  className="flex-shrink-0 w-40 border rounded overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
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

            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              &#8250;
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              to={`/explore/movies/${city_name}`}
              className="inline-block border rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              See more movies &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
