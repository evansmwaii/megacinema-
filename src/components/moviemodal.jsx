import { useState, useEffect, useCallback } from "react";
import "../css/moviemodal.css";
import { WATCH_PROVIDERS, ANIME_PROVIDERS } from "../services/watchProviders";

// ─────────────────────────────────────────────────────────────────
//  🎓 TEACHER NOTE — Why this file is more complex for anime:
//
//  For movies/TV:  we already have the TMDB ID → build URL → done.
//
//  For anime:      Jikan gives us a MAL ID. But the best embed
//                  players use AniList IDs. So when the modal opens
//                  for an anime, we first call the AniList GraphQL
//                  API to swap MAL ID → AniList ID. Then we build
//                  the embed URL. This extra step is called
//                  "ID resolution" and it's a common pattern when
//                  working with multiple databases.
// ─────────────────────────────────────────────────────────────────

const SOURCE_TIMEOUT_MS = 12000;

// ── AniList GraphQL query: give me the AniList ID for this MAL ID ──
const fetchAnilistId = async (malId) => {
  const query = `
    query ($malId: Int) {
      Media(idMal: $malId, type: ANIME) {
        id
      }
    }
  `;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ query, variables: { malId } }),
    });
    const data = await res.json();
    return data?.data?.Media?.id || null;
  } catch {
    return null; // If this fails, we fall back to MegaPlay which uses MAL ID
  }
};

