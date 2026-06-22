import { Routes, Route } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './css/App.css';

import Home from './pages/home';
import Favorites from './pages/favorites';
import About from './pages/about';
import NavBar from './components/navbar';

const FAVORITES_KEY = 'megacinema:favorites';

function App() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [triggerSearch, setTriggerSearch] = useState(0);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((movie) => movie.id)),
    [favorites]
  );

  const toggleFavorite = (movie) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.id === movie.id);
      if (exists) {
        return current.filter((item) => item.id !== movie.id);
      }
      return [movie, ...current];
    });
  };

  return (
    <div>
      <NavBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onSearch={() => setTriggerSearch(prev => prev + 1)}
      />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                triggerSearch={triggerSearch}
              />
            }
          />
          <Route
            path="/favorites"
            element={
              <Favorites
                favorites={favorites}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
