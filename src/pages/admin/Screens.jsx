import React from 'react';
import { get } from '../../api';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.25rem',
    borderColor: '#000000',
    paddingTop: '0.175rem',
    paddingBottom: '0.175rem',
    boxShadow: state.isFocused ? '0 0 0 2px #d1d5db' : base.boxShadow,
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0.175rem 0.75rem',
  }),
};

const Screens = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [cinemaLoading, setCinemaLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const navigate = useNavigate();

  async function fetchRegions(inputValue) {
    try {
      const { data } = await get(
        '/region' + (inputValue && `?search=${inputValue}`)
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
      const { data } = await get(`/cinema/search?region_id=${selected.value}`);
      setCinemas(data.map((c) => ({ value: c.id, label: c.cinema_name })));
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
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add/Edit Screens
          </button>
        </div>
      </div>
    </>
  );
};

export default Screens;
