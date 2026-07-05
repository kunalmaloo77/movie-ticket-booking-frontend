import { useState } from 'react';
import { post } from '../../api';
import Button from '../../components/Button';
import { showSuccess, showError } from '../../utils/swal_utils';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500';

export default function Cinemas() {
  const [cinemaName, setCinemaName] = useState('');
  const [address, setAddress] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await post('/cinema/', {
        cinema_name: cinemaName,
        address,
        city_code: cityCode,
      });
      setCinemaName('');
      setAddress('');
      setCityCode('');
      showSuccess(
        `Cinema created: ${data.cinema_name} (code: ${data.cinema_code})`
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Create Cinema</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Cinema Name"
          value={cinemaName}
          onChange={(e) => setCinemaName(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="City Code (e.g. BLR)"
          value={cityCode}
          onChange={(e) => setCityCode(e.target.value)}
          className={inputClass}
          required
        />
        <Button
          type="submit"
          fullWidth
          loading={loading}
          loadingText="Creating…"
        >
          Create Cinema
        </Button>
      </form>
    </div>
  );
}
