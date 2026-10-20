## LLM Prompts

This file records the prompts we gave to AI coding assistents and/or other LLMs for help while coding this project. It is orginaized by group member, each bullet depicts the initial prompt with the subbullets depicting the revision prompts.

## Peter (using Claude Code CLI)

- I just copied many files from a previous graphhics project and cleaned them up to take out components we don't need to start fresh in a new project. The last project had a satellete, sun, terain, and orthagraphic camera and perspective camera that can be controlled by keybaord input, and toggling between cameras. Search through this repo to delete any left over artifacts I may have missed from the last project.This project is using perspective camera and keybaord/mouse controls to control a spaceship, so keep those controls. Do NOT add any new logic, only clean up old artifacts and add any necissary three js parts to have this initial scaffolding.
  - Remove all the leftover keyboard inputs other than the roateCam related ones (rename to rotateShip), instead have the perspective cam move at a constant speed "forward" (towards the center of the screen)
- I am using @src/astroid.js randomMaterial to randomly select a texture from @resources/textures\ and use the MeshBasicMaterial to load it, but it's currently not selecting the textures right. Help me fix the random texture selector so it picks one at radnom and properly passes it through the mesh loader. Do not change any of the main logic
  - I created randomMovement that returns a random speed, direction, and either a (random) linear or (random) parabolicDrift. I am having trouble actually assigning these attributes to the createAsteroid that generates the astroids
- Write a test file that loads up 100+ of these geomtries, gitignore it. It is purely for me see what the geomtries look like while I work on them
  - Reported that loading astroid-test.html showed only the keybind UI and no asteroids.
  - Remove the left over artifacts of the parabolicDrift and linearDrift in randomMovement
- I am struggling with optimizing the @src/asteroid.js in the sense that I have tried several different values for ASTEROID_COUNT, MAX_DISTANCE, SPAWN_DISTANCE to see what feels the most natural. Either the asteroids are too noticably despawning/spawning or if I set the distance and count higher it starts taking a toll on preformance and fps. Help me adjust the ambiant light to make the FOV roughly 20-50 units away from the camera, once it goes beyond that it gets darker and dark. That way I can despawn/spawn beyond the 50 and make it feel more natural to slowly fade into light

## Jackson

- Help me fit the scissor test to the placeholder mirror in the ship
- help me finish the ship sparks method in @src/main.js. I am struggling to get the sparks to fly outward as intended.

## Laura

- Create a set of geometric objects in the space outside of the ship's cockpit to test whether or not the ship is moving forward and turning appropriately
- Set up a simple rectangular skeleton of a ship's cockpit as a Three.Group
  - Used this as the structure of the cockpit in which I then added windows, an image of a control panel, a steering wheel
- Why does pressing q and e offset the mouse movement and mess them up?
