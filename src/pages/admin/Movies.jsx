import { useCallback, useEffect, useRef, useState } from "react";
import { del, get, post, put } from "../../api";
import Select from "react-select";
import { TMDB_IMAGE_BASE } from "../../utils/const";

const EMPTY_FORM = {
  title: "",
  source: "manual",
  tmdb_id: "",
  rating: "",
  language: "",
  adult: false,
  runtime: "",
  release_date: "",
  poster_image_url: "",
  backdrop_image_url: "",
  overview: "",
  genre_ids: [],
};

function MovieFormDrawer({ mode, movie, genres, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && movie) {
      setForm({
        title: movie.title ?? "",
        source: movie.source ?? "manual",
        tmdb_id: movie.tmdb_id ?? "",
        rating: movie.rating ?? "",
        language: movie.language ?? "",
        adult: movie.adult ?? false,
        runtime: movie.runtime ?? "",
        release_date: movie.release_date
          ? movie.release_date.split("T")[0]
          : "",
        poster_image_url: movie.poster_image_url ?? "",
        backdrop_image_url: movie.backdrop_image_url ?? "",
        overview: movie.overview ?? "",
        genre_ids: movie.genre_ids ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [mode, movie]);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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
        ...(form.source === "tmdb" && { tmdb_id: parseInt(form.tmdb_id) }),
      };

      if (mode === "edit") {
        await put(`/movie/${movie.id}`, body);
      } else {
        await post("/movie/", body);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300 text-sm";

  const selectedGenreOptions = genres
    .filter((g) => form.genre_ids.includes(g.id))
    .map((g) => ({ value: g.id, label: g.name }));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">
            {mode === "edit" ? "Edit Movie" : "Add Movie"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3 flex-1">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {mode === "edit" && movie?.source === "tmdb" && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2">
              This movie was imported from TMDB. Manual edits may be overwritten
              during sync.
            </p>
          )}

          <input
            type="text"
            placeholder="Movie Title"
            value={form.title}
            onChange={update("title")}
            className={inputClass}
            required
          />

          {mode === "create" && (
            <>
              <select
                value={form.source}
                onChange={update("source")}
                className={inputClass}
              >
                <option value="manual">Manual</option>
                <option value="tmdb">TMDB</option>
              </select>
              {form.source === "tmdb" && (
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="TMDB ID"
                  value={form.tmdb_id}
                  onChange={update("tmdb_id")}
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
            onChange={update("rating")}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Language"
            value={form.language}
            onChange={update("language")}
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
            onChange={update("runtime")}
            className={inputClass}
          />

          <input
            type="date"
            value={form.release_date}
            onChange={update("release_date")}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Poster Image Path"
            value={form.poster_image_url}
            onChange={update("poster_image_url")}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="Backdrop Image Path"
            value={form.backdrop_image_url}
            onChange={update("backdrop_image_url")}
            className={inputClass}
            required
          />

          <textarea
            placeholder="Overview"
            value={form.overview}
            onChange={update("overview")}
            rows={3}
            className={inputClass + " resize-none"}
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
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: "0.25rem",
                borderColor: "#000000",
                paddingTop: "0.175rem",
                paddingBottom: "0.175rem",
                boxShadow: state.isFocused
                  ? "0 0 0 2px #d1d5db"
                  : base.boxShadow,
                fontSize: "0.875rem",
              }),
              valueContainer: (base) => ({
                ...base,
                padding: "0.175rem 0.75rem",
              }),
            }}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 cursor-pointer text-sm font-medium mt-2"
          >
            {saving
              ? "Saving…"
              : mode === "edit"
                ? "Save Changes"
                : "Create Movie"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Movies() {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("create");
  const [editingMovie, setEditingMovie] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteHasShows, setDeleteHasShows] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [genreName, setGenreName] = useState("");
  const [genreMsg, setGenreMsg] = useState("");
  const [genreError, setGenreError] = useState("");

  const fetchMovies = useCallback(
    async (page = 1) => {
      try {
        const params = new URLSearchParams({ page });
        if (search) params.set("search", search);
        const { data, pagination: pg } = await get(`/movie?${params}`);
        setMovies(data);
        setPagination({
          page: pg.page,
          totalPages: pg.totalPages,
          totalItems: pg.totalItems,
        });
      } catch (err) {
        console.error("Failed to fetch movies:", err);
      }
    },
    [search],
  );

  useEffect(() => {
    async function init() {
      try {
        const { data } = await get("/movie/genres");
        setGenres(data);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
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
      setDrawerMode("edit");
      setDrawerOpen(true);
    } catch (err) {
      console.error("Failed to fetch movie:", err);
    }
  }

  async function openDelete(movie) {
    setDeleteError("");
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
    setDeleteError("");
    setDeleting(true);
    try {
      await del(`/movie/${deleteTarget.id}`);
      setDeleteTarget(null);
      const newTotalItems = pagination.totalItems - 1;
      const newTotalPages = Math.max(
        1,
        Math.ceil(newTotalItems / 20),
      );
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
    setGenreMsg("");
    setGenreError("");
    try {
      const data = await post("/movie/genre/", { name: genreName });
      setGenreMsg(`Genre created: ${data.genre?.name ?? genreName}`);
      setGenreName("");
      const { data: updated } = await get("/movie/genres");
      setGenres(updated);
    } catch (err) {
      setGenreError(err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Movie List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Movies</h1>
          <button
            onClick={() => {
              setDrawerMode("create");
              setEditingMovie(null);
              setDrawerOpen(true);
            }}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-800 cursor-pointer"
          >
            + Add Movie
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by title or TMDB ID…"
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 mb-3"
        />

        {deleteTarget && (
          <div className="mb-3 border border-red-200 bg-red-50 rounded px-4 py-3 text-sm space-y-2">
            {deleteHasShows ? (
              <p className="text-red-700 font-medium">
                Warning: <span className="font-bold">{deleteTarget.title}</span>{" "}
                has upcoming shows. Deleting it may affect existing bookings.
                This action cannot be undone.
              </p>
            ) : (
              <p className="text-red-700">
                Delete <span className="font-bold">{deleteTarget.title}</span>?
                This action cannot be undone.
              </p>
            )}
            {deleteError && (
              <p className="text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting
                  ? "Deleting…"
                  : deleteHasShows
                    ? "Delete Anyway"
                    : "Delete"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
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
                  <tr key={m.id} className="border-t hover:bg-gray-50">
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
                    <td className="px-3 py-2 text-gray-600">{m.language}</td>
                    <td className="px-3 py-2 text-gray-600">{m.rating}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {m.release_date
                        ? new Date(m.release_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(m.id)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(m)}
                          className="text-red-600 hover:underline cursor-pointer"
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
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchMovies(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <hr />

      {/* Genre Section */}
      <div className="max-w-md">
        <h1 className="text-xl font-bold mb-4">Create Genre</h1>
        <form onSubmit={handleGenre} className="space-y-3">
          {genreMsg && <p className="text-green-600 text-sm">{genreMsg}</p>}
          {genreError && <p className="text-red-500 text-sm">{genreError}</p>}
          <input
            type="text"
            placeholder="Genre Name"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 cursor-pointer"
          >
            Create Genre
          </button>
        </form>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <MovieFormDrawer
          mode={drawerMode}
          movie={editingMovie}
          genres={genres}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => fetchMovies(pagination.page)}
        />
      )}
    </div>
  );
}
