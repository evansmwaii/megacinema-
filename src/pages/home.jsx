import MovieCard from "../components/moviecard";
import MovieModal from "../components/moviemodal";
import { useState, useEffect, useCallback } from "react";
import {
  getPopularMovies,
  getTopAnime,
  getPopularShows,
  getDocumentaries,
  getRomanceMovies,
  getScifiMovies,
  getHorrorMovies,
  getMixedContent,
  searchAll,
} from "../services/api";
import { WATCH_PROVIDERS, ANIME_PROVIDERS } from "../services/watchProviders";
import "../css/Home.css";

// ── Single row of tabs ──
const ALL_TABS = [
  { id: "movies",  label: "Films",          fn: getPopularMovies  },
  { id: "tv",      label: "TV Shows",       fn: getPopularShows   },
  { id: "anime",   label: "Anime",          fn: getTopAnime       },
  { id: "docs",    label: "Documentaries",  fn: getDocumentaries  },
  { id: "romance", label: "Romance",        fn: getRomanceMovies  },
  { id: "scifi",   label: "Sci-Fi",         fn: getScifiMovies    },
  { id: "horror",  label: "Horror",         fn: getHorrorMovies   },
];

const emptyState = (val) =>
  ALL_TABS.reduce((acc, t) => ({ ...acc, [t.id]: val }), {});

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
    return null;
  }
};

const HeroSlideshow = ({ movies, onOpenModal }) => {
  const [current, setCurrent] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  const [anilistId, setAnilistId] = useState(null);

  useEffect(() => {
    if (movies.length === 0 || playingId) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 8000);
    return () => clearInterval(timer);
  }, [movies, playingId]);

  if (movies.length === 0) return <div className="hero-placeholder" />;

  const featured = movies.slice(0, 5);

  const handlePlay = async (movie) => {
    if (playingId === movie.id) {
      setPlayingId(null);
      return;
    }
    
    if (movie.source === "jikan" || movie.type === "anime") {
      const id = await fetchAnilistId(movie.malId);
      setAnilistId(id);
    }
    setPlayingId(movie.id);
  };

  return (
    <div className="hero-slideshow">
      {featured.map((slide, index) => {
        const isActive = index === current;
        const isPlaying = playingId === slide.id;
        const backdrop = slide.backdrop || slide.poster; // fallback to poster if backdrop missing
        
        const isAnime = slide.source === "jikan" || slide.type === "anime";
        const providers = isAnime ? ANIME_PROVIDERS : WATCH_PROVIDERS;
        const tmdbId = slide.tmdbId || String(slide.id || "").replace("tmdb-", "");
        const embedUrl = providers[0].getUrl({ movie: slide, tmdbId, anilistId });

        return (
          <div 
            key={slide.id} 
            className={`slide ${isActive ? 'active' : ''} ${isPlaying ? 'playing' : ''}`}
          >
            <div className="slide-image" style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }} />
            
            {isPlaying && embedUrl && (
              <div className="hero-player-wrapper">
                <iframe
                  src={embedUrl}
                  title={`Watch ${slide.title}`}
                  allowFullScreen
                  allow="autoplay; fullscreen"
                  className="hero-iframe"
                />
                <button className="close-hero-player" onClick={() => setPlayingId(null)}>✕ Close Player</button>
              </div>
            )}

            {!isPlaying && (
              <div className="slide-content">
                <h2 className="slide-title">{slide.title || slide.name}</h2>
                <p className="slide-overview">{slide.overview || "Streaming now on Megacinema."}</p>
                <div className="hero-actions">
                  <button className="hero-btn hero-btn--play" onClick={() => handlePlay(slide)}>
                    <span className="icon">▶</span> Watch Now
                  </button>
                  <button className="hero-btn hero-btn--info" onClick={() => onOpenModal(slide)}>
                    <span className="icon">ⓘ</span> More Info
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

function Home({ favoriteIds, onToggleFavorite, searchQuery, setSearchQuery, triggerSearch }) {
  const [activeTab, setActiveTab]         = useState("movies");
  const [isSearching, setIsSearching]     = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [data, setData]       = useState(emptyState([]));
  const [loading, setLoading] = useState(emptyState(true));
  const [error, setError]     = useState(emptyState(null));

  // ── Load all tabs in parallel on mount ──
  useEffect(() => {
    ALL_TABS.forEach(async ({ id, fn }) => {
      try {
        const results = await fn();
        setData(prev => ({ ...prev, [id]: results }));
      } catch (err) {
        console.error(`Failed to load ${id}:`, err);
        setError(prev => ({ ...prev, [id]: `Failed to load ${id}.` }));
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }));
      }
    });
  }, []);

  // ── Global search ──
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      handleClear();
      return;
    }

    setIsSearching(true);
    setLoading(emptyState(true));

    try {
      const results = await searchAll(searchQuery);
      const movies  = results.filter(r => r.type === "movie");
      const tv      = results.filter(r => r.type === "tv");
      const anime   = results.filter(r => r.source === "jikan");

      setData(prev => ({ ...prev, movies, tv, anime, docs: [], romance: [], scifi: [], horror: [] }));
      setError(emptyState(null));

      const counts = { movies: movies.length, tv: tv.length, anime: anime.length };
      const best   = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setActiveTab(best);
    } catch (err) {
      console.error(err);
      setError(prev => ({ ...prev, movies: "Search failed. Try again." }));
    } finally {
      setLoading(emptyState(false));
    }
  }, [searchQuery]);

  useEffect(() => {
    if (triggerSearch > 0) {
      performSearch();
    }
  }, [triggerSearch, performSearch]);

  // ── Clear search ──
  const handleClear = () => {
    setSearchQuery("");
    setIsSearching(false);
    setActiveTab("movies");
    setLoading(emptyState(true));

    ALL_TABS.forEach(async ({ id, fn }) => {
      try {
        const results = await fn();
        setData(prev => ({ ...prev, [id]: results }));
      } catch {
        setError(prev => ({ ...prev, [id]: `Failed to reload ${id}.` }));
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }));
      }
    });
  };

  const currentItems   = data[activeTab] || [];
  const currentLoading = loading[activeTab];
  const currentError   = error[activeTab];
  const totalResults   = Object.values(data).flat().length;

  return (
    <div className="home">

      {/* ── Hero Slideshow ── */}
      <div className="home-hero-container">
        <HeroSlideshow movies={data.movies} onOpenModal={setSelectedMovie} />
        
        {isSearching && !Object.values(loading).some(Boolean) && (
          <div className="search-overlay">
            <p className="search-summary">
              {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
              <button className="clear-search-btn" onClick={handleClear}>Clear Search</button>
            </p>
          </div>
        )}
      </div>

      {/* ── Single tab row ── */}
      <div className="tabs-bar">
        {ALL_TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="tab-count">{data[tab.id]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="tab-content">
        {currentError && <div className="error-message">{currentError}</div>}

        {currentLoading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <span className="loading-text">Loading</span>
          </div>
        ) : currentItems.length === 0 ? (
          <p className="no-results">
            {isSearching
              ? `No results for "${searchQuery}" in this category.`
              : "Nothing to show here."}
          </p>
        ) : (
          <div className="movies-grid">
            {currentItems.map((item) => (
              <MovieCard
                movie={item}
                key={item.id}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {selectedMovie && (
        <MovieModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}

    </div>
  );
}

export default Home;
