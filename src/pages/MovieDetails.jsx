import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../api';
import {
  MovieDetailsSkeleton,
  ImageWithSkeleton,
} from '../components/Skeleton';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

export default function MovieDetails() {
  const { movie_id, city_name } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMovie() {
      try {
        const { data } = await get(`/movie/${movie_id}`);
        setMovie(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    }
    fetchMovie();
  }, [movie_id]);

  if (loading) {
    return <MovieDetailsSkeleton />;
  }

  if (error || !movie) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500 font-medium mb-2">
          {error || 'Movie not found.'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Backdrop hero */}
      <div className="relative w-full h-60 md:h-80 overflow-hidden">
        {movie.backdrop_image_url ? (
          <ImageWithSkeleton
            src={`${TMDB_IMAGE_BASE}${movie.backdrop_image_url}`}
            alt="backdrop"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-sm text-white bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors backdrop-blur-sm"
        >
          &#8592; Back
        </button>
      </div>

      {/* Content — poster overlaps the backdrop */}
      <div className="px-5 md:px-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 -mt-16 md:-mt-24 relative">
          {/* Poster */}
          <ImageWithSkeleton
            src={`${TMDB_IMAGE_BASE}${movie.poster_image_url}`}
            alt={movie.title}
            className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-white/20"
            containerClassName="w-28 md:w-44 h-40 md:h-64 flex-shrink-0 self-start mx-auto md:mx-0 rounded-xl"
            skeletonClassName="rounded-xl"
          />

          <div className="flex-1 md:pt-24">
            <h1 className="text-2xl md:text-3xl font-bold leading-snug mb-2">
              {movie.title.replaceAll('-', ' ')}
            </h1>

            <div className="flex items-center gap-2 flex-wrap mb-5">
              {movie.rating && (
                <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded">
                  &#9733; {movie.rating}
                </span>
              )}
              {movie.adult && (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">
                  A
                </span>
              )}
              {movie.genres && (
                <span className="text-sm text-gray-500">{movie.genres}</span>
              )}
            </div>

            <button
              onClick={() =>
                navigate(`/movies/${city_name}/${movie_id}/booking`)
              }
              className="px-7 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer mb-6"
            >
              Book Tickets
            </button>

            {/* Overview */}
            {movie.overview && (
              <p className="text-gray-500 text-sm leading-relaxed">
                {movie.overview}
              </p>
            )}
          </div>
        </div>

        {/* Movie info strip */}
        <div className="mt-8 border-t pt-6 grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
          {movie.genres && (
            <div>
              <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
                Genre
              </span>
              <span className="font-medium text-gray-800">{movie.genres}</span>
            </div>
          )}
          {movie.rating && (
            <div>
              <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
                Rating
              </span>
              <span className="font-medium text-gray-800">
                {movie.rating} / 10
              </span>
            </div>
          )}
          {movie.adult !== undefined && (
            <div>
              <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
                Adult
              </span>
              <span className="font-medium text-gray-800">
                {movie.adult ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
