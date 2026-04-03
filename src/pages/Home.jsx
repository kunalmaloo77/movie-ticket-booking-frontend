import { useState, useEffect } from 'react';
import { get } from '../api';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie } from '../utils/cookie';
import { CityGridSkeleton } from '../components/Skeleton';
import { capitalize } from '../utils/utils';

export default function Home() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = getCookie('selected_region');
    if (saved?.city_name) {
      navigate(`/explore/home/${saved.city_name}`, { replace: true });
      return;
    }

    async function fetchRegions() {
      const cached = sessionStorage.getItem('regions');
      if (cached) {
        setRegions(JSON.parse(cached));
        setLoading(false);
        return;
      }
      try {
        const { data } = await get('/region');
        setRegions(data);
        sessionStorage.setItem('regions', JSON.stringify(data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchRegions();
  }, [navigate]);

  function handleSelect(region) {
    setCookie('selected_region', region);
    navigate(`/explore/home/${region.city_name}`);
  }

  if (loading) {
    return <CityGridSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Select your city</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Choose a city to see movies playing near you.
      </p>

      {regions.length === 0 ? (
        <p className="text-gray-400">No cities available.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => handleSelect(region)}
              className="border rounded-lg px-4 py-3 text-left hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <span className="font-medium">
                {capitalize(region.city_name)}
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">
                {region.city_code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
