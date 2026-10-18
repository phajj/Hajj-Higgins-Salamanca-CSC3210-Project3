import * as THREE from "three";

/**
 * Creates a ship model with a cockpit, dashboard, and steering wheel.
 * @author Laura Salamanca
 */

// Ship dimensions
const W = 4,
  H = 2.8,
  D = 4,
  T = 0.1;
const WIN_BOTTOM = 0.85,
  WIN_TOP = 2.5,
  WIN_HALF = 1.7;

const wallMat = new THREE.MeshStandardMaterial({
  color: 0x5a6274,
  metalness: 0.3,
  roughness: 0.7,
});

const trimMat = new THREE.MeshStandardMaterial({
  color: 0x1c2027,
  metalness: 0.4,
  roughness: 0.5,
});

// Create a box using its minimum and maximum coordinates
function block(x0, x1, y0, y1, z0, z1, mat) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
    mat,
  );

  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

  return mesh;
}

// Build the cabin
function buildHull() {
  const hull = new THREE.Group();
  hull.name = "hull";

  const front = -D / 2;
  const back = D / 2;
  const outerFront = front - T;

  // Floor, ceiling, and back wall
  hull.add(
    block(-W / 2, W / 2, -T, 0, front, back, wallMat),
    block(-W / 2, W / 2, H, H + T, front, back, wallMat),
    block(-W / 2, W / 2, 0, H, back, back + T, wallMat),
  );

  // Front wall surrounding the main window
  hull.add(
    block(-W / 2, W / 2, 0, WIN_BOTTOM, outerFront, front, wallMat),
    block(-W / 2, W / 2, WIN_TOP, H, outerFront, front, wallMat),
    block(-W / 2, -WIN_HALF, WIN_BOTTOM, WIN_TOP, outerFront, front, wallMat),
    block(WIN_HALF, W / 2, WIN_BOTTOM, WIN_TOP, outerFront, front, wallMat),
  );

  // Side walls with window openings
  for (const side of [-1, 1]) {
    const x0 = (side * W) / 2 - (side < 0 ? T : 0);
    const x1 = (side * W) / 2 + (side > 0 ? T : 0);

    hull.add(
      block(x0, x1, 0, WIN_BOTTOM, front, back, wallMat),
      block(x0, x1, WIN_TOP, H, front, back, wallMat),
      block(x0, x1, WIN_BOTTOM, WIN_TOP, front, -1.7, wallMat),
      block(x0, x1, WIN_BOTTOM, WIN_TOP, -0.4, back, wallMat),
    );
  }

  return hull;
}

// Build the dashboard and apply its texture
function buildDashboard() {
  const dash = new THREE.Group();
  dash.name = "dashboard";
  dash.position.z = -D / 2 + 0.5;

  const depth = 1;
  const low = 0.45;
  const width = W - 0.02;

  // Sloped dashboard body
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(depth, 0);
  shape.lineTo(depth, WIN_BOTTOM);
  shape.lineTo(0, low);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: false,
  });

  geometry.translate(0, 0, -width / 2);

  const body = new THREE.Mesh(geometry, trimMat);
  body.rotation.y = Math.PI / 2;
  body.position.z = depth / 2;
  dash.add(body);

  // Flat panel following the dashboard slope
  const hinge = new THREE.Group();
  hinge.position.set(0, low, depth / 2);
  hinge.rotation.x = Math.atan2(WIN_BOTTOM - low, depth);
  dash.add(hinge);

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
  });

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 1), material);

  panel.rotation.x = -Math.PI / 2;
  hinge.add(panel);

  new THREE.TextureLoader().load(
    new URL("./controlpanel.png", import.meta.url).href,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;

      const aspect = texture.image.width / texture.image.height;
      const width = Math.min(3.9, 1.05 * aspect);
      const height = width / aspect;

      panel.geometry.dispose();
      panel.geometry = new THREE.PlaneGeometry(width, height);
      panel.position.set(0, 0.004, -height / 2);
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => console.error("Could not load controlpanel.png:", error),
  );

  return dash;
}

// Cabin lighting
function buildLights() {
  const lights = new THREE.Group();
  lights.name = "lights";

  const fill = new THREE.PointLight(0x80a0ff, 5, 8);
  fill.position.set(0, 2, 0);

  lights.add(fill, new THREE.AmbientLight(0x303c55, 1.2));
  return lights;
}

// Steering wheel
function buildWheel() {
  const wheel = new THREE.Group();
  wheel.name = "steeringWheel";
  wheel.position.set(0, 0.75, -0.3);
  wheel.rotation.x = -0.6;

  const rotor = new THREE.Group();
  rotor.name = "wheelRotor";
  wheel.add(rotor);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.028, 16, 48),
    new THREE.MeshStandardMaterial({
      color: 0x15171c,
      roughness: 0.8,
    }),
  );
  rotor.add(rim);

  // Three spokes
  for (const angle of [Math.PI, 0, -Math.PI / 2]) {
    const spoke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.24, 8),
      trimMat,
    );

    spoke.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0);

    spoke.rotation.z = angle - Math.PI / 2;
    rotor.add(spoke);
  }

  // Center hub
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16),
    trimMat,
  );
  hub.rotation.x = Math.PI / 2;
  rotor.add(hub);

  // Steering column
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.9, 10),
    trimMat,
  );
  column.rotation.x = Math.PI / 2;
  column.position.z = -0.45;
  wheel.add(column);

  return { wheel, rotor };
}

// Assemble the ship
export function createShip() {
  const ship = new THREE.Group();
  ship.name = "ship";

  const cameraMount = new THREE.Group();
  cameraMount.name = "cameraMount";
  cameraMount.position.set(0, 1.1, 0.5);

  const { wheel, rotor } = buildWheel();

  ship.add(buildHull(), buildDashboard(), wheel, buildLights(), cameraMount);

  let previousTime = null;

  function update(time, throttle = 0, steer = 0) {
    const dt = previousTime === null ? 0 : time - previousTime;
    previousTime = time;

    // Smoothly rotate the wheel toward the steering input
    rotor.rotation.z +=
      (steer * 0.9 - rotor.rotation.z) * (1 - Math.exp(-10 * dt));
  }

  return { ship, cameraMount, update };
}
