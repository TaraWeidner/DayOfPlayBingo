# Physical Activity BINGO

A mobile-first, Inclusive Health-branded physical activity bingo game designed for reuse at community events, outreach activities, and health fairs.

## What is included

- Solo play on any modern phone browser; no account or app download required
- Family Fitness and Adults & Older Kids challenge modes
- Randomized 5×5 cards with a free center square
- Activity instructions, timers, movement modifications, and local progress saving
- Bingo detection, confetti, vibration, sound, and multiple-bingo celebrations
- A TV-friendly celebration display at `display.html`
- Progressive Web App support for faster repeat loading
- Optional Firebase Realtime Database sync for shared event totals and TV celebrations

## Publish with GitHub Pages

The included GitHub Actions workflow deploys the repository to GitHub Pages. In the repository, open **Settings → Pages** and set the source to **GitHub Actions** if it is not already selected.

Player URL:

`https://taraweidner.github.io/DayOfPlayBingo/`

Celebration display:

`https://taraweidner.github.io/DayOfPlayBingo/?display=1`

## Enable shared event celebrations

The game works without a database, but each device remains independent. To synchronize wins to the TV display:

1. Create a Firebase project and a Realtime Database.
2. Apply the rules in `firebase-rules.json`.
3. Copy the database URL, such as `https://your-project-default-rtdb.firebaseio.com`.
4. Paste it into `firebaseDatabaseUrl` in `config.js`.
5. Commit the change and let GitHub Pages redeploy.

The display polls the event database every few seconds and celebrates newly completed bingos.

## Event privacy

Players only enter a nickname. They may choose a private celebration, which sends “Anonymous Player” to the public display. The game does not request email, phone, date of birth, location, or health information.
