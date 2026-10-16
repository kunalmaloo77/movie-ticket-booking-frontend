import { useCallback, useMemo, useState } from 'react';
import { get } from '../api';
import { showError } from '../utils/swal_utils';
import { debounce } from '../utils/utils';

export function useShowScheduleSelectors() {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);

  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);
  const [screensLoading, setScreensLoading] = useState(false);

  const fetchRegions = useCallback(async (inputValue) => {
    try {
      const params = new URLSearchParams();
      if (inputValue?.trim()) {
        params.set('q', inputValue.trim());
      }
      const { data } = await get(
        `/region${params.toString() ? `?${params}` : ''}`
      );
      return Array.isArray(data)
        ? data.map((region) => ({
            value: region.id,
            label: region.city_name,
          }))
        : [];
    } catch (err) {
      console.error('Failed to fetch regions:', err);
      return [];
    }
  }, []);

  const fetchMovies = useCallback(async (inputValue) => {
    try {
      const params = new URLSearchParams();
      if (inputValue?.trim()) {
        params.set('q', inputValue.trim());
      }
      const { data } = await get(
        `/movie${params.toString() ? `?${params}` : ''}`
      );
      return Array.isArray(data)
        ? data.map((movie) => ({
            value: movie.id,
            label: movie.title,
          }))
        : [];
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      return [];
    }
  }, []);

  const debouncedFetchRegions = useMemo(
    () => debounce(fetchRegions, 300),
    [fetchRegions]
  );

  const debouncedFetchMovies = useMemo(
    () => debounce(fetchMovies, 300),
    [fetchMovies]
  );

  const fetchCinemas = useCallback(
    async (regionId, setter = setCinemas, loadingSetter = setCinemasLoading) => {
      if (!regionId) {
        setter([]);
        return;
      }

      loadingSetter(true);
      try {
        const { data } = await get(`/cinema?region_id=${regionId}`);
        setter(
          Array.isArray(data)
            ? data.map((cinema) => ({
                value: cinema.cinema_id,
                label: cinema.cinema_name,
              }))
            : []
        );
      } catch (err) {
        setter([]);
        showError(err.message, 'Could not load cinemas');
      } finally {
        loadingSetter(false);
      }
    },
    []
  );

  const fetchScreens = useCallback(async (cinemaId) => {
    if (!cinemaId) {
      setScreens([]);
      return;
    }

    setScreensLoading(true);
    try {
      const { data } = await get(`/screen/cinema/${cinemaId}`);
      setScreens(
        Array.isArray(data)
          ? data.map((screen) => ({
              value: screen.id,
              label: screen.name,
            }))
          : []
      );
    } catch (err) {
      setScreens([]);
      showError(err.message, 'Could not load screens');
    } finally {
      setScreensLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (screenId) => {
    if (!screenId) {
      setCategories([]);
      return;
    }

    try {
      const { data } = await get(`/seats/categories/screen/${screenId}`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
      showError(err.message, 'Could not load seat categories');
    }
  }, []);

  const handleRegionChange = useCallback(
    async (option) => {
      setSelectedRegion(option);
      setSelectedCinema(null);
      setSelectedScreen(null);
      setCinemas([]);
      setScreens([]);
      setCategories([]);

      if (option?.value) {
        await fetchCinemas(option.value, setCinemas, setCinemasLoading);
      }
    },
    [fetchCinemas]
  );

  const handleCinemaChange = useCallback(
    async (option) => {
      setSelectedCinema(option);
      setSelectedScreen(null);
      setScreens([]);
      setCategories([]);

      if (option?.value) {
        await fetchScreens(option.value);
      }
    },
    [fetchScreens]
  );

  const handleScreenChange = useCallback(
    async (option) => {
      setSelectedScreen(option);

      if (option?.value) {
        await fetchCategories(option.value);
      } else {
        setCategories([]);
      }
    },
    [fetchCategories]
  );

  const resetSelectors = useCallback(() => {
    setSelectedMovie(null);
    setSelectedRegion(null);
    setSelectedCinema(null);
    setSelectedScreen(null);
    setCinemas([]);
    setScreens([]);
    setCategories([]);
  }, []);

  const loadSelectorsForShow = useCallback(
    async (show) => {
      setSelectedMovie({ value: show.movie_id, label: show.movie_title });
      setSelectedRegion({ value: show.region_id, label: show.region_name });
      setSelectedCinema({ value: show.cinema_id, label: show.cinema_name });
      setSelectedScreen({ value: show.screen_id, label: show.screen_name });

      await fetchCinemas(show.region_id, setCinemas, setCinemasLoading);
      await fetchScreens(show.cinema_id);
      await fetchCategories(show.screen_id);
    },
    [fetchCinemas, fetchScreens, fetchCategories]
  );

  return {
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
    fetchRegions,
    debouncedFetchRegions,
    fetchMovies,
    debouncedFetchMovies,
    fetchCinemas,
    fetchScreens,
    fetchCategories,
    handleRegionChange,
    handleCinemaChange,
    handleScreenChange,
    resetSelectors,
    loadSelectorsForShow,
  };
}
