import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { get } from '../../api';
import Button from '../../components/Button';
import { showError } from '../../utils/swal_utils.jsx';

const DAY_OPTIONS = [7, 14, 30, 90];
const ACCENT = '#6366f1';

function StatCard({ label, value }) {
  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-72" />
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function formatDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export default function Analytics() {
  const [revenue, setRevenue] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [topMovies, setTopMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  const [dailyStats, setDailyStats] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const { data } = await get('/admin/revenue');
      setRevenue(
        Array.isArray(data)
          ? data.map((row) => ({
              ...row,
              total_revenue: Number(row.total_revenue),
              number_of_tickets: Number(row.number_of_tickets),
            }))
          : []
      );
    } catch (err) {
      showError(err.message, 'Could not load revenue');
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const loadTopMovies = useCallback(async () => {
    setMoviesLoading(true);
    try {
      const { data } = await get('/admin/movies/top');
      setTopMovies(
        Array.isArray(data)
          ? data.map((row) => ({
              ...row,
              booking_count: Number(row.booking_count),
            }))
          : []
      );
    } catch (err) {
      showError(err.message, 'Could not load top movies');
    } finally {
      setMoviesLoading(false);
    }
  }, []);

  const loadDailyStats = useCallback(async (selectedDays) => {
    setDailyLoading(true);
    try {
      const { data } = await get(`/admin/bookings/daily?days=${selectedDays}`);
      setDailyStats(
        Array.isArray(data)
          ? data.map((row) => ({
              ...row,
              number_of_bookings: Number(row.number_of_bookings),
              total_amount: Number(row.total_amount),
            }))
          : []
      );
    } catch (err) {
      showError(err.message, 'Could not load daily bookings');
    } finally {
      setDailyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  useEffect(() => {
    loadTopMovies();
  }, [loadTopMovies]);

  useEffect(() => {
    loadDailyStats(days);
  }, [loadDailyStats, days]);

  const netRevenue = revenue.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalTickets = revenue.reduce((sum, r) => sum + r.number_of_tickets, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Admin · Analytics
            </p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              Revenue & booking insights
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Net revenue, city-wise breakdown, the most-booked movies, and
              daily booking volume at a glance.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatCard
              label="Net Revenue"
              value={revenueLoading ? '—' : formatCurrency(netRevenue)}
            />
            <StatCard
              label="Tickets Sold"
              value={revenueLoading ? '—' : totalTickets}
            />
            <StatCard
              label="Cities"
              value={revenueLoading ? '—' : revenue.length}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Revenue by city
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
              City-wise revenue
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadRevenue}
            disabled={revenueLoading}
          >
            Refresh
          </Button>
        </div>

        <div className="mt-6">
          {revenueLoading ? (
            <ChartSkeleton />
          ) : revenue.length === 0 ? (
            <EmptyState message="No revenue recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="city_name"
                  tick={{ fill: 'currentColor' }}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fill: 'currentColor' }}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar
                  dataKey="total_revenue"
                  name="Revenue"
                  fill={ACCENT}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Top movies
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Top 5 most-booked movies
          </h2>
        </div>

        <div className="mt-6">
          {moviesLoading ? (
            <ChartSkeleton />
          ) : topMovies.length === 0 ? (
            <EmptyState message="No bookings recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={topMovies} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: 'currentColor' }}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={160}
                  tick={{ fill: 'currentColor' }}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <Tooltip />
                <Bar
                  dataKey="booking_count"
                  name="Bookings"
                  fill={ACCENT}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Booking volume
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Bookings per day
            </h2>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            Range
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          {dailyLoading ? (
            <ChartSkeleton />
          ) : dailyStats.length === 0 ? (
            <EmptyState message="No bookings in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="booking_date"
                  tickFormatter={formatDay}
                  tick={{ fill: 'currentColor' }}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'currentColor' }}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-IN')
                  }
                />
                <Line
                  type="monotone"
                  dataKey="number_of_bookings"
                  name="Bookings"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
