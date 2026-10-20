import * as THREE from "three";
import { addWarpStretch } from "./warp.js";

/**
 * Generates a random asteroid mesh with a custom texture material.
 * @author Peter Hajj 
 */

const SPAWN_DISTANCE = 65;
const MAX_DISTANCE = 65;
const ASTEROID_COUNT = 150;

const textureLoader = new THREE.TextureLoader();
// Texture files in resources/textures 
const textures = [
    "evilJava.jpg",
    "Gus.jpg",
    "Kiki.jpg",
    "Kissel.jpg",
    "powerBrick.jpg",
    "Seth.jpg",
    "Stuetzle.webp", // ;)
];

export let asteroids = [];

// Generates a random asteroid material with a random color and picks a random texture from the textures array (assisted by Claude Code)
function randomMaterial() {
    const file = textures[Math.floor(Math.random() * textures.length)];
    const texture = textureLoader.load(
        new URL(`../resources/textures/${file}`, import.meta.url).href
    );
    texture.colorSpace = THREE.SRGBColorSpace;

    const color = randomColor();
    const material = new THREE.MeshBasicMaterial({ // Use the map attribute to hold the texture
        map: texture, color
    });
    addWarpStretch(material);
    return material;
}

// Generates a random color
function randomColor() {
    return new THREE.Color().setHSL(
        Math.random(), 
        0.5,
        0.5  
    );
}

// Generates a random geometry
function randomGeometry() {
    // Random size between 0.5 and 2.5
    const size = Math.random() * 2 + 0.5;
    const geometries = [
        new THREE.IcosahedronGeometry(size, 1),
        new THREE.DodecahedronGeometry(size, 1),
        new THREE.OctahedronGeometry(size, 1),
        new THREE.TetrahedronGeometry(size, 1),
    ];
    return geometries[Math.floor(Math.random() * geometries.length)];
}

// Generates a random rotation
function randomRotation() {
    return new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
}

// Generates random speed, direction, drift, and drift type (linear/parabolic/spiral)
function randomMovement() {
    const speed = Math.random() * 0.1 + 0.05; // Random speed between 0.05 and 0.15
    const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
    ).normalize();
    const drift = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
    );
    // Randomly choose how the drift is applied in moveAsteroid 
    const driftTypes = ["linear", "parabolic", "spiral"];
    const driftType = driftTypes[Math.floor(Math.random() * driftTypes.length)];// (assisted by Claude Code)
    return { speed, direction, driftType, drift };
}

// Moves an asteroid in its drift style (assisted by Claude Code)
export function moveAsteroid(asteroid) {
    const { speed, direction, driftType, drift } = asteroid.userData;
    // Drift accumulates each frame, bending the path into a parabola
    if (driftType === "parabolic")
        direction.add(drift); 
    // Turns the direction each frame, curving into a circle/helix
    else if (driftType === "spiral") 
        direction.applyAxisAngle(drift.clone().normalize(), drift.length()); 
    
    asteroid.position.addScaledVector(direction, speed);
     // Constant offset keeps the path a straight line
    if (driftType === "linear") 
        asteroid.position.add(drift);
    
}
// Generates asteroids only when the perspective camera is within a certain distance of the astroid
// Delete asteroids when they are too far from the camera
export function limitVisibility(camera, asteroid) {
    const distance = camera.position.distanceTo(asteroid.position);
    return distance < MAX_DISTANCE;
}

// Updates the asteroids in the scene, spawning new ones and deleting old ones based on their distance from the camera
export function updateAsteroids(scene, camera, asteroids) {
    // Remove asteroids that are too far away
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        if (!limitVisibility(camera, asteroid)) {
            scene.remove(asteroid);
            asteroids.splice(i, 1);
        }
    }
    // Spawn new asteroids, spawnDistance away from the camera in a random direction
    while (asteroids.length < ASTEROID_COUNT) {
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        const spawnPosition = camera.position.clone().addScaledVector(direction, SPAWN_DISTANCE);
        const asteroid = createAsteroid();
        asteroid.position.copy(spawnPosition);
        scene.add(asteroid);
        asteroids.push(asteroid);
    }
    // Move and spin every asteroid each frame
    for (const asteroid of asteroids) {
        moveAsteroid(asteroid);
        asteroid.rotation.x += 0.005;
        asteroid.rotation.y += 0.01;
        asteroid.userData.asteroidBox.setFromObject(asteroid);
    }
}

// Generates a random asteroid mesh with a custom texture material
export function createAsteroid() {
    const geometry = randomGeometry();
    const material = randomMaterial();
    const asteroid = new THREE.Mesh(geometry, material);
    // Store the movement attributes on the mesh so the animation loop can read them per asteroid (assisted by Claude Code)
    asteroid.userData = randomMovement();
    asteroid.rotation.copy(randomRotation());
    asteroid.userData.asteroidBox = new THREE.Box3().setFromObject(asteroid);
    asteroids.push(asteroid);
    return asteroid;
}