import React from 'react';
import { get } from '../../api';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { getSelectStyles } from '../../utils/selectStyles';

const Screens = () => {
  const { isDark } = useTheme();
  const selectStyles = getSelectStyles(isDark);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [cinemaLoading, setCinemaLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const navigate = useNavigate();

  async function fetchRegions(inputValue) {
    try {
      const { data } = await get(
        '/region' + (inputValue && `?q=${inputValue}`)
      );
      return data.map((r) => ({ value: r.id, label: r.city_name }));
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  }

  async function handleRegionChange(selected) {
    setSelectedRegion(selected);
    setCinemas([]);
    setSelectedCinema(null);
    if (!selected) return;
    setCinemaLoading(true);
    try {
      const { data } = await get(`/cinema?region_id=${selected.value}`);
      setCinemas(
        data.map((c) => ({ value: c.cinema_id, label: c.cinema_name }))
      );
    } catch (error) {
      console.error('Error fetching cinemas:', error);
    } finally {
      setCinemaLoading(false);
    }
  }

  async function handleCinemaChange(selected) {
    setSelectedCinema(selected);
  }

  async function handleScreenSubmit() {
    console.log(selectedCinema, 'selectedCinema');
    if (!selectedCinema) {
      alert('Please select a cinema');
      return;
    }
    navigate(`/admin/cinemas/${selectedCinema.value}/screens`);
  }

  return (
    <>
      <div className="max-w-md mx-auto p-6">
        <div className="space-y-4">
          <h1 className="text-xl font-bold mb-4">Create Screens</h1>
          <AsyncSelect
            placeholder="Select Region"
            defaultOptions
            loadOptions={fetchRegions}
            value={selectedRegion}
            onChange={handleRegionChange}
            styles={selectStyles}
          />
          <Select
            placeholder={`${cinemaLoading ? 'Loading cinemas...' : 'Select Cinema'}`}
            options={cinemas}
            value={selectedCinema}
            isDisabled={!selectedRegion || cinemaLoading}
            onChange={handleCinemaChange}
            styles={selectStyles}
          />
          <button
            disabled={!selectedCinema}
            onClick={handleScreenSubmit}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2 rounded hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-medium transition-colors"
          >
            Add/Edit Screens
          </button>
        </div>
      </div>
    </>
  );
};

export default Screens;
