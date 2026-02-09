# Architecture & Design

High-level overview of how Mascot Madness 2026 is structured.

## Tech Stack

- **React 19** with Vite for fast development
- **React Router** for client-side routing
- **Firebase** for authentication and data storage
- **Vanilla CSS** with CSS custom properties for theming

## Project Structure

```
src/
├── components/    # Reusable UI components (Layout, etc.)
├── pages/         # One component per route
├── constants/     # Static data (bracket info, team nicknames)
├── services/      # Firebase and external API integrations
├── hooks/         # Custom React hooks
├── App.jsx        # Root component with route definitions
└── index.css      # Global styles and theme variables
```

## Key Patterns

### Routing
All routes are defined in `App.jsx`. The `Layout` component wraps pages and provides consistent navigation.

### Theming
Dark theme uses CSS variables defined in `index.css`:
```css
:root {
  --primary-bg: #121212;
  --secondary-bg: #1e1e1e;
  --primary-text: #ffffff;
  --accent-color: #007bff;
}
```

### Data Flow
1. **Static bracket data** lives in `constants/` (tournament structure, team names)
2. **User picks** are collected in page components and saved to Firebase
3. **Shared brackets** are fetched by ID from Firebase for viewing

## For Python Developers

Quick mental mapping if you're used to Django/Flask:

| Python | React |
|--------|-------|
| View function | Page component |
| Template | JSX (returned from component) |
| URL route | Route in `App.jsx` |
| Template inheritance | Layout component + `<Outlet />` |
| Context processor | React Context API |

## Analytics (Google Analytics 4)

Firebase Analytics (GA4) is used to track user engagement. Key design decisions:

- **Localhost guard**: In `services/firebase.ts`, the GA SDK is **not initialized** on `localhost` or `127.0.0.1` — zero analytics data is sent during local development
- **Analytics utility**: `utils/analytics.ts` provides `logAnalyticsEvent()` with event queuing and dev-mode console logging
- **Page tracking**: `hooks/usePageTracking.ts` automatically logs `page_view` on every route change

For the full list of tracked events, custom dimensions, and GA4 console configuration instructions, see [ANALYTICS.md](./ANALYTICS.md).


