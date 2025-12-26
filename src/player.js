export function createPlayer(ui) {
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

  function addScore(v) {
    player.score += v;
    ui.score.textContent = player.score;
  }

  return {
    data: player,
    setHP,
    addScore
  };
}
