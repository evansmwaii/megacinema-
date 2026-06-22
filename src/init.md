# Megacinema Project Log

## Project Goal
Megacinema is a React/Vite movie streaming web app. The current direction is to build a usable media discovery and streaming interface with movies, TV shows, anime, documentaries, genre tabs, search, favorites, and an embedded watch modal.

## Current Technology Stack
- React 19
- Vite 8
- React Router DOM 7
- Vanilla CSS
- APIs: TMDB, OMDb, Jikan, TVmaze

## Current Project Structure
- `src/main.jsx`: Entry point. Imports global CSS, wraps `App` in `BrowserRouter` and `StrictMode`.
- `src/App.jsx`: Main app layout and routes. Renders `NavBar`, `/`, and `/favorites`.
- `src/pages/home.jsx`: Home page with hero text, search, category tabs, loading/error states, and movie grid.
- `src/pages/favorites.jsx`: Favorites page placeholder.
- `src/components/navbar.jsx`: Main navigation with MEGACINEMA brand, Home link, and Favorites link.
- `src/components/moviecard.jsx`: Media card. Opens the watch modal through a React portal.
- `src/components/moviemodal.jsx`: Embedded streaming modal with multiple iframe sources and source switching.
- `src/services/api.js`: API layer. Fetches and normalizes TMDB movies/TV, Jikan anime, TVmaze TV, and OMDb detail enrichment.
- `src/css/`: CSS folder for app, global, page, component, and modal styles.
- `public/`: Static icons and favicon.

## Current App Behavior
- Home loads all tabs in parallel on mount: Films, TV Shows, Anime, Documentaries, Romance, Sci-Fi, and Horror.
- Search runs across TMDB multi-search and Jikan anime search, then routes results into the most relevant tab.
- Movie cards display posters, title, year, and a "Watch Now" button.
- Watch modal uses TMDB IDs for third-party embed URLs and supports source switching.
- Favorites is currently only a placeholder page; no persistence or favorite toggling exists yet.

## 2026-06-13 Debug Session
- User ran `npm run dev` and Vite failed to resolve two CSS imports.
- Inspected project files with `rg --files`.
- Confirmed this is not currently a Git repository from `/home/evans/react/reactapp`; `git status --short` returned `fatal: not a git repository`.
- Read core app files: `src/main.jsx`, `src/App.jsx`, `src/pages/home.jsx`, `src/pages/favorites.jsx`, `src/components/navbar.jsx`, `src/components/moviecard.jsx`, `src/components/moviemodal.jsx`, and `src/services/api.js`.
- Read relevant CSS files: `src/css/App.css`, `src/css/Home.css`, and `src/css/Favorites.css`.
- Found that CSS files live under `src/css`, while two imports pointed outside `src`:
  - `src/App.jsx` imported `../css/App.css`, which resolved to `/home/evans/react/reactapp/css/App.css`.
  - `src/pages/favorites.jsx` imported `../../css/Favorites.css`, which also resolved outside `src`.
- Fixed `src/App.jsx` to import `./css/App.css`.
- Fixed `src/pages/favorites.jsx` to import `../css/Favorites.css`.
- Read remaining docs, config, CSS, and public SVG files to understand the app structure.
- Found `src/css/moviemodal.css` started with plain text instead of a CSS comment. Replaced it with `/* Movie modal styles */` so the first modal selector parses cleanly.
- Verified the app with `npm run build`; Vite completed successfully and generated `dist/`.

## 2026-06-13 Category Counts Restore
- User asked to restore the feature showing the number of results under each category/tab.
- Confirmed `src/css/Home.css` already had `.tab-count` styling for count badges.
- Updated `src/pages/home.jsx` so each tab renders its label plus a count badge from `data[tab.id]?.length ?? 0`.
- Counts now update automatically after initial category loading, global search, and clearing search because they read from the existing `data` state.

## 2026-06-13 Favorites Like Button
- User asked for a like button to add movies to Favorites.
- Added app-level favorites state in `src/App.jsx`, persisted under `localStorage` key `megacinema:favorites`.
- Added `toggleFavorite` logic to add/remove movies by `movie.id`.
- Passed favorite state and toggle handler into `Home`, `Favorites`, and `MovieCard`.
- Updated `src/components/moviecard.jsx` with a heart button on each poster. The button shows filled state when saved and removes the movie when clicked again.
- Rebuilt `src/pages/favorites.jsx` from a placeholder into a real saved-movies grid using `MovieCard`.
- Added favorite button styles in `src/css/MovieCard.css` and Favorites grid styles in `src/css/Favorites.css`.

