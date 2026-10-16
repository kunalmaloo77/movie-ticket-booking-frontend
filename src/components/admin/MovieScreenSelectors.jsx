import Select from 'react-select';
import AsyncSelect from 'react-select/async';

export default function MovieScreenSelectors({
  selectStyles,
  selectedMovie,
  onMovieChange,
  debouncedFetchMovies,
  selectedRegion,
  onRegionChange,
  debouncedFetchRegions,
  selectedCinema,
  onCinemaChange,
  cinemas,
  cinemasLoading,
  selectedScreen,
  onScreenChange,
  screens,
  screensLoading,
}) {
  return (
    <>
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Movie
        </span>
        <AsyncSelect
          placeholder="Search movie"
          defaultOptions
          cacheOptions
          loadOptions={debouncedFetchMovies}
          value={selectedMovie}
          onChange={onMovieChange}
          styles={selectStyles}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Region
        </span>
        <AsyncSelect
          placeholder="Search region"
          defaultOptions
          cacheOptions
          loadOptions={debouncedFetchRegions}
          value={selectedRegion}
          onChange={onRegionChange}
          styles={selectStyles}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cinema
        </span>
        <Select
          placeholder={cinemasLoading ? 'Loading cinemas...' : 'Select cinema'}
          options={cinemas}
          value={selectedCinema}
          onChange={onCinemaChange}
          isDisabled={!selectedRegion || cinemasLoading}
          styles={selectStyles}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Screen
        </span>
        <Select
          placeholder={screensLoading ? 'Loading screens...' : 'Select screen'}
          options={screens}
          value={selectedScreen}
          onChange={onScreenChange}
          isDisabled={!selectedCinema || screensLoading}
          styles={selectStyles}
        />
      </div>
    </>
  );
}
