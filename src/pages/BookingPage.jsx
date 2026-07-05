import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../api';
import { getCookie } from '../utils/cookie';
import { CinemaListSkeleton } from '../components/Skeleton';
import {
  formatDateToMMDDYYYY,
  formatDateTime,
  formatDateToDDMMYYYY,
} from '../utils/utils';

export default function BookingPage() {
  const { city_name, movie_id } = useParams();
  const navigate = useNavigate();

  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const indexToDay = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thur',
    5: 'Fri',
    6: 'Sat',
  };

  const getSevenDaysFromCurrentDay = () => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      return d;
    });
  };

  const sevenDays = getSevenDaysFromCurrentDay();

  useEffect(() => {
    async function fetchCinemas() {
      try {
        const region = getCookie('selected_region');
        if (!region) {
          navigate('/');
          return;
        }
        const params = new URLSearchParams();
        if (selectedDate) {
          params.set('selectedDate', formatDateToMMDDYYYY(selectedDate));
        }
        if (movie_id) {
          params.set('movie_id', movie_id);
        }
        if (region.id) {
          params.set('region_id', region.id);
        }
        setLoading(true);
        setError('');
        const { data } = await get(`/cinema?${params}`);
        if (data) {
          setCinemas(data);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load cinema details');
      } finally {
        setLoading(false);
      }
    }

    fetchCinemas();
  }, [movie_id, city_name, selectedDate, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <CinemaListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500 font-medium mb-2">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 dark:text-blue-400 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 inline-flex items-center gap-1"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Select a Cinema</h1>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 sm:justify-center">
        {sevenDays.map((item, i) => {
          const isSelected =
            selectedDate?.toDateString() === item?.toDateString();
          const isToday = i === 0;
          return (
            <button
              key={item.toDateString()}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(item)}
              className={`flex flex-col items-center justify-center shrink-0 w-16 py-2 rounded-lg border cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                isSelected
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <span className="text-xs font-medium">
                {isToday ? 'Today' : indexToDay[item.getDay()]}
              </span>
              <span className="text-lg font-bold leading-tight">
                {item.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {cinemas.length === 0 ? (
        <p className="text-gray-400">
          No shows available for this movie in {city_name} on{' '}
          {formatDateToDDMMYYYY(selectedDate)}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {cinemas.map((cinema) => (
            <div
              key={cinema.cinema_id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {cinema.cinema_name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {cinema.address}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(cinema.start_time)}
                  </span>
                  <button
                    onClick={() =>
                      navigate(
                        `/movies/${movie_id}/${city_name}/seat-selection/${cinema.show_id}`
                      )
                    }
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Book Seats
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
