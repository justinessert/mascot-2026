# Google Analytics Guide

How analytics works in Mascot Madness and how to configure GA4 in the Google Analytics console.

## How It Works

- **Firebase Analytics (GA4)** is used via the Firebase SDK
- The GA SDK is **not initialized on localhost** — no analytics data is sent during local development
- In dev mode, all events are logged to the browser console as `[Analytics] ...` for debugging
- Events fired before the SDK is ready are queued and flushed automatically
- The core utility is `src/utils/analytics.ts` which provides `logAnalyticsEvent()`, `setAnalyticsUserId()`, and `setAnalyticsUserProperty()`

## Tracked Events

### Automatic Events

| Event | Source | Parameters |
|---|---|---|
| `page_view` | `usePageTracking` hook (all routes) | `page_location`, `page_path`, `page_title`, `tournament_year`, `gender`, `has_saved_bracket` |

### Auth Events

| Event | Page | Parameters |
|---|---|---|
| `login` | Login | `method` |
| `sign_up` | Signup | `method` |
| `logout` | Profile | _(none)_ |

### Bracket Events

| Event | Page | Parameters |
|---|---|---|
| `bracket_save` | WinnerSelection | `tournament_year`, `gender`, `has_champion`, `bracket_name`, `user_name`, `has_saved_bracket` |
| `bracket_publish` | WinnerSelection | `tournament_year`, `gender`, `bracket_name`, `user_name`, `has_saved_bracket` |
| `bracket_delete` | WinnerSelection | `tournament_year`, `gender`, `bracket_name`, `user_name`, `has_saved_bracket` |
| `add_contributor` | WinnerSelection | `tournament_year`, `gender`, `bracket_name`, `user_name`, `has_saved_bracket` |
| `leave_bracket` | WinnerSelection | `tournament_year`, `gender`, `bracket_name`, `user_name`, `has_saved_bracket` |
| `view_shared_bracket` | BracketView | `tournament_year`, `gender`, `has_saved_bracket` |

### Leaderboard Events

| Event | Page | Parameters |
|---|---|---|
| `create_custom_leaderboard` | Leaderboard | `tournament_year`, `leaderboard_name`, `has_password`, `gender`, `has_saved_bracket` |
| `join_custom_leaderboard` | Leaderboard | `tournament_year`, `gender`, `leaderboard_name`, `has_saved_bracket` |
| `leave_custom_leaderboard` | Leaderboard | `tournament_year`, `gender`, `leaderboard_name`, `has_saved_bracket` |
| `delete_custom_leaderboard` | Leaderboard | `tournament_year`, `gender`, `leaderboard_name`, `has_saved_bracket` |
| `view_bracket` | Leaderboard | `tournament_year`, `gender`, `is_own_bracket`, `has_saved_bracket` |

### User Properties

| Property | Set In | Description |
|---|---|---|
| `is_logged_in` | `useAuth` hook | `'true'` or `'false'` |
| User ID | `useAuth` hook | Firebase UID, set on login/cleared on logout |

---

## Custom Dimensions

Event parameters are collected by GA4 automatically, but you **must register them as custom dimensions** before they appear in reports and explorations.

### How to Add a Custom Dimension

1. Go to **Admin** (gear icon, bottom-left)
2. Navigate to **Data display → Custom definitions**
3. Click **Create custom dimension**
4. Fill in:
   - **Dimension name**: A human-readable label (e.g. "Tournament Year")
   - **Scope**: Select **Event**
   - **Event parameter**: The exact parameter name from the code (e.g. `tournament_year`)
5. Click **Save**

### Recommended Custom Dimensions

| Dimension Name | Scope | Event Parameter |
|---|---|---|
| Tournament Year | Event | `tournament_year` |
| Gender | Event | `gender` |
| Bracket Name | Event | `bracket_name` |
| User Name | Event | `user_name` |
| Leaderboard Name | Event | `leaderboard_name` |
| Has Saved Bracket | Event | `has_saved_bracket` |
| Has Champion | Event | `has_champion` |
| Is Own Bracket | Event | `is_own_bracket` |
| Has Password | Event | `has_password` |

> **Note:** GA4 free tier allows 50 event-scoped and 25 user-scoped custom dimensions.

---

## Key Events

Key Events (formerly "Conversions") let you track important actions and build conversion funnels.

### How to Mark a Key Event

1. Go to **Admin → Data display → Events**
2. Find the event in the list (events appear **24–48 hours** after first being fired)
3. Toggle the **"Mark as key event"** switch on the right

### Recommended Key Events

- **`sign_up`** — new user acquisition
- **`bracket_publish`** — core engagement action
- **`create_custom_leaderboard`** — social/virality indicator

---

## Explorations

Explorations let you build custom reports beyond the standard GA4 dashboards. They're useful for understanding user funnels and behavior patterns.

### How to Create an Exploration

1. Go to **Explore** (in the left sidebar)
2. Click **Blank** to start from scratch, or choose a template
3. Configure the exploration:
   - **Variables panel** (left): Add dimensions and metrics you want to use
     - Click **+** next to **Dimensions** to add custom dimensions (e.g. Tournament Year, Gender)
     - Click **+** next to **Metrics** to add metrics (e.g. Event count, Active users)
   - **Tab Settings panel** (middle): Configure how data is displayed
     - **Technique**: Choose "Free form" (table), "Funnel exploration", "Path exploration", etc.
     - **Rows/Columns**: Drag dimensions from Variables into these
     - **Values**: Drag metrics from Variables into this
     - **Filters**: Add filters to narrow results

### Useful Explorations for Mascot Madness

#### Signup-to-Publish Funnel
- **Technique**: Funnel exploration
- **Steps**:
  1. `sign_up`
  2. `bracket_save`
  3. `bracket_publish`
- **Tells you**: What percentage of signups complete and publish a bracket

#### Engagement by Gender
- **Technique**: Free form
- **Rows**: `gender` dimension
- **Values**: Event count, Active users
- **Filter**: Event name = `bracket_publish`
- **Tells you**: Which tournament (men's vs women's) gets more engagement

#### Leaderboard Adoption
- **Technique**: Free form
- **Rows**: `leaderboard_name` dimension
- **Values**: Event count
- **Filter**: Event name in (`join_custom_leaderboard`, `create_custom_leaderboard`)
- **Tells you**: Which custom leaderboards are most popular

---

## Adding New Events

To track a new action in the app:

1. Import the utility: `import { logAnalyticsEvent } from '../utils/analytics';`
2. Call it after the action succeeds:
   ```typescript
   logAnalyticsEvent('your_event_name', {
       tournament_year: selectedYear,
       gender: genderPath,
       // ... other relevant params
   });
   ```
3. Register any new parameters as custom dimensions in the GA4 console (see above)
4. Update the event tables in this doc and in `ARCHITECTURE.md`
