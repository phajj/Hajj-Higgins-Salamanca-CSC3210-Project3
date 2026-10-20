import * as THREE from "three";

/**
 * Toggle warp on/off with the Shift key. Warp speeds up the ship and stretches the asteroids along the view direction.
 * 
 * @author Jackson Higgins
 */

const WARP_SPEED_MULTIPLIER = 100; 
const WARP_STRETCH = 8; // How much the asteroids are stretched at full warp speed
const WARP_RAMP_TIME = 1; // Seconds to ramp up and down to full warp speed

const STAR_COUNT = 300;
const STAR_SPEED = 100; 
const STAR_SPREAD = 20; // Stars start within this distance of the center of the view
const STAR_DEPTH = 100; // Stars start this far ahead of the camera and reset this far behind it

let warpOn = false;
let warp = 0; // 1 = full warp

const stretchUniform = { value: 1 };

// White dots that fly past the ship at full warp. They are a child of the camera,
// so their positions are relative to the camera (it looks down -z).
const starPositions = new Float32Array(STAR_COUNT * 3);
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 }));
stars.visible = false;
stars.frustumCulled = false;

/**
 * Places a star at a random spot in front of or behind the camera.
 * @param {number} i index of the stars x value in starPositions
 */
function resetStar(i) {
  starPositions[i] = (Math.random() - 0.5) * 2 * STAR_SPREAD;
  starPositions[i + 1] = (Math.random() - 0.5) * 2 * STAR_SPREAD;
  starPositions[i + 2] = (Math.random() - 0.5) * 2 * STAR_DEPTH;
}

for (let i = 0; i < STAR_COUNT * 3; i += 3) resetStar(i);

/**
 * Attaches the warp stars to the camera so they fly past it.
 * @param {THREE.Camera} camera
 */
export function addWarpStars(camera) {
  camera.add(stars);
}

/**
 * Moves the stars towards (and past) the camera. Once a star is as far behind the
 * camera as it started ahead, it is moved back to the start so it can be seen in the
 * rear view mirror before it resets.
 * @param {number} dt seconds since the last frame
 */
function updateStars(dt) {
  for (let i = 0; i < STAR_COUNT * 3; i += 3) {
    starPositions[i + 2] += STAR_SPEED * dt;
    if (starPositions[i + 2] > STAR_DEPTH) {
      resetStar(i);
      starPositions[i + 2] = -STAR_DEPTH;
    }
  }
  starGeometry.attributes.position.needsUpdate = true;
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Shift" && !event.repeat) warpOn = !warpOn;
});

/**
 * Ramps warp up while warp is on and back down when it is turned off.
 * @param {number} dt seconds since the last frame
 */
export function updateWarp(dt) {
  const change = dt / WARP_RAMP_TIME;
  warp = THREE.MathUtils.clamp(warp + (warpOn ? change : -change), 0, 1); // update warp speed clamped between 0 and 1
  stretchUniform.value = THREE.MathUtils.lerp(1, WARP_STRETCH, warp);

  // Stars only fly by at full warp
  stars.visible = warp === 1;
  if (stars.visible) updateStars(dt);
}

/**
 * @returns {number} how many times faster than normal the ship should move
 */
export function warpSpeedMultiplier() {
  return THREE.MathUtils.lerp(1, WARP_SPEED_MULTIPLIER, warp);
}

/**
 * Adds the warp stretch to a material's vertex shader. Each vertex is pushed away
 * from the object's center along the camera's view direction (z in view space),
 * so the object gets longer in the direction the ship is flying.
 * @param {THREE.Material} material
 */
export function addWarpStretch(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uStretch = stretchUniform;
    shader.vertexShader = "uniform float uStretch;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
      vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      mvPosition.z = center.z + (mvPosition.z - center.z) * uStretch;
      gl_Position = projectionMatrix * mvPosition;`,
    );
  };
}
