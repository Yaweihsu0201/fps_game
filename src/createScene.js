import { createUI } from "./ui.js";
import { createPlayer } from "./player.js";
import { createEnemyManager } from "./enemy.js";
import { createWeapon } from "./weapon.js";

export function createScene(engine, canvas) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
   /* ---------- Light ---------- */
  const light = new BABYLON.HemisphericLight(
    "hemi",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.9;

  /* ---------- Ground ---------- */
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 80, height: 80 },
    scene
  );
  const gmat = new BABYLON.StandardMaterial("gmat", scene);
  gmat.diffuseColor = new BABYLON.Color3(0.08, 0.09, 0.11);
  ground.material = gmat;
  ground.checkCollisions = true;

  /* ---------- Covers ---------- */
  const coverMat = new BABYLON.StandardMaterial("coverMat", scene);
  coverMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);

  for (let i = 0; i < 14; i++) {
    const b = BABYLON.MeshBuilder.CreateBox(
      "cover" + i,
      { size: 2 },
      scene
    );
    b.position.set(
      Math.random() * 60 - 30,
      1,
      Math.random() * 60 - 30
    );
    b.scaling.y = 1 + Math.random() * 2;
    b.material = coverMat;
    b.checkCollisions = true;
  }

  scene.collisionsEnabled = true;

  const ui = createUI();
  const camera = new BABYLON.UniversalCamera(
    "cam",
    new BABYLON.Vector3(0, 1.7, -10),
    scene
  );
  camera.attachControl(canvas, true);
  camera.speed = 0.45;
  camera.angularSensibility = 5000;
  camera.checkCollisions = true;
  camera.ellipsoid = new BABYLON.Vector3(0.45, 0.9, 0.45);

  camera.keysUp = [87];    // W
  camera.keysDown = [83]; // S
  camera.keysLeft = [65]; // A
  camera.keysRight = [68];// D

  /* ---------- Jump mechanics ---------- */
  let jumpVelocity = 0;
  let isGrounded = false;

  const JUMP_FORCE = 0.05;
  const GRAVITY = -0.002;

  window.addEventListener("keydown", e => {
    if (e.code === "Space" && isGrounded) {
      jumpVelocity = JUMP_FORCE;
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    const footPosition = camera.position.clone();
    footPosition.y -= camera.ellipsoid.y;
    const ray = new BABYLON.Ray(
      footPosition,
      BABYLON.Vector3.Down(),
      1
    );

    isGrounded = scene.pickWithRay(
      ray,
      m => m.checkCollisions
    )?.hit;

    if (!isGrounded) jumpVelocity += GRAVITY;
    if (isGrounded && jumpVelocity < 0) jumpVelocity = 0;

    camera.cameraDirection.y += jumpVelocity;
  });

  /* ---------- Pointer Lock ---------- */
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
      ui.hint.style.display = "none";
    } else {
      ui.hint.style.display = "block";
      ui.hint.textContent = "Click to lock mouse";
    }
  });

  const player = createPlayer(ui);
  const enemies = createEnemyManager(scene, camera, player, ui);
  const weapon = createWeapon(scene, camera, player, enemies, ui);

  for (let i = 0; i < 6; i++) enemies.spawn();

  scene.onPointerObservable.add(info => {
    if (
      info.type === BABYLON.PointerEventTypes.POINTERDOWN &&
      info.event.button === 0 &&
      player.data.fireCooldown <= 0
    ) {
      weapon.shoot();
      player.data.fireCooldown = 1 / player.data.fireRate;
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;
    enemies.update(dt);
    weapon.update(dt);
  });

  return scene;
}
