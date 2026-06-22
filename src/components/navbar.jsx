import { Link, useNavigate, useLocation } from 'react-router-dom';
import "../css/Navbar.css";

function NavBar({ searchQuery, setSearchQuery, onSearch }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
    }
    onSearch();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">MEGACINEMA</Link>
      </div>

      <form onSubmit={handleSubmit} className="navbar-search">
        <input
          type="text"
          placeholder="Search everything…"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/favorites" className="nav-link">Favorites</Link>
        <Link to="/about" className="nav-link">About</Link>
      </div>
    </nav>
  );
}

export default NavBar;
