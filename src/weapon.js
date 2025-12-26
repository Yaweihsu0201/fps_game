export function createWeapon(scene, camera, player, enemies, ui) {
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

  function shoot() {
    const ray = camera.getForwardRay(80);
    const pick = scene.pickWithRay(ray, m => m?.name === "enemy");

    flashMuzzle();

    if (pick?.hit && pick.pickedMesh) {
      const m = pick.pickedMesh;
      m.metadata.hp -= player.data.damage;

      const oldMat = m.material;
      const hitMat = new BABYLON.StandardMaterial("hit", scene);
      hitMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.2);
      m.material = hitMat;

      setTimeout(() => {
        if (!m.isDisposed()) m.material = oldMat;
      }, 60);

      if (m.metadata.hp <= 0) {
        enemies.remove(m);
        m.dispose();
        player.addScore(10);
        ui.enemyCount.textContent = enemies.list.length;
      }
    }
  }

  function update(dt) {
    player.data.fireCooldown = Math.max(
      0,
      player.data.fireCooldown - dt
    );
    muzzle.position.copyFrom(camera.position);
  }

  return {
    shoot,
    update
  };
}
