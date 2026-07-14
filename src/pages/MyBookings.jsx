import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { get } from '../api';
import { useAuth } from '../context/useAuth';
import { BookingListSkeleton } from '../components/Skeleton';

const STATUS_STYLES = {
  PAYMENT_SUCCESS:
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CREATED:
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  PAYMENT_FAILED:
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  EXPIRED: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

const STATUS_LABELS = {
  PAYMENT_SUCCESS: 'Confirmed',
  CREATED: 'Pending',
  PAYMENT_FAILED: 'Failed',
  EXPIRED: 'Expired',
};

function groupSeatsByCategory(seats) {
  const acc = {};
  for (const s of seats) {
    const label = `${s.row}${s.col}`;
    acc[s.category] = acc[s.category] ? `${acc[s.category]}, ${label}` : label;
  }
  return Object.entries(acc)
    .map(([cat, labels]) => `${labels} (${cat})`)
    .join(' · ');
}

function downloadReceipt(booking) {
  const seatList = booking.seats
    .map((s) => `${s.row}${s.col} (${s.category})`)
    .join(', ');
  const showTime = new Date(booking.show_time).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const bookedOn = new Date(booking.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const amount = `&#8377;${parseFloat(booking.amount).toFixed(2)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Booking Receipt #${booking.booking_id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #111;
      padding: 40px;
      max-width: 620px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 2px solid #dc2626;
    }
    .app-name { font-size: 22px; font-weight: 800; color: #dc2626; letter-spacing: -0.5px; }
    .receipt-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #6b7280;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .booking-id { font-size: 26px; font-weight: 700; margin-bottom: 24px; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 3px;
    }
    .value { font-size: 15px; font-weight: 500; margin-bottom: 16px; color: #111; }
    .value.large { font-size: 22px; font-weight: 700; color: #111; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    .footer {
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;
    }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="app-name">Moviebook</span>
    <span class="receipt-label">Receipt</span>
  </div>

  <div class="booking-id">Booking #${booking.booking_id}</div>

  <div class="label">Movie</div>
  <div class="value">${booking.movie_title}</div>

  <div class="label">Cinema &amp; Screen</div>
  <div class="value">${booking.cinema_name} &middot; ${booking.screen_name} &middot; ${booking.screen_type}</div>

  <div class="label">Show Time &amp; Language</div>
  <div class="value">${showTime} &middot; ${booking.language}</div>

  <hr />

  <div class="label">Seats</div>
  <div class="value">${seatList}</div>

  <div class="label">Amount Paid</div>
  <div class="value large">${amount}</div>

  <hr />

  <div class="label" style="margin-bottom:12px">Payment Details</div>
  <div class="two-col">
    <div>
      <div class="label">Order ID</div>
      <div class="value" style="word-break:break-all">${booking.razorpay_order_id}</div>
    </div>
    <div>
      <div class="label">Payment ID</div>
      <div class="value" style="word-break:break-all">${booking.razorpay_payment_id ?? 'N/A'}</div>
    </div>
  </div>

  <div class="label">Booked On</div>
  <div class="value">${bookedOn}</div>

  <p class="footer">This is a computer-generated receipt and does not require a signature.</p>

  <script>window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=700,height=900');
  if (!win) {
    alert('Allow popups for this site to download your receipt.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

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
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

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
            const seatDisplay = groupSeatsByCategory(booking.seats);
            const bookedOn = new Date(booking.created_at).toLocaleString(
              'en-IN',
              {
                dateStyle: 'medium',
                timeStyle: 'short',
              }
            );
            const showTime = new Date(booking.show_time).toLocaleString(
              'en-IN',
              {
                dateStyle: 'medium',
                timeStyle: 'short',
              }
            );

            return (
              <div
                key={booking.booking_id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-sm"
              >
                {/* Section A — Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {booking.movie_title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {booking.cinema_name} &middot; {booking.screen_name}{' '}
                      &middot; {booking.screen_type}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {showTime} &middot; {booking.language}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                      STATUS_STYLES[booking.status] ||
                      'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>

                <hr className="my-3 border-gray-100 dark:border-gray-800" />

                {/* Section B — Detail grid */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">
                      Seats
                    </span>
                    <span className="font-medium">{seatDisplay}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">
                      Amount
                    </span>
                    <span className="font-medium">
                      ₹{parseFloat(booking.amount).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">
                      Booking
                    </span>
                    <span className="font-medium">#{booking.booking_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide block mb-0.5">
                      Booked On
                    </span>
                    <span className="font-medium">{bookedOn}</span>
                  </div>
                </div>

                {/* Section C — Receipt (confirmed only) */}
                {booking.status === 'PAYMENT_SUCCESS' && (
                  <>
                    <hr className="my-3 border-gray-100 dark:border-gray-800" />
                    <div className="flex justify-end">
                      <button
                        onClick={() => downloadReceipt(booking)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <Download size={15} />
                        Download Receipt
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
