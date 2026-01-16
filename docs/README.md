# Mascot Madness 2026

A web application for building March Madness brackets based on mascot matchups. Users pick winners by deciding which mascot would win in a head-to-head battle, rather than predicting actual game outcomes.

## Overview

Mascot Madness is a fun alternative to traditional bracket competitions. Instead of analyzing team statistics, users simply choose which college mascot they think would win in a hypothetical fight. This makes the competition accessible to everyone—even those who don't follow college basketball.

## Features

- **Mascot Matchups** - Pick winners based on which mascot you think would win
- **Full Bracket View** - See your complete bracket across all regions
- **Regional Brackets** - View picks for individual regions (South, East, Midwest, West)
- **Shareable Brackets** - Share your bracket with friends via unique URLs
- **Leaderboard** - Compete with others and track scores as the tournament progresses
- **User Authentication** - Create an account to save and manage your brackets

## Tech Stack

- **Frontend**: React 19 with Vite
- **Routing**: React Router DOM v7
- **Backend**: Firebase (Firestore database, Authentication)
- **Hosting**: Firebase Hosting
- **Styling**: Vanilla CSS with CSS custom properties

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server runs at `http://localhost:5173/`

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed project structure and design patterns.

## Documentation

See [Architecture & Design](./ARCHITECTURE.md) for project structure and design patterns.

## License

MIT
