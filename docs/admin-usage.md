# Mascot Admin App Usage Guide

The **Mascot Admin App** is a local utility dashboard designed to audit, update, and manage the team data for the Mascot Madness tournament. It allows you to ensure every participating team has a valid nickname, a high-quality mascot image, and a correct mapping to the NCAA schools database.

## Getting Started

The admin app lives in the `mascot-admin` directory.

1.  **Navigate to the directory:**
    ```bash
    cd mascot-admin
    ```
2.  **Install dependencies** (first time only):
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
4.  Open your browser to the URL provided (typically `http://localhost:5173`).

---

## The Dashboard

The home page serves as your audit log. It lists all teams found in the tournament data.

### Status Indicators
- **Incomplete Teams**: Teams missing a nickname, image, or valid NCAA mapping appear at the top by default.
- **Staged Badge** (Yellow): Indicates you have made changes to this team that are saved in your browser but **not yet committed** to the project files.
- **Complete**: Teams with all requirement met are hidden from the "Action Needed" view (unless you have pending staged changes for them).

### Columns
- **Team Key**: The unique identifier for the team.
- **Nickname**: Shows "Found" (Green), "Missing" (Red), or "Staged" (Yellow).
- **Image**: Shows "Found" (Green), "Missing" (Red), or "Staged" (Yellow).
- **Mapped NCAA Name**: Shows the resolved name used to link to the master schools database.

---

## Editing Team Data

Click on any row in the dashboard to view the **Team Detail** page.

### 1. Mascot Nickname
Enter the mascot's nickname.
*   **Format**: All lowercase, spaces allowed.
*   **Rule**: Do not include "the" (e.g., enter `eagles`, not `the eagles`).
*   Hover over the **ℹ️ icon** for a reminder of these rules.

### 2. Team Image
Click the **Upload Photo** button (or the placeholder icon) to add a mascot image.
*   **Cropping**: You can zoom and crop the image within the modal.
*   **Auto-Scaling**: If your cropped image exceeds **1200x1600**, it will be automatically scaled down to fit those dimensions while maintaining quality.
*   **Info**: The modal displays the final output dimensions.

### 3. Mapped NCAA Name
This field links the team text key (e.g., `nc_state`) to the official NCAA school entry (e.g., `north-carolina-st`).
*   **Defaults**: The app tries to guess the name (replacing `_` with `-`, etc.).
*   **Validation**: When you try to stage changes, the app checks this name against `schools.json`. If the name doesn't exist in our database, you will see an error popup and be blocked from staging.

---

## Saving Your Work

The app uses a **Stage & Commit** workflow to allow you to work on multiple teams rapidly.

### Step 1: Stage Changes (Per Team)
On the Team Detail page, clicking **"Stage Changes"**:
1.  Uploads the image to a temporary folder (`mascot-admin/temp`).
2.  Saves the nickname and mapping text to your **browser's local storage**.
3.  Redirects you back to the Dashboard.

*Note: Staged changes persist even if you refresh the page, but the temporary images might be cleared if the server restarts.*

### Step 2: Commit Changes (Bulk)
On the Dashboard, if you have staged data, a large yellow **"Save Staged Data"** button appears.
Clicking this will:
1.  **Move Images**: Permanently move images from `temp/` to `public/assets/teams/`.
2.  **Update JSONs**: Write the new nicknames to `nicknames.json` and mappings to `specialNcaaNames.json`.
3.  **Refresh**: Reload the page to reflect the new state.

### Troubleshooting
*   **"Dynamic require..." Error**: Ensure you are running the latest version of `vite.config.ts` (restart the server if you just pulled changes).
*   **Missing Images after Save**: If the server was restarted between "Staging" and "Committing", the temp file might be gone. Simply go back to the team page, re-upload the image, and Stage -> Commit again.
