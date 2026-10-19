import * as THREE from "three";
import { perspectiveCamera, rearViewCamera } from "./camera.js";
import { createShip } from "./ship.js";
import { updateAsteroids, asteroids } from "./asteroid.js";

const MOUSE_SENSITIVITY = 0.002;
const CAMERA_MOVE_SPEED = 0.01;
const ROLL_SPEED = 1.5;
const MAX_DT = 0.1;

const MIRROR_WIDTH = 0.2;
const MIRROR_HEIGHT = 0.07;
const MIRROR_BOTTOM = 0.8;

// Fully visible up to FOG_NEAR, fades to black by FOG_FAR (asteroids spawn/despawn past FOG_FAR)
const FOG_NEAR = 30;
const FOG_FAR = 60;

const SPARK_COUNT = 40;
const SPARK_SPEED = 10;
const SPARK_LIFETIME = 0.5;

const OUTLINE_SCALE = 1.1;
const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  stencilWrite: true,
  stencilRef: 1,
  stencilFunc: THREE.NotEqualStencilFunc,
});

// Measure fog by true distance from the camera to fade the asteroids in and out of FOV
// (assisted by Claude Code)
THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG
  vFogDepth = length( mvPosition.xyz );
#endif
`;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, FOG_NEAR, FOG_FAR);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
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
  camera.rotateY(-event.movementX * MOUSE_SENSITIVITY);
  camera.rotateX(-event.movementY * MOUSE_SENSITIVITY);
}

document.addEventListener("mousemove", onMouseMove);
keyboardInput();

const { ship, cameraMount, rearMount, update } = createShip();

let shipBox = new THREE.Box3().setFromObject(ship);

// Flip the hierarchy: the camera lives in the scene, the ship rides on the camera
scene.add(camera);
camera.add(ship);

// Add rear camera to the ship
const rearCamera = rearViewCamera();
rearMount.add(rearCamera);

// Offset the ship so the camera sits at the pilot's eye position
ship.position.copy(cameraMount.position).negate();
camera.position.set(0, 0, 0);

let lastTime = null;
/**
 * Place rear view mirror using the scissor test
 */
function renderRearViewMirror() {
  const width = window.innerHeight * MIRROR_WIDTH;
  const height = window.innerHeight * MIRROR_HEIGHT;
  const x = (window.innerWidth - width) / 2;
  const y = window.innerHeight * MIRROR_BOTTOM;

  renderer.setScissorTest(true);
  renderer.setScissor(x, y, width, height);
  renderer.setViewport(x, y, width, height);
  renderer.render(scene, rearCamera);
  renderer.setScissorTest(false);
}

const sparkPositions = new Float32Array(SPARK_COUNT * 3);
const sparkVelocities = new Float32Array(SPARK_COUNT * 3);
const sparkGeometry = new THREE.BufferGeometry();
sparkGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(sparkPositions, 3),
);

const sparks = new THREE.Points(
  sparkGeometry,
  new THREE.PointsMaterial({ color: 0xff8800, size: 0.1 }),
);
sparks.visible = false;
sparks.frustumCulled = false;
ship.add(sparks);

let sparkTime = 0;
const sparkDir = new THREE.Vector3();

/**
 * Starts a burst of orange sparks from a random front corner of the ship.
 */
function shipSparks() {
  if (sparks.visible) return;

  const side = Math.random() < 0.5 ? -1 : 1;

  for (let i = 0; i < SPARK_COUNT * 3; i += 3) {
    // Front corner of the cockpit
    sparkPositions[i] = side * 2;
    sparkPositions[i + 1] = 1.4;
    sparkPositions[i + 2] = -2.1;

    // Random direction pointing outward and forward
    sparkDir
      .set(side * Math.random(), Math.random() - 0.5, -Math.random())
      .normalize()
      .multiplyScalar(SPARK_SPEED);
    sparkVelocities[i] = sparkDir.x;
    sparkVelocities[i + 1] = sparkDir.y;
    sparkVelocities[i + 2] = sparkDir.z;
  }

  sparkTime = SPARK_LIFETIME;
  sparks.visible = true;
  sparkGeometry.attributes.position.needsUpdate = true;
}

/**
 * Moves the active sparks and hides them once their lifetime runs out.
 * @param {number} dt seconds since the last frame
 */
function updateSparks(dt) {
  if (!sparks.visible) return;

  sparkTime -= dt;
  if (sparkTime <= 0) {
    sparks.visible = false;
    return;
  }

  for (let i = 0; i < SPARK_COUNT * 3; i++) {
    sparkPositions[i] += sparkVelocities[i] * dt;
  }
  sparkGeometry.attributes.position.needsUpdate = true;
}

/**
 * Outlines the given asteroid with a red outline
 * @param {THREE.Mesh} asteroid
 */
function outlineAsteroid(asteroid) {
  if (asteroid.userData.outline) return;

  // The asteroid writes 1 into the stencil buffer wherever it draws
  asteroid.material.stencilWrite = true;
  asteroid.material.stencilRef = 1;
  asteroid.material.stencilFunc = THREE.AlwaysStencilFunc;
  asteroid.material.stencilZPass = THREE.ReplaceStencilOp;

  const outline = new THREE.Mesh(asteroid.geometry, outlineMaterial);
  outline.scale.setScalar(OUTLINE_SCALE);
  outline.renderOrder = 1;

  asteroid.add(outline);
  asteroid.userData.outline = outline;
}

/**
 * Render loop, called once per frame
 */
function animate(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, MAX_DT);
  lastTime = time;

  updateMovement(dt);
  rotateShip(dt);
  updateSparks(dt);
  update(time / 1000, 0, (qPresssed ? 1 : 0) - (ePresssed ? 1 : 0));
  updateAsteroids(scene, camera, asteroids);
  shipBox.setFromObject(ship);

  for (let i = 0; i < asteroids.length; i++) {
    const asteroid = asteroids[i];
    if (shipBox.intersectsBox(asteroid.userData.asteroidBox)) {
      console.log("Collision detected with asteroid:", asteroid);
      shipSparks();
      outlineAsteroid(asteroid);
    }
  }

  // Main cockpit view over the full screen
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  renderRearViewMirror();
}

renderer.setAnimationLoop(animate);
