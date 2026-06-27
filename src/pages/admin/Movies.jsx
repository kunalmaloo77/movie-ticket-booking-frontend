import { useCallback, useEffect, useRef, useState } from 'react';
import { del, get, post, put } from '../../api';
import Select from 'react-select';
import { TMDB_IMAGE_BASE } from '../../utils/const';
import { useTheme } from '../../context/useTheme';
import { getSelectStyles } from '../../utils/selectStyles';
import Button from '../../components/Button';
import { showSuccess, showError } from '../../utils/swal';

const EMPTY_FORM = {
  title: '',
  source: 'manual',
  tmdb_id: '',
  rating: '',
  language: '',
  adult: false,
  runtime: '',
  release_date: '',
  poster_image_url: '',
  backdrop_image_url: '',
  overview: '',
  genre_ids: [],
};

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm';

function MovieFormDrawer({ mode, movie, genres, onClose, onSaved, isDark }) {
  const selectStyles = getSelectStyles(isDark);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && movie) {
      setForm({
        title: movie.title ?? '',
        source: movie.source ?? 'manual',
        tmdb_id: movie.tmdb_id ?? '',
        rating: movie.rating ?? '',
        language: movie.language ?? '',
        adult: movie.adult ?? false,
        runtime: movie.runtime ?? '',
        release_date: movie.release_date
          ? movie.release_date.split('T')[0]
          : '',
        poster_image_url: movie.poster_image_url ?? '',
        backdrop_image_url: movie.backdrop_image_url ?? '',
        overview: movie.overview ?? '',
        genre_ids: movie.genre_ids ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mode, movie]);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title,
        source: form.source,
        rating: parseFloat(form.rating),
        language: form.language,
        adult: form.adult,
        runtime: form.runtime ? parseInt(form.runtime) : undefined,
        release_date: form.release_date,
        poster_image_url: form.poster_image_url,
        backdrop_image_url: form.backdrop_image_url,
        overview: form.overview,
        genre_ids: form.genre_ids,
        ...(form.source === 'tmdb' && { tmdb_id: parseInt(form.tmdb_id) }),
      };

      if (mode === 'edit') {
        await put(`/movie/${movie.id}`, body);
      } else {
        await post('/movie/', body);
      }

      onSaved();
      onClose();
      showSuccess(
        mode === 'edit'
          ? `Movie updated: ${form.title}`
          : `Movie created: ${form.title}`
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedGenreOptions = genres
    .filter((g) => form.genre_ids.includes(g.id))
    .map((g) => ({ value: g.id, label: g.name }));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg bg-white dark:bg-gray-900 shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-bold">
            {mode === 'edit' ? 'Edit Movie' : 'Add Movie'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3 flex-1">
          {mode === 'edit' && movie?.source === 'tmdb' && (
            <p className="text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
              This movie was imported from TMDB. Manual edits may be overwritten
              during sync.
            </p>
          )}

          <input
            type="text"
            placeholder="Movie Title"
            value={form.title}
            onChange={update('title')}
            className={inputClass}
            required
          />

          {mode === 'create' && (
            <>
              <select
                value={form.source}
                onChange={update('source')}
                className={inputClass}
              >
                <option value="manual">Manual</option>
                <option value="tmdb">TMDB</option>
              </select>
              {form.source === 'tmdb' && (
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="TMDB ID"
                  value={form.tmdb_id}
                  onChange={update('tmdb_id')}
                  className={inputClass}
                  required
                />
              )}
            </>
          )}

          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="Rating (0–10)"
            value={form.rating}
            onChange={update('rating')}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Language"
            value={form.language}
            onChange={update('language')}
            className={inputClass}
            required
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.adult}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, adult: e.target.checked }))
              }
              className="w-4 h-4"
            />
            Adult content
          </label>

          <input
            type="number"
            min="1"
            placeholder="Runtime (minutes)"
            value={form.runtime}
            onChange={update('runtime')}
            className={inputClass}
          />

          <input
            type="date"
            value={form.release_date}
            onChange={update('release_date')}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Poster Image Path"
            value={form.poster_image_url}
            onChange={update('poster_image_url')}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Backdrop Image Path"
            value={form.backdrop_image_url}
            onChange={update('backdrop_image_url')}
            className={inputClass}
            required
          />

          <textarea
            placeholder="Overview"
            value={form.overview}
            onChange={update('overview')}
            rows={3}
            className={inputClass + ' resize-none'}
          />

          <Select
            placeholder="Select Genres"
            isMulti
            value={selectedGenreOptions}
            options={genres.map((g) => ({ value: g.id, label: g.name }))}
            onChange={(selected) =>
              setForm((prev) => ({
                ...prev,
                genre_ids: (selected || []).map((o) => o.value),
              }))
            }
            styles={selectStyles}
          />

          <Button
            type="submit"
            fullWidth
            size="sm"
            loading={saving}
            loadingText="Saving…"
            className="mt-2"
          >
            {mode === 'edit' ? 'Save Changes' : 'Create Movie'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Movies() {
  const { isDark } = useTheme();

  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [editingMovie, setEditingMovie] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteHasShows, setDeleteHasShows] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [genreName, setGenreName] = useState('');
  const [genreSaving, setGenreSaving] = useState(false);

  const fetchMovies = useCallback(
    async (page = 1) => {
      try {
        const params = new URLSearchParams({ page });
        if (search) params.set('search', search);
        const { data, pagination: pg } = await get(`/movie?${params}`);
        setMovies(data);
        setPagination({
          page: pg.page,
          totalPages: pg.totalPages,
          totalItems: pg.totalItems,
        });
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      }
    },
    [search]
  );

  useEffect(() => {
    async function init() {
      try {
        const { data } = await get('/movie/genres');
        setGenres(data);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  function handleSearchChange(e) {
    setSearchInput(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(e.target.value);
    }, 400);
  }

  async function openEdit(movieId) {
    try {
      const { data } = await get(`/movie/${movieId}`);
      setEditingMovie(data);
      setDrawerMode('edit');
      setDrawerOpen(true);
    } catch (err) {
      console.error('Failed to fetch movie:', err);
    }
  }

  async function openDelete(movie) {
    setDeleteError('');
    try {
      const { data } = await get(`/show/movie/${movie.id}`);
      const hasShows = Array.isArray(data) && data.length > 0;
      setDeleteHasShows(hasShows);
    } catch {
      setDeleteHasShows(false);
    }
    setDeleteTarget(movie);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleting(true);
    try {
      await del(`/movie/${deleteTarget.id}`);
      setDeleteTarget(null);
      const newTotalItems = pagination.totalItems - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotalItems / 20));
      const newPage = Math.min(pagination.page, newTotalPages);
      fetchMovies(newPage);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleGenre(e) {
    e.preventDefault();
    setGenreSaving(true);
    try {
      const data = await post('/movie/genre/', { name: genreName });
      setGenreName('');
      const { data: updated } = await get('/movie/genres');
      setGenres(updated);
      showSuccess(`Genre created: ${data.genre?.name ?? genreName}`);
    } catch (err) {
      showError(err.message);
    } finally {
      setGenreSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Movies</h1>
          <button
            onClick={() => {
              setDrawerMode('create');
              setEditingMovie(null);
              setDrawerOpen(true);
            }}
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2 rounded hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer transition-colors"
          >
            + Add Movie
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by title or TMDB ID…"
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 mb-3"
        />

        {deleteTarget && (
          <div className="mb-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded px-4 py-3 text-sm space-y-2">
            {deleteHasShows ? (
              <p className="text-red-700 dark:text-red-400 font-medium">
                Warning: <span className="font-bold">{deleteTarget.title}</span>{' '}
                has upcoming shows. Deleting it may affect existing bookings.
                This action cannot be undone.
              </p>
            ) : (
              <p className="text-red-700 dark:text-red-400">
                Delete <span className="font-bold">{deleteTarget.title}</span>?
                This action cannot be undone.
              </p>
            )}
            {deleteError && (
              <p className="text-red-600 dark:text-red-400">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting
                  ? 'Deleting…'
                  : deleteHasShows
                    ? 'Delete Anyway'
                    : 'Delete'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Poster</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Language</th>
                <th className="px-3 py-2 font-medium">Rating</th>
                <th className="px-3 py-2 font-medium">Release</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-gray-400"
                  >
                    No movies found.
                  </td>
                </tr>
              ) : (
                movies.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2">
                      <img
                        src={`${TMDB_IMAGE_BASE}${m.poster_image_url}`}
                        alt={m.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium max-w-[200px] truncate">
                      {m.title}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {m.language}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {m.rating}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {m.release_date
                        ? new Date(m.release_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(m.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(m)}
                          className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-3 mt-3 text-sm">
            <button
              onClick={() => fetchMovies(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchMovies(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <hr className="dark:border-gray-700" />

      <div className="max-w-md">
        <h1 className="text-xl font-bold mb-4">Create Genre</h1>
        <form onSubmit={handleGenre} className="space-y-3">
          <input
            type="text"
            placeholder="Genre Name"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            required
          />
          <Button
            type="submit"
            fullWidth
            loading={genreSaving}
            loadingText="Creating…"
          >
            Create Genre
          </Button>
        </form>
      </div>

      {drawerOpen && (
        <MovieFormDrawer
          mode={drawerMode}
          movie={editingMovie}
          genres={genres}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => fetchMovies(pagination.page)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
