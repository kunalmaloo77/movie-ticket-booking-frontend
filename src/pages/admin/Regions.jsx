import { useState } from 'react';
import { post } from '../../api';

export default function Regions() {
  const [cityCode, setCityCode] = useState('');
  const [cityName, setCityName] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const { data } = await post('/region', {
        city_code: cityCode,
        city_name: cityName,
      });
      setMsg(`Region created: ${data.city_name} (${data.city_code})`);
      setCityCode('');
      setCityName('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Create Region</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="City Code (e.g. BLR)"
          value={cityCode}
          onChange={(e) => setCityCode(e.target.value)}
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />
        <input
          type="text"
          placeholder="City Name (e.g. Bangalore)"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />
        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 cursor-pointer"
        >
          Create Region
        </button>
      </form>
    </div>
  );
}
