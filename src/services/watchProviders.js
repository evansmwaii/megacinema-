// ─────────────────────────────────────────────────────────────────
//  MEGACINEMA — Watch Providers
//
//  🎓 DEVELOPER TEACHER NOTE:
//
//  Not every anime website can be used as an iframe source.
//  A server can send a header called X-Frame-Options: DENY
//  which tells your browser "refuse to render me inside an iframe".
//  Sites like animekai.to, kisskh.co block iframes this way.
//
//  The sites in ANIME_PROVIDERS below are specifically built
//  to be embedded — they intentionally allow iframe loading.
//
//  ID systems used:
//    - WATCH_PROVIDERS   → TMDB ID  (movies & TV)
//    - ANIME_PROVIDERS   → AniList ID (primary) + MAL ID (fallback)
//      AniList and MAL are different databases with different IDs.
//      We fetch the AniList ID from MAL ID in moviemodal.jsx.
// ─────────────────────────────────────────────────────────────────

const cineproSearchUrl = import.meta.env.VITE_CINEPRO_SEARCH_URL || "";

const fillTemplate = (template, movie) => {
  const query  = encodeURIComponent(movie.Title || movie.title || "");
  const tmdbId = movie.tmdbId || String(movie.id || "").replace("tmdb-", "");
  return template
    .replaceAll("{query}",  query)
    .replaceAll("{title}",  query)
    .replaceAll("{tmdbId}", encodeURIComponent(tmdbId));
};

/**
 * 🎓 Turn an anime title into a URL slug.
 * "Fullmetal Alchemist: Brotherhood" → "fullmetal-alchemist-brotherhood"
 * autoembed.cc uses this in its URL path.
 */
const toAnimeSlug = (title = "") =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  // strip colons, apostrophes, etc.
    .trim()
    .replace(/\s+/g, "-");          // spaces → hyphens

// ──────────────────────────────────────────────
//  MOVIE & TV PROVIDERS  (TMDB ID)
// ──────────────────────────────────────────────
export const WATCH_PROVIDERS = [
  {
    id:    "vidsrc",
    label: "VidSrc",
    type:  "embed",
    getUrl: ({ tmdbId }) =>
      tmdbId ? `https://vidsrc.to/embed/movie/${tmdbId}` : null,
  },
  {
    id:    "2embed",
    label: "2Embed",
    type:  "embed",
    getUrl: ({ tmdbId }) =>
      tmdbId ? `https://2embed.cc/embed/tmdb/movie?id=${tmdbId}` : null,
  },
  {
    id:    "autoembed",
    label: "AutoEmbed",
    type:  "embed",
    getUrl: ({ tmdbId }) =>
      tmdbId ? `https://autoembed.co/movie/tmdb/${tmdbId}` : null,
  },
  {
    id:    "superembed",
    label: "SuperEmbed",
    type:  "embed",
    getUrl: ({ tmdbId }) =>
      tmdbId ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1` : null,
  },
  {
    id:    "cinepro",
    label: "CinePro",
    type:  "external",
    getUrl: ({ movie }) =>
      cineproSearchUrl ? fillTemplate(cineproSearchUrl, movie) : null,
    setupMessage:
      "Set VITE_CINEPRO_SEARCH_URL to an official CinePro search or watch URL template.",
  },
];

// ──────────────────────────────────────────────
//  ANIME PROVIDERS
//
//  🎓 These are listed in priority order — best first.
//  The modal tries index 0 first, then auto-advances
//  if the iframe stalls or the user clicks "Try Next".
//
//  Sources:
//  1. tryembed   — confirmed working (AniList ID)
//  2. autoembed  — confirmed, docs at autoembed.cc/anime (title slug)
//  3. vidplus    — documented iframe support (AniList ID)
//  4. megaplay   — accepts MAL ID directly, good fallback
// ──────────────────────────────────────────────
export const ANIME_PROVIDERS = [
  {
    // ✅ CONFIRMED WORKING — this is what was already working for you
    // Uses AniList ID. Format: /embed/anime/{anilistId}/{episode}/sub
    id:    "tryembed",
    label: "TryEmbed",
    type:  "embed",
    getUrl: ({ anilistId }) =>
      anilistId
        ? `https://tryembed.us.cc/embed/anime/${anilistId}/1/sub`
        : null,
  },
  {
    // ✅ CONFIRMED — autoembed.cc explicitly built for iframe embedding
    // Uses title slug. Format: /embed/{title-slug}-episode-{n}
    // Docs: https://autoembed.cc/anime/
    id:    "autoembed-anime",
    label: "AutoEmbed",
    type:  "embed",
    getUrl: ({ movie }) => {
      const title = movie?.Title || movie?.title;
      if (!title) return null;
      const slug = toAnimeSlug(title);
      return `https://anime.autoembed.cc/embed/${slug}-episode-1`;
    },
  },
  {
    // 📄 DOCUMENTED — vidplus explicitly shows anime iframe examples
    // in their GitHub readme. Uses AniList ID.
    id:    "vidplus",
    label: "VidPlus",
    type:  "embed",
    getUrl: ({ anilistId }) =>
      anilistId
        ? `https://player.vidplus.to/embed/anime/${anilistId}/1`
        : null,
  },
  {
    // 🔁 FALLBACK — accepts MAL ID directly, no AniList needed
    // Good safety net when AniList lookup fails.
    id:    "megaplay",
    label: "MegaPlay",
    type:  "embed",
    getUrl: ({ movie }) =>
      movie?.malId
        ? `https://megaplay.buzz/stream/mal/${movie.malId}/1/sub`
        : null,
  },
];