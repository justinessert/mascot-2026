# This document describes how to manually enter game data for the tournament

## References

- Men's Tournament:
    - https://www.espn.com/mens-college-basketball/bracket
    - https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/04/06/scoreboard.json
- Women's Tournament:
    - https://www.espn.com/womens-college-basketball/bracket
    - https://data.ncaa.com/casablanca/scoreboard/basketball-women/d1/2025/04/06/scoreboard.json

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

4. Run the `clear && node scripts/parse_games.mjs` to see the game ids for each game
5. Reference the ESPN tournament bracket to see which games belong where in each region and round
6. Create a mappings file within the `functions/data/` directory and enter in the year and gender.
7. Manually copy over the game ids for each region and round into the mappings file. Example (after entering round 1):

```json
{
    "year": 2025,
    "gender": "women",
    "newMappings": {
        "regional_1": {
            "round_1": [
                "2640518",
                "2640533",
                "2640525",
                "2640511",
                "2640510",
                "2640524",
                "2640532",
                "2640519"
            ],
            "round_2": [],
            "round_3": [],
            "round_4": []
        },
        "regional_2": {
            "round_1": [
                "2640512",
                "2640517",
                "2640523",
                "2640521",
                "2640520",
                "2640522",
                "2640516",
                "2640513"
            ],
            "round_2": [],
            "round_3": [],
            "round_4": []
        },
        "regional_3": {
            "round_1": [
                "2640526",
                "2640505",
                "2640515",
                "2640507",
                "2640506",
                "2640514",
                "2640504",
                "2640527"
            ],
            "round_2": [],
            "round_3": [],
            "round_4": []
        },
        "regional_4": {
            "round_1": [
                "2640534",
                "2640531",
                "2640529",
                "2640509",
                "2640508",
                "2640528",
                "2640530",
                "2640535"
            ],
            "round_2": [],
            "round_3": [],
            "round_4": []
        },
        "final_four": {
            "round_1": [],
            "round_2": []
        }
    }
}
```

8. Run the following command to get an auth token:
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

9. Copy over that data into Postman and run the following request:
    - POST https://us-central1-mascot-bracket.cloudfunctions.net/updateGameMappings
    - Body Type: raw
    - Body: content from mapping file
    - Auth Type: Bearer Token
    - Token: From the `idToken` field in the response from the previous step
10. In Postman, run the following request twice (once for each date you pulled from the NCAA API):
    - GET https://us-central1-mascot-bracket.cloudfunctions.net/manualUpdateNCAAGames
    - Params
        - `date`: (example) 03-21-2025
        - `gender`: (example) women
    - Auth Type: Bearer Token
    - Token: From the `idToken` field in the response from step 8
11. In Postman, run the following request to update the scores of each bracket in the leaderboard:
    - GET https://us-central1-mascot-bracket.cloudfunctions.net/updateBracketScores
    - Params
        - `year`: (example) 2025
        - `gender`: (example) women
    - Auth Type: Bearer Token
    - Token: From the `idToken` field in the response from step 8
12. Open a bracket on the leaderboard and the ESPN website and manually calculate the scores (if you don't already have a bracket on the leaderboard, create one and repeat the previous step)
13. Repeat the preceeding steps for every round
    
