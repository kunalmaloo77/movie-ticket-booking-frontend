import { createContext, useCallback, useState } from 'react';
import { getCookie, setCookie } from '../utils/cookie';
import { get } from '../api';

const RegionContext = createContext();

export default RegionContext;

export function RegionProvider({ children }) {
  const [region, setRegion] = useState();
  const [loadingRegion, setLoadingRegion] = useState();

  const loadRegion = useCallback(function loadRegion(city_name) {
    setLoadingRegion(true);
    setRegion(null);

    async function resolveRegion() {
      try {
        const cookie_region = getCookie('selected_region');
        if (cookie_region.city_name === city_name) {
          setRegion(cookie_region);
          return;
        }
        const { data } = await get('/region?limit=1&q=' + city_name);
        const region = data?.[0];
        if (region) {
          setRegion(region);
          setCookie('selected_region', region);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingRegion(false);
      }
    }

    resolveRegion();
  }, []);

  return (
    <RegionContext.Provider value={{ region, loadingRegion, loadRegion }}>
      {children}
    </RegionContext.Provider>
  );
}
