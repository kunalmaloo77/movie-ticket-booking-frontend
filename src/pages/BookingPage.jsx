import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../api';
import { getCookie } from '../utils/cookie';
import { CinemaListSkeleton } from '../components/Skeleton';
import { formatDateTime } from '../utils/utils';

export default function BookingPage() {
  const { city_name, movie_id } = useParams();
  const navigate = useNavigate();

  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCinemas() {
      try {
        const region = getCookie('selected_region');
        if (!region) {
          navigate('/');
          return;
        }
        const { data } = await get(`/cinema/${movie_id}/${region.id}`);
        setCinemas(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load cinema details');
      } finally {
        setLoading(false);
      }
    }

    fetchCinemas();
  }, [movie_id, city_name, navigate]);

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

      {cinemas.length === 0 ? (
        <p className="text-gray-400">
          No shows available for this movie in {city_name}.
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cinema.address}</p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(cinema.start_time)}
                  </span>
                  <button
                    onClick={() =>
                      navigate(
                        `/movies/${movie_id}/${city_name}/seat-selection/${cinema.show_id}?cinemaName=${cinema.cinema_name}&showTime=${formatDateTime(cinema.start_time)}`,
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