## 2026-06-13 Livelier UI Pass
- User asked to make the UI a little more lively.
- Updated global background in `src/css/index.css` with subtle layered color accents while keeping the dark cinema style.
- Enhanced `src/css/Navbar.css` with a richer translucent gradient header and animated link underline color.
- Updated `src/css/Home.css` with the existing `src/assets/hero.png` in the hero area, animated hero divider line, stronger search focus state, livelier tab hover/active states, and gradient grid backing.
- Updated `src/css/MovieCard.css` with card lift/shadow hover behavior, richer poster hover saturation, stronger watch button styling, and a more expressive active favorite state.
- Updated `src/css/Favorites.css` so Favorites uses the same livelier background treatment and a warmer empty-state icon.
- Verified with `npm run build` and `npm run lint`; both passed.

## 2026-06-13 Remove Vite Symbol
- User asked to remove the Vite symbol visible around the Home/Favorites browser UI.
- Searched the project for Vite logo references and confirmed React components were not rendering `vite.svg`.
- Replaced the default Vite `public/favicon.svg` with a small MEGACINEMA-style SVG favicon.
- Removed unused `src/assets/vite.svg`.

## 2026-06-13 Remove Boxed Hero Background
- User clarified the visible symbol was the boxed/bubble-like background beside the search button, not the browser favicon.
- Removed `url("../assets/hero.png")` from the desktop and mobile `.home-hero::before` background layers in `src/css/Home.css`.
- Kept the darker gradient and radial lighting in the hero so the page still has depth without the boxed image.

## 2026-06-13 Watch Source Failover
- User asked to reduce unavailable/slow-loading watch errors.
- Updated `src/components/moviemodal.jsx` with a 10 second source timeout.
- The modal now marks timed-out sources as failed and automatically tries the next provider instead of leaving the player stuck loading.
- Added a "No working source found" state with a Retry Sources button when all providers fail.
- Added source failure styling in `src/css/moviemodal.css`, including crossed-out failed source buttons and clearer loading/error messages.
- Kept manual source switching and Try Next available because cross-origin iframes cannot reliably expose provider-side "not available" messages to the app.

## 2026-06-13 CinePro Provider Slot
- User asked to add CinePro to the app.
- Added `src/services/watchProviders.js` as a watch-provider registry instead of keeping all providers hardcoded inside the modal.
- Moved existing embed providers into the provider registry.
- Added CinePro as an external provider, not a scraper. It opens a permitted CinePro search/watch URL when configured.
- Added `.env.example` with `VITE_CINEPRO_SEARCH_URL=https://your-official-cinepro-domain.example/search?q={query}`.
- Updated `src/components/moviemodal.jsx` so external providers show an "Open CinePro" panel instead of trying to iframe or scrape them.

## 2026-06-13 About Page
- User asked for an About site page next to Home and Favorites.
- Added `src/pages/about.jsx` with site/about copy stating the site was made by Teliko Technology and the main engineer is Evans Mwai.
- Added `src/css/About.css` with styling that matches the current dark cinema UI.
- Updated `src/App.jsx` with the `/about` route.
- Updated `src/components/navbar.jsx` with an About link next to Home and Favorites.

## 2026-06-13 About Page Visibility
- User said the Teliko Technology and Evans Mwai credits were not visible enough.
- Promoted both names into the main About hero in `src/pages/about.jsx`.
- Updated `src/css/About.css` so the names appear as the first viewport signal, with Teliko Technology and Evans Mwai stacked inside the hero title.

## 2026-06-13 About Page Readability Fix
- User reported the About page looked blank.
- Strengthened the About page background and contrast in `src/css/About.css`.
- Increased lede and card contrast so the hero, company credit, and engineer credit read clearly against the dark UI.

## 2026-06-13 About Page Simplification
- User asked to keep the About page brief.
- Replaced the large About layout with a minimal centered credit block.
- Reduced the text to `Teliko Technology` and `Engineer: Evans Mwai` with small typography.

## 2026-06-13 About Contact Tweak
- User asked to capitalize the company name and add a phone number.
- Updated the About page credit to `TELIKO TECHNOLOGY`.
- Added the phone number `0724862896` beneath the engineer line in the minimal About block.

## Notes For Next Work
- `src/layout.md` still describes CSS as living outside `src`; that document is stale and should be corrected later.
- API keys are currently hardcoded in `src/services/api.js`; this works for quick development but should move to environment variables before serious use or deployment.
- Favorites UI has CSS for richer empty-state classes, but the JSX currently uses simpler `favorites`, `h2`, and `p` markup.
