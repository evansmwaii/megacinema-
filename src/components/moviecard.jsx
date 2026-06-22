import { useState } from "react";
import MovieModal from "./moviemodal";
import "../css/MovieCard.css";

// The modal is rendered via a React Portal so it mounts on document.body,
// completely outside the movies-grid — this fixes the "duplicate card" bug.
import { createPortal } from "react-dom";

function MovieCard({ movie, isFavorite = false, onToggleFavorite }) {
  const [showModal, setShowModal] = useState(false);

  const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null;
  const title = movie.Title || movie.title || "Untitled";

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(movie);
  };

  return (
    <>
      <div className="movie-card">
        <div className="movie-poster">
          <button
            type="button"
            className={`favorite-button${isFavorite ? " favorite-button--active" : ""}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
          {poster ? (
            <img src={poster} alt={title} loading="lazy" />
          ) : (
            <div className="poster-placeholder">
              <span>{title[0] ?? "?"}</span>
            </div>
          )}
          <div className="movie-overlay">
            <p className="overlay-title">{title}</p>
            <p className="overlay-year">{movie.Year || movie.year}</p>
            <button
              className="overlay-tag"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              Watch Now
            </button>
          </div>
        </div>
        <div className="movie-info">
          <p className="movie-title">{title}</p>
          <p className="movie-year">{movie.Year || movie.year}</p>
        </div>
      </div>

      {/* Portal renders the modal on document.body — outside the grid entirely */}
      {showModal && createPortal(
        <MovieModal movie={movie} onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  );
}

export default MovieCard;
