# Hajj-Higgins-Salamanca-CSC3210-Project3
Computer Graphics Project 3

## Group Members
- Peter Hajj (PM, Asteroid Designer)
- Jackson Higgins (Rasterization Designer)
- Laura Salamanca (Cockpit/Ship Interior UI Designer)

## Overview

- This project is a 3D space simulation game where the player controls a spaceship navigating through an asteroid field. The game features realistic physics, collision detection, and a dynamic environment with asteroids that spawn and despawn based on the player's field of view.

## How to Play

- Turn the spaceship using the mouse to guide the spaceship where you want it to go.
- Rotate the spaceship using Q and E keys

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

- Stencil Test: Used to draw outline of asteroids that have been collided with
- Scissor Test: Used to draw rear view mirror to a fixed area
- Bounding Boxes: Used to detect collisions between asteroids and the ship

### Challenges
- The biggest challenge we faced was optimization, specifically spawning and despawning asteroids within the FOV. After a lot of trial and error with different combinations of `ASTEROID_COUNT`, `MAX_DISTANCE`, and `SPAWN_DISTANCE`, I used Claude Code (see [prompts.md](docs/prompts.md)) to help create a fog effect that hides the spawning and despawning. This let me make `ASTEROID_COUNT`, `MAX_DISTANCE`, and `SPAWN_DISTANCE` much smaller, which significantly improved performance.
- I (Jackson) was struggling to figure out how to apply a shader globally to the entire scene for the warp effect. From Googling I found using a full screen quad with a custom shader material to be the easiest way to achieve this. This allowed me to render the scene to the quad first as a texture, then when the shader pipeline is executed it runs on the full screen quad, effectively applying the warp effect to the entire scene.

### Above and Beyond Implementations
- **Warp Effect:** Implemented a global warp effect using a full screen quad with a custom shader material to apply custom UV distortion to the entire scene.
- **Additional above and beyond:** Added a fog effect so asteroids fade in and out of the FOV more smoothly and naturally.