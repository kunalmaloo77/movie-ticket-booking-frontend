import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCookie, setCookie } from '../utils/cookie';
import { ChevronRight, MapPin } from 'lucide-react';
import CitySelectorModal from '../components/CitySelectorModal';
import { useRegion } from '../hooks/useRegion';
import { get } from '../api';
import { capitalize, toSlug } from '../utils/utils';
import { ImageWithSkeleton, MovieSliderSkeleton } from '../components/Skeleton';

export default function Home() {
  const navigate = useNavigate();
  const { city_name: cityNameFromUrl } = useParams();
  const { region, loadRegion } = useRegion();
  const [movies, setMovies] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [loadingMovies, setLoadingMovies] = useState(false);
  const cacheRegion = getCookie('selected_region');
  const [cityModalOpen, setCityModalOpen] = useState(
    !cityNameFromUrl && !cacheRegion
  );
  const sliderRef = useRef(null);

  useEffect(() => {
    const city_name = cityNameFromUrl || cacheRegion?.city_name;
    if (city_name) {
      loadRegion(city_name);
      redirect(city_name);
    }
    function redirect(city_name) {
      const target = `/explore/home/${city_name}`;
      if (location.pathname !== target) {
        navigate(`/explore/home/${city_name}`, { replace: true });
      }
    }
  }, [cacheRegion?.city_name, cityNameFromUrl]);

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

  const checkScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

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

  function handleSelect(region) {
    setCookie('selected_region', region);
    setCityModalOpen(false);
    navigate(`/explore/home/${region.city_name}`);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recommended Movies</h1>
        </div>
      </div>
      {loadingMovies && <MovieSliderSkeleton />}

      {!loadingMovies && movies.length === 0 && (
        <p className="text-gray-400">
          No movies found for {capitalize(region?.city_name)}.
        </p>
      )}

      {movies.length > 0 && (
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
                  to={`/movies/${region?.city_name}/${toSlug(m.title)}/${m.id}`}
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
              to={`/explore/movies/${region?.city_name}`}
              className="inline-block border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              See more movies &rarr;
            </Link>
          </div>
        </div>
      )}

      <CitySelectorModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
