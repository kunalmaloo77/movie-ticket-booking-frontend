import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ExplorePage from './pages/ExplorePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Regions from './pages/admin/Regions';
import Cinemas from './pages/admin/Cinemas';
import Movies from './pages/admin/Movies';
import MovieDetails from './pages/MovieDetails';
import BookingPage from './pages/BookingPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import Shows from './pages/admin/Shows';
import MyBookings from './pages/MyBookings';
import Screens from './pages/admin/Screens';
import AddEditSeatLayout from './pages/admin/AddEditSeatLayout';
import MoviesPage from './pages/MoviesPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore/home/:city_name" element={<ExplorePage />} />
          <Route path="/explore/movies/:city_name" element={<MoviesPage />} />
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute admin />}>
            <Route index element={<Dashboard />} />
            <Route path="regions" element={<Regions />} />
            <Route path="cinemas" element={<Cinemas />} />
            <Route path="movies" element={<Movies />} />
            <Route path="shows" element={<Shows />} />
            <Route path="screens" element={<Screens />} />
            <Route
              path="cinemas/:cinema_id/screens"
              element={<AddEditSeatLayout />}
            />
          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
