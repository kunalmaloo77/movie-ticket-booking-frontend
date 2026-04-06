import { useState } from 'react';
import { post } from '../../api';

export default function Cinemas() {
  const [cinemaName, setCinemaName] = useState('');
  const [address, setAddress] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const { data } = await post('/cinema/', {
        cinema_name: cinemaName,
        address,
        city_code: cityCode,
      });
      setMsg(`Cinema created: ${data.cinema_name} (code: ${data.cinema_code})`);
      setCinemaName('');
      setAddress('');
      setCityCode('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Create Cinema</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Cinema Name"
          value={cinemaName}
          onChange={(e) => setCinemaName(e.target.value)}
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />
        <input
          type="text"
          placeholder="City Code (e.g. BLR)"
          value={cityCode}
          onChange={(e) => setCityCode(e.target.value)}
          className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
          required
        />
        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 cursor-pointer"
        >
          Create Cinema
        </button>
      </form>
    </div>
  );
}
