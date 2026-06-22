// ─────────────────────────────────────────────
//  MEGACINEMA — Multi-Source API Layer
//  Sources: TMDB · OMDb · Jikan · TVmaze
// ─────────────────────────────────────────────


// ══════════════════════════════════════════════
//  1. TMDB — Primary movie & TV source
//  Docs: https://developer.themoviedb.org
//  Posters: https://image.tmdb.org/t/p/w500{poster_path}
// ══════════════════════════════════════════════
const TMDB_KEY  = "4b872258f56621711d9210efd2377efd";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG  = "https://image.tmdb.org/t/p/w500";

// TMDB Genre IDs
const GENRE = {
  romance:     10749,
  scifi:       878,
  horror:      27,
  documentary: 99,
  action:      28,
  comedy:      35,
  drama:       18,
};

const tmdbFetch = async (path) => {
  const res  = await fetch(`${TMDB_BASE}${path}&api_key=${TMDB_KEY}`);
  return res.json();
};

const normalizeTMDB = (m) => ({
  id:      `tmdb-${m.id}`,
  tmdbId:  m.id,
  imdbID:  m.imdb_id || null,
  title:   m.title || m.name,
  Title:   m.title || m.name,
  year:    (m.release_date || m.first_air_date || "").split("-")[0] || "—",
  Year:    (m.release_date || m.first_air_date || "").split("-")[0] || "—",
  poster:  m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
  Poster:  m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
  backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null,
  rating:  m.vote_average?.toFixed(1),
  plot:    m.overview,
  source:  "tmdb",
  type:    m.media_type || (m.title ? "movie" : "tv"),
});

/** Trending movies this week */
export const getPopularMovies = async () => {
  const data = await tmdbFetch(`/trending/movie/week?`);
  return (data.results || []).map(normalizeTMDB);
};

/** Popular TV shows */
export const getPopularShows = async () => {
  const data = await tmdbFetch(`/tv/popular?`);
  return (data.results || []).map(normalizeTMDB);
};

/** Documentaries */
export const getDocumentaries = async () => {
  const data = await tmdbFetch(`/discover/movie?with_genres=${GENRE.documentary}&sort_by=popularity.desc&`);
  return (data.results || []).map(normalizeTMDB);
};

/** Romance movies */
export const getRomanceMovies = async () => {
  const data = await tmdbFetch(`/discover/movie?with_genres=${GENRE.romance}&sort_by=popularity.desc&`);
  return (data.results || []).map(normalizeTMDB);
};

/** Sci-Fi movies */
export const getScifiMovies = async () => {
  const data = await tmdbFetch(`/discover/movie?with_genres=${GENRE.scifi}&sort_by=popularity.desc&`);
  return (data.results || []).map(normalizeTMDB);
};

/** Horror movies */
export const getHorrorMovies = async () => {
  const data = await tmdbFetch(`/discover/movie?with_genres=${GENRE.horror}&sort_by=popularity.desc&`);
  return (data.results || []).map(normalizeTMDB);
};

/** Search movies via TMDB */
export const searchMovies = async (query) => {
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&`);
  return (data.results || []).map(normalizeTMDB);
};

/** Search TV shows via TMDB */
export const searchTVShows = async (query) => {
  const data = await tmdbFetch(`/search/tv?query=${encodeURIComponent(query)}&`);
  return (data.results || []).map(normalizeTMDB);
};

/** Full movie details by TMDB ID — includes imdb_id for the video player */
export const getMovieById = async (tmdbId) => {
  const data = await tmdbFetch(`/movie/${tmdbId}?append_to_response=external_ids&`);
  if (data.success === false) return null;
  const normalized = normalizeTMDB(data);
  normalized.imdbID = data.imdb_id || data.external_ids?.imdb_id || null;
  return normalized;
};

/** Search across movies + TV via TMDB multi-search */
export const searchTMDB = async (query) => {
  const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(query)}&`);
  return (data.results || [])
    .filter(r => r.media_type === "movie" || r.media_type === "tv")
    .map(normalizeTMDB);
};


// ══════════════════════════════════════════════
//  2. OMDb — Fallback / IMDb rating enrichment
//  Docs: https://www.omdbapi.com/
//  Still useful for fetching by IMDb ID
// ══════════════════════════════════════════════
const OMDB_KEY  = "36f7064a";
const OMDB_BASE = "https://www.omdbapi.com";

/** Get OMDb details by IMDb ID — useful for extra ratings data */
export const getOMDbById = async (imdbId) => {
  const res  = await fetch(`${OMDB_BASE}/?apikey=${OMDB_KEY}&i=${imdbId}&plot=full`);
  const data = await res.json();
  if (data.Response === "False") return null;
  return {
    imdbRating:    data.imdbRating,
    rottenTomatoes: data.Ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value || null,
    rated:         data.Rated,
    runtime:       data.Runtime,
    awards:        data.Awards,
    plot:          data.Plot,
  };
};


