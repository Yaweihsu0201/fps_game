const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
});

const ui = {
    enemyCount: document.getElementById("enemyCount"),
    score: document.getElementById("score"),
    hpfill: document.getElementById("hpfill"),
    hint: document.getElementById("hint")
};

function createScene() {
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
    const b = BABYLON.MeshBuilder.CreateBox("cover" + i, { size: 2 }, scene);
    b.position.set(Math.random() * 60 - 30, 1, Math.random() * 60 - 30);
    b.scaling.y = 1 + Math.random() * 2;
    b.material = coverMat;
    b.checkCollisions = true;
    }

    /* ---------- Camera ---------- */
    const camera = new BABYLON.UniversalCamera(
    "cam",
    new BABYLON.Vector3(0, 1.7, -10),
    scene
    );

    camera.attachControl(canvas, true);
    camera.speed = 0.45;
    camera.angularSensibility = 5000;
    camera.applyGravity = false;
    camera.ellipsoid = new BABYLON.Vector3(0.45, 0.9, 0.45);
    camera.checkCollisions = true;

    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.25, 0);

    camera.keysUp = [87];
    camera.keysDown = [83];
    camera.keysLeft = [65];
    camera.keysRight = [68];

    /* ---------- Jump machanics ---------- */
    let jumpVelocity = 0;
    const JUMP_FORCE = 0.45;
    const GRAVITY = -0.01;

    window.addEventListener("keydown", e => {
    console.log(isGrounded);
    if (e.code === "Space" && isGrounded) {
        jumpVelocity = JUMP_FORCE;
    }
    });

    /*---check if player is on the ground---*/
    scene.onBeforeRenderObservable.add(() => {
    const ray = new BABYLON.Ray(
        camera.position,
        BABYLON.Vector3.Down(),
        2.0
    );
    isGrounded = scene.pickWithRay(ray, m => m.checkCollisions)?.hit;
    
    if (!isGrounded) jumpVelocity += GRAVITY;
    if (isGrounded && jumpVelocity < 0) jumpVelocity = 0;

    camera.cameraDirection.y += jumpVelocity;
    });


    /* ---------- Pointer Lock ---------- */
    canvas.addEventListener("click", () => {
    if (!engine.isPointerLock) {
        canvas.requestPointerLock?.();
    }
    });

    document.addEventListener("pointerlockchange", () => {
    ui.hint.style.display = document.pointerLockElement ? "none" : "block";
    });

    /* ---------- Player ---------- */
    const player = {
    hp: 100,
    maxHp: 100,
    fireCooldown: 0,
    fireRate: 8,
    damage: 35,
    score: 0
    };

    function setHP(v) {
    player.hp = Math.max(0, Math.min(player.maxHp, v));
    ui.hpfill.style.width = (player.hp / player.maxHp) * 100 + "%";
    ui.hpfill.style.background =
        player.hp > 40
        ? "rgba(0,200,80,.9)"
        : "rgba(240,120,40,.9)";
    }
    setHP(player.hp);

    /* ---------- Enemies ---------- */
    const enemies = [];
    const enemyMat = new BABYLON.StandardMaterial("emat", scene);
    enemyMat.diffuseColor = new BABYLON.Color3(0.85, 0.25, 0.25);

  function spawnEnemy() {
    const e = BABYLON.MeshBuilder.CreateSphere(
      "enemy",
      { diameter: 1.2 },
      scene
    );
    e.material = enemyMat;
    e.position.set(Math.random() * 50 - 25, 0.8, Math.random() * 50 - 25);
    e.metadata = {
      hp: 70,
      speed: 0.04 + Math.random() * 0.03,
      hitCooldown: 0
    };
    enemies.push(e);
    ui.enemyCount.textContent = enemies.length;
  }

  for (let i = 0; i < 6; i++) spawnEnemy();

  /* ---------- Muzzle Flash ---------- */
  const muzzle = new BABYLON.PointLight(
    "muzzle",
    camera.position.clone(),
    scene
  );
  muzzle.intensity = 0;
  muzzle.range = 6;

  function flashMuzzle() {
    muzzle.intensity = 2.2;
    setTimeout(() => (muzzle.intensity = 0), 50);
  }

  /* ---------- Shooting ---------- */
  function shoot() {
    const ray = camera.getForwardRay(80);
    const pick = scene.pickWithRay(
      ray,
      mesh => mesh && mesh.name === "enemy"
    );

    flashMuzzle();

    if (pick?.hit && pick.pickedMesh) {
        const m = pick.pickedMesh;
        m.metadata.hp -= player.damage;

        const oldMat = m.material;
        const hitMat = new BABYLON.StandardMaterial("hit", scene);
        hitMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.2);
        m.material = hitMat;

        setTimeout(() => {
                if (!m.isDisposed()) m.material = oldMat;
        }, 60);

      if (m.metadata.hp <= 0) {
        enemies.splice(enemies.indexOf(m), 1);
        m.dispose();
        player.score += 10;
        ui.score.textContent = player.score;
        ui.enemyCount.textContent = enemies.length;
      }
    }
  }

  scene.onPointerObservable.add(info => {
    if (
      info.type === BABYLON.PointerEventTypes.POINTERDOWN &&
      info.event.button === 0 &&
      player.fireCooldown <= 0
    ) {
        shoot();
        player.fireCooldown = 1 / player.fireRate;
    }
  });

  /* ---------- Game Loop ---------- */
  let spawnTimer = 0;

  scene.onBeforeRenderObservable.add(() => {
    const dt = engine.getDeltaTime() / 1000;
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);

    for (const e of enemies) {
      if (!e || e.isDisposed()) continue;

      const dir = camera.position.subtract(e.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist > 0.001) {
        dir.scaleInPlace(1 / dist);
        e.position.addInPlace(dir.scale(e.metadata.speed * 60 * dt));
      }

      e.metadata.hitCooldown -= dt;
      if (dist < 1.6 && e.metadata.hitCooldown <= 0) {
        setHP(player.hp - 10);
        e.metadata.hitCooldown = 1;
      }
    }

    spawnTimer += dt;
    if (spawnTimer > 2 && enemies.length < 10) {
      spawnTimer = 0;
      spawnEnemy();
    }

    if (player.hp <= 0) {
      ui.hint.style.display = "block";
      ui.hint.textContent = "你掛了。重新整理頁面再來一局";
      scene.detachControl();
    }

    muzzle.position.copyFrom(camera.position);
  });

  return scene;
}

const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
