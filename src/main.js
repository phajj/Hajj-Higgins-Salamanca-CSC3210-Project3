import * as THREE from "three";
import { perspectiveCamera } from "./camera.js";

const MOUSE_SENSITIVITY = 0.002;
const CAMERA_MOVE_SPEED = 0.1;

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
    if (event.key.toLocaleLowerCase() === "q")
      qPresssed = true;
    if (event.key.toLocaleLowerCase() === "e")
      ePresssed = true;
    });

  // Handle keyup events to stop rotating
  window.addEventListener("keyup", (event) => {
    if (event.key.toLocaleLowerCase() === "q")
      qPresssed = false;
    if (event.key.toLocaleLowerCase() === "e")
      ePresssed = false;
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
function rotateShip(){
  if (qPresssed)
    camera.rotation.z += 0.01;
  if (ePresssed)
    camera.rotation.z -= 0.01;
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
    Math.PI / 2 - 0.01
  );
}

document.addEventListener("mousemove", onMouseMove);
keyboardInput();

/**
 * Render loop, called once per frame
 */
function animate() {
  updateMovement();
  rotateShip();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
