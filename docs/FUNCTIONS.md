# Firebase Cloud Functions

This document outlines the core Cloud Functions used in the Mascot Madness application (`mascot-2026`). These functions are hosted on Firebase and facilitate game updates, scoring, and data management.

## Core Functions

### 1. `manualUpdateNCAAGames`
**Type:** HTTP Request  
**Purpose:** Manually triggers an update of NCAA game data for a specific date or gender. This is useful for testing or force-updating data if the schedule misses something.

**Usage:**
- **Method:** GET
- **Query Parameters:**
  - `date` (optional): The date to fetch games for (format: `YYYY-MM-DD`). Defaults to current date.
  - `gender` (optional): "men" or "women". Defaults to updating both if omitted (or specific logic in implementation).

### 2. `scheduledUpdateNCAAGames`
**Type:** Scheduled (Cron)  
**Purpose:** Automatically fetches game data and updates bracket scores.
**Schedule:**
- Currently configured to run periodically (checked against logic for Thursday-Sunday, 12pm-12am PT).
- Fetches games from the NCAA API.
- Updates scores for all published brackets after updating game data.

### 3. `updateGameMappings`
**Type:** HTTP Request  
**Purpose:** Updates the mapping of which NCAA game IDs correspond to which bracket region and round. This is critical for the scoring engine to know which real-world game result determines a specific bracket pick's winner.

**Usage:**
- **Method:** POST
- **Body:**
  - `year` (number): The tournament year.
  - `newMappings` (object): The mapping object structure.
  - `gender` (string): "men" or "women".

### 4. `updateBracketScores`
**Type:** HTTP Request  
**Purpose:** Recalculates scores for all published brackets for a given year. This is typically called automatically by `scheduledUpdateNCAAGames` but can be triggered manually if scores need to be refreshed.

**Usage:**
- **Method:** GET
- **Query Parameters:**
  - `year` (optional): The tournament year. Defaults to current year.
  - `gender` (optional): "men" or "women".

## Deployment

To deploy these functions:

```bash
cd mascot-2026/functions
npm run build
firebase deploy --only functions
```
