import * as THREE from "three";
import { perspectiveCamera } from "./camera.js";
import { createShip } from "./ship.js";

const MOUSE_SENSITIVITY = 0.002;
const CAMERA_MOVE_SPEED = 0.01;
const ROLL_SPEED = 1.5;
const MAX_DT = 0.1;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera (perspective in ship cockpit)
const camera = perspectiveCamera(window.innerWidth / window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Keep the camera and the renderer in sync with the window size
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Keyboard input handling
var qPresssed = false;
var ePresssed = false;

/**
 * Handles keyboard input for rotating the ship:
 * q e
 * (copied and modified from Project 2)
 */
function keyboardInput() {
  // Handle keydown events to start rotating
  window.addEventListener("keydown", (event) => {
    if (event.key.toLocaleLowerCase() === "q") qPresssed = true;
    if (event.key.toLocaleLowerCase() === "e") ePresssed = true;
  });

  // Handle keyup events to stop rotating
  window.addEventListener("keyup", (event) => {
    if (event.key.toLocaleLowerCase() === "q") qPresssed = false;
    if (event.key.toLocaleLowerCase() === "e") ePresssed = false;
  });
}

// Reused every frame by updateMovement() instead of allocating a new vector
const forward = new THREE.Vector3();

/**
 * Moves the perspective camera forward (towards the center of the screen)
 * at a constant speed. Called every frame from animate().
 * (copied and modified from project 2)
 */
function updateMovement() {
  camera.getWorldDirection(forward);
  camera.position.addScaledVector(forward, CAMERA_MOVE_SPEED);
}

/**
 * Rotates the ship (perspective camera) left or right.
 * @returns {void}
 */
function rotateShip(dt) {
  if (qPresssed) camera.rotateZ(ROLL_SPEED * dt);
  if (ePresssed) camera.rotateZ(-ROLL_SPEED * dt);
}

/**
 * Rotates the perspective camera by how far the mouse moved since the last event.
 * @param {MouseEvent} event
 * assisted by Copilot
 * (copied from project 2)
 */
function onMouseMove(event) {
  camera.rotation.y -= event.movementX * MOUSE_SENSITIVITY;
  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x - event.movementY * MOUSE_SENSITIVITY,
    -Math.PI / 2 + 0.01,
    Math.PI / 2 - 0.01,
  );
}

document.addEventListener("mousemove", onMouseMove);
keyboardInput();

const { ship, cameraMount, update } = createShip();

// Flip the hierarchy: the camera lives in the scene, the ship rides on the camera
scene.add(camera);
camera.add(ship);

// Offset the ship so the camera sits at the pilot's eye position
ship.position.copy(cameraMount.position).negate();
camera.position.set(0, 0, 0);

// TEMPORARY: test objects so you can see movement. Delete when done.
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
for (let i = 0; i < 300; i++) {
  const m = new THREE.Mesh(
    boxGeo,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.55),
      wireframe: true,
    }),
  );
  m.position.set(
    (Math.random() - 0.5) * 300,
    (Math.random() - 0.5) * 300,
    (Math.random() - 0.5) * 300,
  );
  if (m.position.length() < 10) continue; // keep the start area clear
  scene.add(m);
}

// Landmarks: red straight ahead, green to the right, blue above
[
  [0xff0000, 0, 0, -25],
  [0x00ff00, 25, 0, 0],
  [0x0000ff, 0, 25, 0],
].forEach(([color, x, y, z]) => {
  const m = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, z);
  m.scale.setScalar(3);
  scene.add(m);
});
let lastTime = null;

//END TEST OBJECTS

/**
 * Render loop, called once per frame
 */
function animate(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, MAX_DT);
  lastTime = time;

  updateMovement(dt);
  rotateShip(dt);
  update(time / 1000, 0, (qPresssed ? 1 : 0) - (ePresssed ? 1 : 0));
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
