# Hajj-Higgins-Salamanca-CSC3210-Project3
Computer Graphics Project 3

## Group Members
- Peter Hajj (PM, Asteroid Designer)
- Jackson Higgins (Rasterization Designer)
- Laura Salamanca (Cockpit/Ship Interior UI Designer)

## Overview

TODO

## How to Play

TODO

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a local server:
   ```bash
   npm start
   ```
3. Open the printed local address (e.g. `http://localhost:3000`) in your browser.

## Technical Docs

### Challenges
- The biggest challenge we faced was optimization, specifically spawning and despawning asteroids within the FOV. After a lot of trial and error with different combinations of `ASTEROID_COUNT`, `MAX_DISTANCE`, and `SPAWN_DISTANCE`, I used Claude Code (see [prompts.md](docs/prompts.md)) to help create a fog effect that hides the spawning and despawning. This let me make `ASTEROID_COUNT`, `MAX_DISTANCE`, and `SPAWN_DISTANCE` much smaller, which significantly improved performance.

### Above and Beyond Implementations
- **TODO:** Describe UI above and beyond elements
- **Additional above and beyond:** Added a fog effect so asteroids fade in and out of the FOV more smoothly and naturally.