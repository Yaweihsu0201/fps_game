export function createEnemyManager(scene, camera, player, ui) {
  const enemies = [];

  const enemyMat = new BABYLON.StandardMaterial("emat", scene);
  enemyMat.diffuseColor = new BABYLON.Color3(0.85, 0.25, 0.25);

  function spawn() {
    const e = BABYLON.MeshBuilder.CreateSphere(
      "enemy",
      { diameter: 1.2 },
      scene
    );
    e.material = enemyMat;
    e.position.set(
      Math.random() * 50 - 25,
      0.8,
      Math.random() * 50 - 25
    );
    e.metadata = {
      hp: 70,
      speed: 0.04 + Math.random() * 0.03,
      hitCooldown: 0
    };
    enemies.push(e);
    ui.enemyCount.textContent = enemies.length;
  }

  function update(dt) {
    for (const e of enemies) {
      if (!e || e.isDisposed()) continue;

      const dir = camera.position.subtract(e.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist > 0.001) {
        dir.normalize();
        e.position.addInPlace(dir.scale(e.metadata.speed * 60 * dt));
      }

      e.metadata.hitCooldown -= dt;
      if (dist < 1.6 && e.metadata.hitCooldown <= 0) {
        player.setHP(player.data.hp - 10);
        e.metadata.hitCooldown = 1;
      }
    }
  }

  function remove(mesh) {
    const idx = enemies.indexOf(mesh);
    if (idx !== -1) enemies.splice(idx, 1);
  }

  return {
    list: enemies,
    spawn,
    update,
    remove
  };
}
