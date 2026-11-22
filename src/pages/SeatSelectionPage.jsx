import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post } from '../api';
import { useAuth } from '../hooks/useAuth';
import { SeatGridSkeleton } from '../components/Skeleton.jsx';
import { formatDateTime } from '../utils/utils.js';
import { BRAND_HEX } from '../utils/theme';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SeatSelectionPage() {
  const { city_name, movie_id, show_id } = useParams();
  const navigate = useNavigate();
  const { openLogin } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        const { data } = await get(`/show/${show_id}/details`);
        setRows(data.seats);
        setShowDetails(data.show);
      } catch (err) {
        setError(err.message || 'Failed to load seats');
      } finally {
        setLoading(false);
      }
    };
    fetchShowDetails();
  }, [show_id]);

  const toggleSeat = (seat, row) => {
    if (seat.status !== 'available') return;
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) return prev.filter((s) => s.id !== seat.id);
      return [...prev, { ...seat, row_label: row }];
    });
  };

  const totalPrice = selectedSeats.reduce(
    (sum, s) => sum + parseFloat(s.price),
    0
  );

  const getSeatStyle = (seat) => {
    if (seat.status !== 'available') {
      return 'bg-zinc-300 dark:bg-zinc-600 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border-zinc-300 dark:border-zinc-600';
    }
    const isSelected = selectedSeats.find((s) => s.id === seat.id);
    if (isSelected) {
      return 'bg-brand-600 text-white border-brand-600 cursor-pointer';
    }
    return 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-400 dark:border-zinc-500 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 cursor-pointer';
  };

  const confirmBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Log in over the seat map so the selection survives
      openLogin(`/movies/${movie_id}/${city_name}/seat-selection/${show_id}`);
      return;
    }
    if (selectedSeats.length === 0) return;

    setBooking(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please try again.');
        setBooking(false);
        return;
      }

      const seatIds = selectedSeats.map((s) => s.id);
      const { data: orderData } = await post('/booking', {
        show_id: parseInt(show_id),
        seat_ids: seatIds,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        currency: orderData.currency,
        name: 'Movie Ticket Booking',
        description: `${showDetails.cinema_name} | ${showDetails.start_time}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          try {
            await post('/booking/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBookingSuccess(true);
            setBooking(false);
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', err);
            setBooking(false);
          }
        },
        theme: { color: BRAND_HEX },
        modal: {
          ondismiss: () => setBooking(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        alert('Payment failed. Please try again.');
        setBooking(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Booking failed:', err);
      alert(err.message || 'Booking failed. Please try again.');
      setBooking(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center mt-16">
        <div className="text-green-500 text-5xl mb-4">&#10003;</div>
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-1">
          {showDetails.cinema_name}
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Show: {formatDateTime(showDetails.start_time)}
        </p>
        <p className="text-zinc-700 dark:text-zinc-300 mb-8">
          Seats:{' '}
          <span className="font-medium">
            {selectedSeats.map((s) => s.column_label).join(', ')}
          </span>
        </p>
        <button
          onClick={() => navigate(`/explore/home/${city_name}`)}
          className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 inline-flex items-center gap-1"
      >
        &larr; Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{showDetails?.cinema_name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Show: {formatDateTime(showDetails?.start_time)}
        </p>
      </div>

      {loading ? (
        <SeatGridSkeleton />
      ) : error ? (
        <p className="text-red-500 text-center py-16">{error}</p>
      ) : (
        <>
          <div className="flex items-center justify-center gap-6 mb-6 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-800 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-brand-600 bg-brand-600 inline-block" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-300 dark:bg-zinc-600 inline-block" />
              Booked
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {rows.map((rowData) => (
              <div key={rowData.row} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                  {rowData.row}
                </span>
                <div className="flex flex-wrap gap-2">
                  {rowData.seats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat, rowData.row)}
                      disabled={seat.status !== 'available'}
                      title={`Row ${rowData.row}, Seat ${seat.column_label} — ₹${seat.price}`}
                      className={`w-6 h-6 rounded text-xs font-medium border transition-colors ${getSeatStyle(seat)}`}
                    >
                      {seat.column_label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="h-2 bg-linear-to-t from-zinc-300 dark:from-zinc-600 to-transparent rounded-b-full mx-auto w-3/4" />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-widest">
              Screen
            </p>
          </div>
        </>
      )}

      <div className="sticky bottom-0 mt-8 bg-white dark:bg-zinc-950 border-t dark:border-zinc-700 pt-4 pb-2">
        {selectedSeats.length > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-medium">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}{' '}
                selected
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                {selectedSeats
                  .map(
                    (s) => s.row_label.toString() + s.column_label.toString()
                  )
                  .join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <p className="text-lg font-bold">₹{totalPrice.toFixed(2)}</p>
              <button
                onClick={confirmBooking}
                disabled={booking}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {booking ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
            Select seats to continue
          </p>
        )}
      </div>
    </div>
  );
}