// ══════════════════════════════════════════════
//  3. Jikan — Anime (MyAnimeList unofficial)
//  Docs: https://docs.api.jikan.moe/
//  Key required: NONE
// ══════════════════════════════════════════════
const JIKAN_BASE = "https://api.jikan.moe/v4";

const normalizeJikan = (a) => ({
  id:       `jikan-${a.mal_id}`,
  malId:    a.mal_id,
  title:    a.title_english || a.title,
  Title:    a.title_english || a.title,
  year:     a.aired?.prop?.from?.year?.toString() || "—",
  Year:     a.aired?.prop?.from?.year?.toString() || "—",
  poster:   a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
  Poster:   a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
  rating:   a.score?.toString(),
  genre:    a.genres?.map(g => g.name).join(", "),
  plot:     a.synopsis,
  episodes: a.episodes,
  source:   "jikan",
  type:     "anime",
});

/** Top anime of all time */
export const getTopAnime = async (limit = 20) => {
  const res  = await fetch(`${JIKAN_BASE}/top/anime?limit=${limit}`);
  const data = await res.json();
  return (data.data || []).map(normalizeJikan);
};

/** Search anime by keyword */
export const searchAnime = async (query) => {
  const res  = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`);
  const data = await res.json();
  return (data.data || []).map(normalizeJikan);
};

/** Currently airing seasonal anime */
export const getSeasonalAnime = async (limit = 20) => {
  const res  = await fetch(`${JIKAN_BASE}/seasons/now?limit=${limit}`);
  const data = await res.json();
  return (data.data || []).map(normalizeJikan);
};

/** Mixed content for the home display */
export const getMixedContent = async () => {
  const [movies, anime, docs] = await Promise.allSettled([
    getPopularMovies(),
    getTopAnime(10),
    getDocumentaries()
  ]);

  const movieResults = movies.status === "fulfilled" ? movies.value.slice(0, 10) : [];
  const animeResults = anime.status === "fulfilled" ? anime.value.slice(0, 10) : [];
  const docResults   = docs.status   === "fulfilled" ? docs.value.slice(0, 10)   : [];

  const mixed = [];
  const max = Math.max(movieResults.length, animeResults.length, docResults.length);
  
  for (let i = 0; i < max; i++) {
    if (movieResults[i]) mixed.push(movieResults[i]);
    if (animeResults[i]) mixed.push(animeResults[i]);
    if (docResults[i])   mixed.push(docResults[i]);
  }
  
  return mixed;
};


// ══════════════════════════════════════════════
//  4. TVmaze — Extra TV / schedule data
//  Docs: https://www.tvmaze.com/api
//  Key required: NONE
// ══════════════════════════════════════════════
const TVMAZE_BASE = "https://api.tvmaze.com";

const normalizeTVmaze = (s) => {
  if (!s) return null;
  return {
    id:       `tvmaze-${s.id}`,
    tvmazeId: s.id,
    imdbID:   s.externals?.imdb || null,
    title:    s.name,
    Title:    s.name,
    year:     s.premiered?.split("-")[0] || "—",
    Year:     s.premiered?.split("-")[0] || "—",
    poster:   s.image?.original || s.image?.medium || null,
    Poster:   s.image?.original || s.image?.medium || null,
    rating:   s.rating?.average?.toString(),
    genre:    s.genres?.join(", "),
    plot:     s.summary?.replace(/<[^>]+>/g, ""),
    source:   "tvmaze",
    type:     "tv",
  };
};

/** Search TV shows via TVmaze (fallback / supplement to TMDB) */
export const searchTVShowsFallback = async (query) => {
  const res  = await fetch(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return (data || []).map(item => normalizeTVmaze(item.show)).filter(Boolean);
};


// ══════════════════════════════════════════════
//  5. UNIFIED SEARCH — all sources at once
// ══════════════════════════════════════════════

/**
 * Hits TMDB (movies + TV), Jikan (anime) simultaneously.
 * Returns merged array split by type.
 */
export const searchAll = async (query) => {
  const [tmdb, anime] = await Promise.allSettled([
    searchTMDB(query),
    searchAnime(query),
  ]);

  const tmdbResults  = tmdb.status  === "fulfilled" ? tmdb.value  : [];
  const animeResults = anime.status === "fulfilled" ? anime.value : [];

  const movies  = tmdbResults.filter(r => r.type === "movie");
  const tvShows = tmdbResults.filter(r => r.type === "tv");

  return [...movies, ...tvShows, ...animeResults];
};