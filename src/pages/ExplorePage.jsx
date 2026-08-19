import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get } from '../api';
import { setCookie } from '../utils/cookie';
import { MovieSliderSkeleton, ImageWithSkeleton } from '../components/Skeleton';
import { capitalize, toSlug } from '../utils/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegion } from '../hooks/useRegion';
import CitySelectorModal from '../components/CitySelectorModal';

export default function ExplorePage() {
  const { city_name } = useParams();
  const navigate = useNavigate();
  const { loadingRegion, loadRegion, region } = useRegion();
  // const [region, setRegion] = useState(null);
  const [movies, setMovies] = useState([]);
  // const [loadingRegion, setLoadingRegion] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const sliderRef = useRef(null);

  const checkScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    loadRegion(city_name);
  }, [city_name]);

  useEffect(() => {
    if (!region) return;

    setLoadingMovies(true);

    async function fetchMovies() {
      try {
        const { data } = await get(`/movie/region/${region?.id}`);
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

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [movies, checkScroll]);

  const scroll = (dir) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  const changeCity = () => {
    setCityModalOpen(true);
  };

  const handleCitySelect = (region) => {
    setCookie('selected_region', region);
    setCityModalOpen(false);
    navigate(`/explore/home/${region.city_name}`);
  };

  if (loadingRegion) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <MovieSliderSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Movies in {capitalize(region?.city_name)}
          </h1>
        </div>
        <button
          onClick={changeCity}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {capitalize(region?.city_name)}
        </button>
      </div>

      {loadingMovies && <MovieSliderSkeleton />}

      {!loadingMovies && movies.length === 0 && (
        <p className="text-gray-400">
          No movies found for {capitalize(region?.city_name)}.
        </p>
      )}

      {!loadingMovies && movies.length > 0 && (
        <div>
          <div className="relative">
            {canScrollLeft && (
              <button
                onClick={() => scroll(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {movies.map((m) => (
                <Link
                  to={`/movies/${city_name}/${toSlug(m.title)}/${m.id}`}
                  key={m.id}
                  className="flex-shrink-0 w-52 border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <ImageWithSkeleton
                    src={`https://image.tmdb.org/t/p/original${m.poster_image_url}`}
                    alt={m.title}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-72"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">
                      {m.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      &#9733; {m.rating}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {m.genres}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {canScrollRight && (
              <button
                onClick={() => scroll(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              to={`/explore/movies/${city_name}`}
              className="inline-block border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              See more movies &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