function MovieModal({ movie, onClose }) {
  const isAnime   = movie?.source === "jikan" || movie?.type === "anime";
  const providers = isAnime ? ANIME_PROVIDERS : WATCH_PROVIDERS;

  const [sourceIndex,     setSourceIndex]     = useState(0);
  const [iframeKey,       setIframeKey]       = useState(0);
  const [isLoading,       setIsLoading]       = useState(true);
  const [playerStatus,    setPlayerStatus]    = useState("loading");
  const [failedSourceIds, setFailedSourceIds] = useState(() => new Set());

  // 🎓 anilistId starts as null. We fetch it from AniList when
  //    an anime modal opens. Once we have it, the providers can
  //    build their URLs.
  const [anilistId, setAnilistId] = useState(null);
  const [anilistLoading, setAnilistLoading] = useState(isAnime);

  const tmdbId     = movie?.tmdbId || String(movie?.id || "").replace("tmdb-", "");
  const movieTitle = movie?.Title || movie?.title || "this title";

  // ── Step 1: Resolve AniList ID when modal opens for an anime ──
  useEffect(() => {
    if (!isAnime || !movie?.malId) {
      setAnilistLoading(false);
      return;
    }

    setAnilistId(null);
    setAnilistLoading(true);

    fetchAnilistId(movie.malId).then((id) => {
      setAnilistId(id); // may be null if lookup failed — that's OK
      setAnilistLoading(false);
    });
  }, [movie?.malId, isAnime]);

  // ── Reset player when movie changes ──
  useEffect(() => {
    setSourceIndex(0);
    setIframeKey(k => k + 1);
    setIsLoading(true);
    setPlayerStatus("loading");
    setFailedSourceIds(new Set());
  }, [movie?.id]);

  // ── Build the current embed URL ──
  // 🎓 We pass both anilistId and the movie object so each provider
  //    can use whichever ID it needs (VidPlus needs anilistId,
  //    MegaPlay reads movie.malId directly as a fallback).
  const currentSource = providers[sourceIndex];
  const sourceUrl     = currentSource?.getUrl({ movie, tmdbId, anilistId }) || null;
  const embedUrl      = currentSource?.type === "embed"    ? sourceUrl : null;
  const externalUrl   = currentSource?.type === "external" ? sourceUrl : null;

  // ── Close on Escape ──
  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const switchSource = useCallback((i) => {
    const next    = providers[i];
    const nextUrl = next?.getUrl({ movie, tmdbId, anilistId }) || null;
    setSourceIndex(i);
    setIframeKey(k => k + 1);
    setIsLoading(next?.type === "embed");
    setPlayerStatus(
      next?.type === "external"
        ? (nextUrl ? "external" : "setup")
        : "loading"
    );
  }, [movie, tmdbId, anilistId, providers]);

  const getNextSourceIndex = useCallback((failedIds = failedSourceIds) => {
    const after = providers.findIndex((s, i) => i > sourceIndex && !failedIds.has(s.id));
    if (after !== -1) return after;
    return providers.findIndex((s, i) => i !== sourceIndex && !failedIds.has(s.id));
  }, [failedSourceIds, sourceIndex, providers]);

  const tryNext = useCallback(() => {
    const failed = new Set(failedSourceIds);
    failed.add(currentSource.id);
    setFailedSourceIds(failed);
    const next = getNextSourceIndex(failed);
    if (next === -1) { setIsLoading(false); setPlayerStatus("failed"); return; }
    switchSource(next);
  }, [currentSource?.id, failedSourceIds, getNextSourceIndex, switchSource]);

  // Auto-advance if iframe stalls
  useEffect(() => {
    if (!embedUrl || !isLoading || currentSource?.type !== "embed") return;
    const timer = window.setTimeout(tryNext, SOURCE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [currentSource?.type, embedUrl, isLoading, tryNext]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setPlayerStatus("loaded");
  };

  // ── While we're still fetching the AniList ID, show a specific message ──
  const showAnilistLoading = isAnime && anilistLoading;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-meta">
            <p className="modal-eyebrow">
              {isAnime ? "Now Streaming · Anime" : "Now Playing"}
            </p>
            <h2 className="modal-title">{movieTitle}</h2>
            <p className="modal-year">{movie?.Year || movie?.year}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-player">

          {/* AniList ID resolution step — shown before the player loads */}
          {showAnilistLoading && (
            <div className="player-loading">
              <div className="player-spinner" />
              <span>Locating anime stream…</span>
              <small>Resolving ID across databases.</small>
            </div>
          )}

          {!showAnilistLoading && isLoading && (
            <div className="player-loading">
              <div className="player-spinner" />
              <span>Loading {currentSource?.label}</span>
              <small>Will try another source automatically if this takes too long.</small>
            </div>
          )}

          {!showAnilistLoading && playerStatus === "failed" && (
            <div className="player-error player-error--stacked">
              <strong>No working source found.</strong>
              <span>{movieTitle} may not be available right now.</span>
              <button
                className="player-retry-btn"
                onClick={() => { setFailedSourceIds(new Set()); switchSource(0); }}
              >
                Retry sources
              </button>
            </div>
          )}

          {!showAnilistLoading && playerStatus === "external" && (
            <div className="player-error player-error--stacked player-external">
              <strong>Open CinePro</strong>
              <span>Use CinePro through its permitted page for {movieTitle}.</span>
              <a className="player-retry-btn" href={externalUrl} target="_blank" rel="noopener noreferrer">
                Open CinePro
              </a>
            </div>
          )}

          {!showAnilistLoading && playerStatus === "setup" && (
            <div className="player-error player-error--stacked">
              <strong>CinePro needs setup.</strong>
              <span>{currentSource?.setupMessage}</span>
            </div>
          )}

          {!showAnilistLoading && embedUrl && (
            <iframe
              key={iframeKey}
              src={embedUrl}
              title={`Watch ${movieTitle}`}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
              onLoad={handleIframeLoad}
              className={`player-iframe${isLoading ? " player-iframe--hidden" : ""}`}
              referrerPolicy="no-referrer"
            />
          )}

          {!showAnilistLoading && !embedUrl && currentSource?.type !== "external" && (
            <div className="player-error">
              No valid ID found for this title.
              {isAnime && !anilistId && (
                <span> AniList lookup returned nothing — try MegaPlay source.</span>
              )}
            </div>
          )}

        </div>

        <div className="modal-footer">
          <div className="source-switcher">
            <span className="source-label">Source:</span>
            {providers.map((src, i) => (
              <button
                key={src.id}
                className={[
                  "source-btn",
                  i === sourceIndex           ? "source-btn--active" : "",
                  failedSourceIds.has(src.id) ? "source-btn--failed" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => switchSource(i)}
              >
                {src.label}
              </button>
            ))}
            <button className="source-btn source-btn--next" onClick={tryNext}>
              Try Next
            </button>
          </div>

          {/* Download only applies to movie/TV content */}
          {!isAnime && (
            <a
              href={`https://dl.vidsrc.vip/movie/${tmdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="download-btn"
            >
              ↓ Download
            </a>
          )}
        </div>

        <p className="modal-disclaimer">
          {playerStatus === "external"
            ? "External providers open in a new tab. Press Esc to close."
            : playerStatus === "loaded"
            ? "If the player says unavailable, use Try Next. Press Esc to close."
            : "Sources are checked one by one. Press Esc to close."}
        </p>

      </div>
    </div>
  );
}

export default MovieModal;