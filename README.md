# Yu-Gi-Assistant

A lightweight Life Point tracker for Yu-Gi-Oh! duels. It runs entirely in the browser, works well on phones, and has no dependencies or build step.

## Features

- **1 to 10 players** with custom names and any starting LP (8000 by default)
- **Fast LP changes**: type an amount and add or subtract it, or use the one-tap buttons for -500, -1000, -2000 and halving
- **Keyboard friendly**: press Enter in the amount field to subtract
- **Defeat tracking**: players at 0 LP are dimmed and marked as defeated
- **Forfeit button** to concede a duel in one tap
- **Keeps the screen awake** during a duel, so your phone doesn't lock mid-game
- **Coin toss and 6-sided die** built into the duel screen, plus a dice roll at the start to decide who goes first
- **Remembers your duel**: state is saved in the browser, so a refresh or closed tab doesn't lose LP totals
- **Confirmation dialogs** before resetting or leaving a duel, so a misclick can't wipe the game

## Getting started

Open `index.html` in any modern browser. That's it.

If you prefer serving it over HTTP (for example to open it from your phone on the same network), any static file server works.

## How to use

### Setup

1. Use **-** and **+** to pick the number of players (1 to 10).
2. Set the **Starting LP**.
3. Optionally enter player names. Blank names default to "Player 1", "Player 2", and so on.
4. Press **Start Duel**.

### Deciding who goes first

When the duel starts, each player's card shows a die instead of their LP. Each player taps their die to roll it, and the highest roll goes first. The winning card is highlighted in gold. If the highest roll is a tie, only the tied players roll again.

Press **Go** to reveal the LP counters and start playing. You can press **Go** at any time, for example if you decided who goes first some other way.

### During the duel

Each player has their own card showing their current LP.

| Action                   | How                                                        |
| ------------------------ | ---------------------------------------------------------- |
| Subtract a custom amount | Type it in the amount field, then press **-** or **Enter** |
| Add a custom amount      | Type it in the amount field, then press **+**              |
| Quick damage             | Tap **-500**, **-1000** or **-2000**                       |
| Halve LP                 | Tap **½** (rounds up, as per the official rules)           |
| Forfeit                  | Tap the white flag next to the LP, then confirm            |

LP never goes below 0. When a player hits 0 they are marked as **Defeated** and the quick buttons and forfeit flag are disabled, but you can still add LP back with **+** if needed.

While the duel screen is open the app asks the browser to keep the screen on. This uses the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), which is supported by most current browsers but only works in a secure context (HTTPS or `localhost`). If you open the app from another device over plain HTTP, such as your computer's local IP address, the screen will lock as normal. Battery saver modes may also refuse it.

Below the player cards:

- **Coin**: tap it to flip. It lands on **H** (heads) or **T** (tails).
- **Die**: tap it to roll a standard 6-sided die.

Both use the browser's cryptographic random number generator, so results are fair.

### Top bar

- **Reset LP** sets every player back to the starting LP, keeping the same players and names.
- **Setup** returns to the setup screen to change players, names or starting LP. Names are kept, but starting a new duel resets LP.

Both ask for confirmation first. Press **Esc** or tap outside the dialog to cancel.

## Data and privacy

All data is stored locally in your browser's `localStorage`. Nothing is sent anywhere. Clearing your browser's site data resets the app.
