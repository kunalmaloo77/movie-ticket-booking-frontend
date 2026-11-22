import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import Analytics from './pages/admin/Analytics';
import Regions from './pages/admin/Regions';
import Cinemas from './pages/admin/Cinemas';
import Movies from './pages/admin/Movies';
import MovieDetails from './pages/MovieDetails';
import BookingPage from './pages/BookingPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import Shows from './pages/admin/Shows';
import BulkAddShows from './pages/admin/BulkAddShows';
import MyBookings from './pages/MyBookings';
import Screens from './pages/admin/Screens';
import AddEditSeatLayout from './pages/admin/AddEditSeatLayout';
import MoviesPage from './pages/MoviesPage';
import { RegionProvider } from './context/RegionContext';
import NotFound from './pages/NotFound';
import AccountSettings from './pages/AccountSettings';
import AdminLayout from './components/admin/AdminLayout';

// Login popup, opened from anywhere via useAuth().openLogin(from)
function LoginModalHost() {
  const { loginModal, closeLogin } = useAuth();
  if (!loginModal) return null;
  return <LoginModal from={loginModal.from} onClose={closeLogin} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <RegionProvider>
          <AuthProvider>
            <Navbar />
            <LoginModalHost />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore/home/:city_name" element={<Home />} />
              <Route
                path="/explore/movies/:city_name"
                element={<MoviesPage />}
              />
              <Route
                path="/movies/:city_name/:movie_name/:movie_id"
                element={<MovieDetails />}
              />
              <Route
                path="/movies/:city_name/:movie_id/booking"
                element={<BookingPage />}
              />
              <Route
                path="/movies/:movie_id/:city_name/seat-selection/:show_id"
                element={<SeatSelectionPage />}
              />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/account" element={<AccountSettings />} />
              </Route>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute admin />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Navigate to="analytics" replace />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="regions" element={<Regions />} />
                  <Route path="cinemas" element={<Cinemas />} />
                  <Route path="movies" element={<Movies />} />
                  <Route path="shows" element={<Shows />} />
                  <Route path="shows/bulk" element={<BulkAddShows />} />
                  <Route path="screens" element={<Screens />} />
                  <Route
                    path="cinemas/:cinema_id/screens"
                    element={<AddEditSeatLayout />}
                  />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </RegionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
