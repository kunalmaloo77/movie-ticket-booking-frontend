import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../api';
import { useAuth } from '../context/AuthContext';
import { BookingListSkeleton } from '../components/Skeleton';

const STATUS_STYLES = {
  PAYMENT_SUCCESS: 'bg-green-100 text-green-700',
  CREATED: 'bg-yellow-100 text-yellow-700',
  PAYMENT_FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  PAYMENT_SUCCESS: 'Confirmed',
  CREATED: 'Pending',
  PAYMENT_FAILED: 'Failed',
  EXPIRED: 'Expired',
};

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/my-bookings' } });
      return;
    }
    const fetchBookings = async () => {
      try {
        const { data } = await get(`/booking/user/${user.id}`);
        setBookings(data);
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, navigate]);

  if (loading) {
    return <BookingListSkeleton />;
  }

  if (error) {
    return <p className="text-red-500 text-center py-24">{error}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg mb-4">No bookings yet.</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Browse Movies
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const seatLabels = booking.seats
              .map((s) => `${s.row}${s.col}`)
              .join(', ');
            const date = new Date(booking.created_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <div
                key={booking.booking_id}
                className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Booking #{booking.booking_id}
                    </p>
                    <p className="text-sm text-gray-600">{date}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                      STATUS_STYLES[booking.status] ||
                      'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>

                <hr className="my-3 border-gray-100" />

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">
                      Seats
                    </span>
                    <span className="font-medium">{seatLabels}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">
                      Amount
                    </span>
                    <span className="font-medium">
                      ₹{parseFloat(booking.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
