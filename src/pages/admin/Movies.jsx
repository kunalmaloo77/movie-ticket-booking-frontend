import { useEffect, useState } from "react";
import { get, post } from "../../api";
import Select from "react-select";

export default function Movies() {
  const [genreName, setGenreName] = useState("");
  const [genreMsg, setGenreMsg] = useState("");
  const [genreError, setGenreError] = useState("");
  const [genres, setGenres] = useState([]);

  const [form, setForm] = useState({
    movie_name: "",
    source: "manual",
    tmdb_id: "",
    rating: "",
    language: "",
    censor_rating: "",
    duration_minutes: "",
    release_date: "",
    poster_image_url: "",
    genre_ids: [],
  });
  const [movieMsg, setMovieMsg] = useState("");
  const [movieError, setMovieError] = useState("");

  useEffect(() => {
    async function fetchGenres() {
      try {
        const data = await get("/movie/genres");
        setGenres(data);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
    }
    fetchGenres();
  }, []);

  async function handleGenre(e) {
    e.preventDefault();
    setGenreMsg("");
    setGenreError("");
    try {
      const data = await post("/movie/genre/", { name: genreName });

      setGenreMsg(
        `Genre created: ${data.genre.name} (id: ${data.genre.id})`,
      );
      setGenreName("");
    } catch (err) {
      setGenreError(err.message);
    }
  }

  async function handleMovie(e) {
    e.preventDefault();
    setMovieMsg("");
    setMovieError("");
    try {
      const body = {
        ...form,
        rating: parseFloat(form.rating),
        duration_minutes: parseInt(form.duration_minutes),
        genre_ids: form.genre_ids.map((genre) => genre.id),
        ...(form.source === "tmdb" && { tmdb_id: parseInt(form.tmdb_id) }),
      };
      const data = await post("/movie/", body);
      setMovieMsg(`Movie created: ${data.movie.movie_name}`);
      setForm({
        movie_name: "",
        source: "manual",
        tmdb_id: "",
        rating: "",
        language: "",
        censor_rating: "",
        duration_minutes: "",
        release_date: "",
        poster_image_url: "",
        genre_ids: [],
      });
    } catch (err) {
      setMovieError(err.message);
    }
  }

  function update(field) {
    if (field === "genre_ids") {
      return (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedGenres = selectedOptions
          .map((option) => {
            const genre = genres.find((g) => g.id === parseInt(option.value));
            return genre ? genre : null;
          })
          .filter((g) => g !== null);
        setForm({ ...form, genre_ids: selectedGenres });
      };
    }
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      {/* Genre Section */}
      <div>
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

      <hr />

      {/* Movie Section */}
      <div>
        <h1 className="text-xl font-bold mb-4">Create Movie</h1>
        <form onSubmit={handleMovie} className="space-y-3">
          {movieMsg && <p className="text-green-600 text-sm">{movieMsg}</p>}
          {movieError && <p className="text-red-500 text-sm">{movieError}</p>}
          <input
            type="text"
            placeholder="Movie Name"
            value={form.movie_name}
            onChange={update("movie_name")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <select
            value={form.source}
            onChange={update("source")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
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
              className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
              required
            />
          )}
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="Rating (0-10)"
            value={form.rating}
            onChange={update("rating")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <input
            type="text"
            placeholder="Language"
            value={form.language}
            onChange={update("language")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <input
            type="text"
            placeholder="Censor Rating (U, UA, A, R)"
            value={form.censor_rating}
            onChange={update("censor_rating")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <Select
            placeholder="Select Movie Genres"
            isMulti
            options={genres.map((genre) => ({
              value: genre.id,
              label: genre.name,
            }))}
            onChange={(selectedOptions) => {
              const selectedGenres = (selectedOptions || [])
                .map((option) => {
                  const genre = genres.find((g) => g.id === option.value);
                  return genre ? genre : null;
                })
                .filter((g) => g !== null);
              setForm({ ...form, genre_ids: selectedGenres });
            }}
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
              }),
              valueContainer: (base) => ({
                ...base,
                padding: "0.175rem 0.75rem",
              }),
            }}
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={form.duration_minutes}
            onChange={update("duration_minutes")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <input
            type="date"
            placeholder="Release Date"
            value={form.release_date}
            onChange={update("release_date")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <input
            type="url"
            placeholder="Poster Image URL"
            value={form.poster_image_url}
            onChange={update("poster_image_url")}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
            required
          />
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 cursor-pointer"
          >
            Create Movie
          </button>
        </form>
      </div>
    </div>
  );
}
