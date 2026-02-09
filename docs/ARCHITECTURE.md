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

Firebase Analytics (GA4) is used to track user engagement. The setup has two layers:

### Localhost Guard
In `services/firebase.ts`, the GA SDK is **not initialized** on `localhost` or `127.0.0.1`. This means zero analytics data is sent during local development — no network requests, no events, nothing.

### Analytics Utility
`utils/analytics.ts` provides helper functions (`logAnalyticsEvent`, `setAnalyticsUserId`, `setAnalyticsUserProperty`) that queue events if the SDK isn't ready yet. In dev mode, all events are logged to the browser console for debugging.

### Tracked Events

| Event | Page | Description |
|---|---|---|
| `page_view` | All (via `usePageTracking`) | Automatic on every route change |
| `login` | Login | Successful login |
| `sign_up` | Signup | Successful account creation |
| `logout` | Profile | User logs out |
| `bracket_save` | WinnerSelection | Bracket saved |
| `bracket_publish` | WinnerSelection | Bracket published to leaderboard |
| `bracket_delete` | WinnerSelection | Bracket deleted |
| `add_contributor` | WinnerSelection | Contributor added to bracket |
| `leave_bracket` | WinnerSelection | User leaves a shared bracket |
| `create_custom_leaderboard` | Leaderboard | Custom leaderboard created |
| `join_custom_leaderboard` | Leaderboard | User joins a custom leaderboard |
| `leave_custom_leaderboard` | Leaderboard | User leaves a custom leaderboard |
| `delete_custom_leaderboard` | Leaderboard | Custom leaderboard deleted |
| `view_bracket` | Leaderboard | User clicks to view a bracket |
| `view_shared_bracket` | BracketView | Shared bracket loaded |

