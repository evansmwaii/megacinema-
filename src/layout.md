# Project Layout: Movie App

This document explains the layout and architecture of the Movie App to help an AI understand the project structure.

## Overview
The application is a React-based web app (likely built with Vite) that allows users to search for movies and manage a favorites list. It uses `react-router-dom` for navigation.

## Directory Structure (inside `src/`)
- `main.jsx`: The application entry point. It wraps the `App` component with `BrowserRouter` and `StrictMode`.
- `App.jsx`: The root component that defines the overall layout. It includes the `NavBar` and uses a `<main>` container to render routes.
- `components/`: Contains reusable UI components.
    - `navbar.jsx`: The navigation header containing links to the Home and Favorites pages.
    - `moviecard.jsx`: A card component used to display individual movie details (title, year, poster) and a "favorite" button.
- `pages/`: Contains the main page views.
    - `home.jsx`: The landing page featuring a search input and a grid of `MovieCard` components. It handles search logic.
    - `favorites.jsx`: A page dedicated to displaying the user's favorite movies.
- `assets/`: Contains static images and icons (e.g., `hero.png`, `react.svg`).

## Routing
The application uses client-side routing with the following paths:
- `/`: Displays the `Home` page.
- `/favorites`: Displays the `Favorites` page.

## Styling Architecture
Styles are managed via CSS files located in a sibling directory to `src` (at `../css/`). Each major component and page has its own dedicated CSS file:
- `index.css`: Global styles.
- `App.css`: Layout-specific styles for the root component.
- `Navbar.css`: Styles for the navigation bar.
- `MovieCard.css`: Styles for the movie cards and their interactive elements.
- `Home.css`: Styles for the search form and movie grid layout.
- `Favorites.css`: Styles for the favorites page layout.

## Data Flow
- **Movies**: Currently, the `Home` page uses a hardcoded list of movie objects.
- **Search**: The search functionality filters movies based on the `searchTerm` state in `home.jsx`.
- **Favorites**: The favorites functionality is currently a placeholder (alerts "clicked" in `MovieCard.jsx`).
