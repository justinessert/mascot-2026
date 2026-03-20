# This document describes how to manually enter game data for the tournament

## References

- Men's Tournament:
    - https://www.espn.com/mens-college-basketball/bracket
    - https://ncaa-api.henrygd.me/scoreboard/basketball-men/d1/2026/03/19/all-conf
- Women's Tournament:
    - https://www.espn.com/womens-college-basketball/bracket
    - https://ncaa-api.henrygd.me/scoreboard/basketball-women/d1/2026/03/19/all-conf

## Process

1. Check on ESPN to see what dates the first round games are played (should be two dates for each round prior to final four)
2. Pull the data from the NCAA Casablanca API for each date
3. Combine the data together into a single JSON object and store it in `functions/data/games_raw_output.json`. Example:

```json
{
    "inputMD5Sum": "221d1029881cb303d1383db498a06eb7",
    "instanceId": "e32133bca11945368f42f8af6824d358",
    "updated_at": "04-06-2025 19:59:45",
    "games": [
        {
            "game": {
                "gameID": "2640566",
                "away": {
                    "score": "82",
                    "names": {
                        "char6": "UCONN",
                        "short": "UConn",
                        "seo": "uconn",
                        "full": "University of Connecticut"
                    },
                    "winner": true,
                    "seed": "2",
                    "description": "(35-3)",
                    "rank": "",
                    "conferences": [
                        {
                            "conferenceName": "Big East",
                            "conferenceSeo": "big-east"
                        }
                    ]
                },
                "finalMessage": "FINAL",
                "bracketRound": "Championship",
                "title": "South Carolina UConn",
                "contestName": "",
                "url": "/game/6384811",
                "network": "ABC",
                "home": {
                    "score": "59",
                    "names": {
                        "char6": "S CAR",
                        "short": "South Carolina",
                        "seo": "south-carolina",
                        "full": "University of South Carolina, Columbia"
                    },
                    "winner": false,
                    "seed": "1",
                    "description": "(33-3)",
                    "rank": "",
                    "conferences": [
                        {
                            "conferenceName": "SEC",
                            "conferenceSeo": "sec"
                        }
                    ]
                },
                "liveVideoEnabled": false,
                "startTime": "03:00PM ET",
                "startTimeEpoch": "1743966000",
                "bracketId": "701",
                "gameState": "final",
                "startDate": "04-06-2025",
                "currentPeriod": "FINAL",
                "videoState": "",
                "bracketRegion": "",
                "contestClock": "0:00"
            }
        }
    ],
    "hideRank": true
}
```

4. Run the generate mappings script to automatically build the mappings file:

```bash
node scripts/generate_mappings.mjs <sport> <year>
```

Examples:
```bash
node scripts/generate_mappings.mjs basketball-men 2026
node scripts/generate_mappings.mjs basketball-women 2026
```

This fetches the NCAA brackets API (`/brackets/<sport>/d1/<year>`), extracts game IDs (`contestId`) organized by region and round, and writes the output to `functions/data/mappings_<year>_<gender>.json`.

The script uses `sectionId` from the bracket data to determine which region each game belongs to, and `bracketId` to determine the round (2xx = Round 1, 3xx = Round 2, etc.). Games are sorted within each round by `bracketId` to maintain standard bracket order (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15).

5. Validate a few game IDs by spot-checking against the ESPN bracket or the game endpoint:
    - `https://ncaa-api.henrygd.me/game/<contestId>` returns game details including team names and seeds

> **Note:** The older manual approach (`node scripts/parse_games.mjs`) still exists and can be used as a fallback. It parses `functions/data/games_raw_output.json` (from the scoreboard API) and prints game IDs, but requires manually cross-referencing with ESPN and copying IDs into a mappings file.

6. Run the following command to get an auth token:
    - POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyApC10RWiaRHShY4cl7uIKHqkrUyg-8TVc
    - Auth Type: No Auth
    - Body Type: raw
    - Body: (example)

```json
{
    "email": "justinkessert@gmail.com",
    "password": "PASSWORD",
    "returnSecureToken": true
}
```

7. Copy over that data into Postman and run the following request:
    - POST https://us-central1-mascot-bracket.cloudfunctions.net/updateGameMappings
    - Body Type: raw
    - Body: content from mapping file
    - Auth Type: Bearer Token
    - Token: From the `idToken` field in the response from the previous step
8. In Postman, run the following request twice (once for each date you pulled from the NCAA API):
    - GET https://us-central1-mascot-bracket.cloudfunctions.net/manualUpdateNCAAGames
    - Params
        - `date`: (example) 03-21-2025
        - `gender`: (example) women
    - Auth Type: Bearer Token
    - Token: From the `idToken` field in the response from step 6
9. In Postman, run the following request to update the scores of each bracket in the leaderboard:
    - GET https://us-central1-mascot-bracket.cloudfunctions.net/updateBracketScores
    - Params
        - `year`: (example) 2025
        - `gender`: (example) women
    - Auth Type: Bearer Token
    - Token: From the `idToken` field in the response from step 6
10. Open a bracket on the leaderboard and the ESPN website and manually calculate the scores (if you don't already have a bracket on the leaderboard, create one and repeat the previous step)
11. Repeat the preceeding steps for every round
    
