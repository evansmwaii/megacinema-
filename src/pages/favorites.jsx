import "../css/Favorites.css";
import MovieCard from "../components/moviecard";

function Favorites({ favorites, favoriteIds, onToggleFavorite }) {
  return (
    <div className="favorites">
      <div className="favorites-hero">
        <p className="hero-eyebrow">Saved List</p>
        <h1 className="hero-title">Favorites <span>{favorites.length}</span></h1>
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <div className="empty-icon">♡</div>
          <h2>No Favorites Yet</h2>
          <p>Your favorite movies will appear here. Start adding some.</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((movie) => (
            <MovieCard
              movie={movie}
              key={movie.id}
              isFavorite={favoriteIds.has(movie.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
