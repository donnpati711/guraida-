const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");
const altitudeDisplay = document.querySelector("#altitude");
const distanceDisplay = document.querySelector("#distance");
const speedDisplay = document.querySelector("#speed");
const coinCount = document.querySelector("#coin-count");
const shopCoins = document.querySelector("#shop-coins");
const costumeCoins = document.querySelector("#costume-coins");
const flightStatus = document.querySelector("#flight-status");
const statusText = document.querySelector("#status-text");
const overlayEyebrow = document.querySelector("#overlay-eyebrow");
const overlayTitle = document.querySelector("#overlay-title");
const overlayCopy = document.querySelector("#overlay-copy");
const buttonLabel = document.querySelector("#button-label");
const costumeOverlay = document.querySelector("#costume-overlay");
const eventBanner = document.querySelector("#event-banner");
const saveKey = "skybound-progress";
const upgrades = {
  altitude: { button: document.querySelector("#upgrade-altitude"), label: "スタート高度", detail: "高い位置から飛び立つ", baseCost: 15 },
  speed: { button: document.querySelector("#upgrade-speed"), label: "グライダー速度", detail: "滑空スピードがアップ", baseCost: 20 },
  thermal: { button: document.querySelector("#upgrade-thermal"), label: "サーマル感知", detail: "上昇気流を強化", baseCost: 25 },
  glide: { button: document.querySelector("#upgrade-glide"), label: "省エネ翼", detail: "下降をゆるやかにする", baseCost: 25 },
  reward: { button: document.querySelector("#upgrade-reward"), label: "コインボーナス", detail: "距離コインが増える", baseCost: 35 },
  event: { button: document.querySelector("#upgrade-event"), label: "幸運のお守り", detail: "イベントが起きやすくなる", baseCost: 30 },
};
const pilotCostumes = [
  { id: "classic", name: "スカイブルー", color: "#5e9fb0", cost: 0 },
  { id: "sunset", name: "サンセット", color: "#e1845d", cost: 35 },
  { id: "forest", name: "フォレスト", color: "#58856c", cost: 50 },
  { id: "berry", name: "ベリー", color: "#a96686", cost: 65 },
  { id: "gold", name: "スターライト", color: "#d1a342", cost: 90 },
];
const gliderCostumes = [
  { id: "classic", name: "アイボリー", color: "#f8f5e9", accent: "#db9166", cost: 0 },
  { id: "coral", name: "コーラル", color: "#efad91", accent: "#b84f4c", cost: 40 },
  { id: "lagoon", name: "ラグーン", color: "#85c7bd", accent: "#357d83", cost: 55 },
  { id: "violet", name: "トワイライト", color: "#b3a5d4", accent: "#6d5f9a", cost: 70 },
  { id: "sunrise", name: "サンライズ", color: "#f0d47a", accent: "#e38c50", cost: 95 },
];
const thermals = [];
const clouds = [];
const progress = loadProgress();
const state = {
  active: false,
  ended: false,
  time: 0,
  cameraX: 0,
  altitude: 0,
  gliderY: 0,
  speed: 190,
  verticalSpeed: 0,
  pitch: 0,
  distance: 0,
  lastFrame: 0,
  width: 0,
  height: 0,
  pixelRatio: 1,
  crashed: false,
  nextEventIn: 0,
  eventRemaining: 0,
  eventType: null,
  eventBonus: 0,
};

function loadProgress() {
  const saved = localStorage.getItem(saveKey);
  const defaults = {
    coins: 0, altitude: 0, speed: 0, thermal: 0, glide: 0, reward: 0, event: 0,
    ownedPilot: ["classic"], ownedGlider: ["classic"], pilot: "classic", glider: "classic",
  };
  if (!saved) return defaults;
  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return defaults;
    const ownedPilot = Array.isArray(parsed.ownedPilot)
      ? parsed.ownedPilot.filter((id) => pilotCostumes.some((costume) => costume.id === id))
      : ["classic"];
    const ownedGlider = Array.isArray(parsed.ownedGlider)
      ? parsed.ownedGlider.filter((id) => gliderCostumes.some((costume) => costume.id === id))
      : ["classic"];
    if (!ownedPilot.includes("classic")) ownedPilot.push("classic");
    if (!ownedGlider.includes("classic")) ownedGlider.push("classic");
    return {
      coins: Number.isFinite(parsed.coins) ? Math.max(0, Math.floor(parsed.coins)) : 0,
      altitude: Number.isFinite(parsed.altitude) ? Math.min(5, Math.max(0, Math.floor(parsed.altitude))) : 0,
      speed: Number.isFinite(parsed.speed) ? Math.min(5, Math.max(0, Math.floor(parsed.speed))) : 0,
      thermal: Number.isFinite(parsed.thermal) ? Math.min(5, Math.max(0, Math.floor(parsed.thermal))) : 0,
      glide: Number.isFinite(parsed.glide) ? Math.min(5, Math.max(0, Math.floor(parsed.glide))) : 0,
      reward: Number.isFinite(parsed.reward) ? Math.min(5, Math.max(0, Math.floor(parsed.reward))) : 0,
      event: Number.isFinite(parsed.event) ? Math.min(5, Math.max(0, Math.floor(parsed.event))) : 0,
      ownedPilot,
      ownedGlider,
      pilot: ownedPilot.includes(parsed.pilot) ? parsed.pilot : "classic",
      glider: ownedGlider.includes(parsed.glider) ? parsed.glider : "classic",
    };
  } catch {
    return defaults;
  }
}

function saveProgress() {
  localStorage.setItem(saveKey, JSON.stringify(progress));
}

function upgradeCost(name) {
  const upgrade = upgrades[name];
  return upgrade.baseCost * (progress[name] + 1);
}

function updateProgressDisplay() {
  coinCount.textContent = String(progress.coins);
  shopCoins.textContent = String(progress.coins);
  for (const [name, upgrade] of Object.entries(upgrades)) {
    const level = progress[name];
    const button = upgrade.button;
    if (level >= 5) {
      button.innerHTML = `<span class="upgrade-name">${upgrade.label}<small>${upgrade.detail} · MAX</small></span><span class="upgrade-cost">MAX</span>`;
      button.disabled = true;
      continue;
    }
    const cost = upgradeCost(name);
    button.innerHTML = `<span class="upgrade-name">${upgrade.label} Lv.${level}<small>${upgrade.detail}</small></span><span class="upgrade-cost">● ${cost}</span>`;
    button.disabled = progress.coins < cost;
  }
  updateCostumeShop();
}

function buyUpgrade(name) {
  const cost = upgradeCost(name);
  if (progress[name] >= 5 || progress.coins < cost) return;
  progress.coins -= cost;
  progress[name] += 1;
  saveProgress();
  updateProgressDisplay();
}

function updateCostumeShop() {
  costumeCoins.textContent = String(progress.coins);
  renderCostumeCategory("#pilot-costumes", pilotCostumes, "pilot", progress.ownedPilot);
  renderCostumeCategory("#glider-costumes", gliderCostumes, "glider", progress.ownedGlider);
}

function renderCostumeCategory(selector, costumes, type, owned) {
  const container = document.querySelector(selector);
  container.replaceChildren();
  for (const costume of costumes) {
    const card = document.createElement("article");
    card.className = "costume-card";
    const swatch = document.createElement("span");
    swatch.className = "costume-swatch";
    swatch.style.background = costume.color;
    const title = document.createElement("strong");
    title.textContent = costume.name;
    const actionButton = document.createElement("button");
    actionButton.className = "costume-action";
    actionButton.type = "button";
    if (owned.includes(costume.id)) {
      actionButton.textContent = progress[type] === costume.id ? "装備中" : "装備";
      actionButton.disabled = progress[type] === costume.id;
      actionButton.addEventListener("click", () => {
        progress[type] = costume.id;
        saveProgress();
        updateCostumeShop();
        draw();
      });
    } else {
      actionButton.textContent = `購入 ● ${costume.cost}`;
      actionButton.disabled = progress.coins < costume.cost;
      actionButton.addEventListener("click", () => {
        if (progress.coins < costume.cost) return;
        progress.coins -= costume.cost;
        owned.push(costume.id);
        progress[type] = costume.id;
        saveProgress();
        updateProgressDisplay();
      });
    }
    card.append(swatch, title, actionButton);
    container.append(card);
  }
}

function openCostumeShop() {
  overlay.classList.add("is-hidden");
  updateCostumeShop();
  costumeOverlay.classList.remove("is-hidden");
  costumeOverlay.setAttribute("aria-hidden", "false");
  draw();
}

function closeCostumeShop() {
  costumeOverlay.classList.add("is-hidden");
  costumeOverlay.setAttribute("aria-hidden", "true");
  overlay.classList.remove("is-hidden");
  updateCostumeShop();
  draw();
}

function showEvent(message) {
  eventBanner.textContent = message;
  eventBanner.classList.add("is-visible");
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  state.width = bounds.width;
  state.height = bounds.height;
  state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * state.pixelRatio);
  canvas.height = Math.round(bounds.height * state.pixelRatio);
  context.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
  if (!state.active) {
    state.gliderY = state.height * 0.39;
    state.altitude = groundHeight(state.cameraX) - state.gliderY;
  }
  seedClouds();
  draw();
}

function seedClouds() {
  clouds.length = 0;
  for (let i = 0; i < 10; i += 1) {
    clouds.push({
      x: (i * 181 + 42) % (state.width + 140),
      y: 75 + ((i * 67) % Math.max(100, state.height * 0.38)),
      scale: 0.55 + ((i * 17) % 70) / 100,
    });
  }
}

function groundHeight(worldX) {
  const h = state.height;
  const base = h * 0.78;
  return base + Math.sin(worldX * 0.0015) * h * 0.055 +
    Math.sin(worldX * 0.0034 + 1.1) * h * 0.025;
}

function addThermal(worldX) {
  thermals.push({
    x: worldX,
    y: 0.4 + Math.random() * 0.3,
    radius: 85 + Math.random() * 65,
    strength: 38 + Math.random() * 32,
  });
}

function resetFlight() {
  state.active = true;
  state.ended = false;
  state.time = 0;
  state.cameraX = 0;
  state.speed = 190 + progress.speed * 14;
  state.verticalSpeed = 8;
  state.pitch = 0;
  state.distance = 0;
  state.crashed = false;
  state.eventBonus = 0;
  state.eventType = null;
  state.eventRemaining = 0;
  state.nextEventIn = 5 + Math.random() * 7 - progress.event * 0.4;
  state.gliderY = Math.max(48, groundHeight(0) - state.height * 0.39 - progress.altitude * 28);
  state.altitude = groundHeight(0) - state.gliderY;
  state.lastFrame = performance.now();
  thermals.length = 0;
  let thermalX = 300 + Math.random() * 550;
  for (let i = 0; i < 4; i += 1) {
    addThermal(thermalX);
    thermalX += 420 + Math.random() * 650;
  }
  eventBanner.textContent = "";
  eventBanner.classList.remove("is-visible");
  overlay.classList.add("is-hidden");
  flightStatus.classList.add("is-flying");
  flightStatus.classList.remove("is-warning");
  statusText.textContent = "SOARING";
  requestAnimationFrame(frame);
}

function finishFlight() {
  state.active = false;
  state.ended = true;
  state.crashed = true;
  const earnedCoins = Math.floor(state.distance / 100 * (1 + progress.reward * 0.15)) + state.eventBonus;
  progress.coins += earnedCoins;
  saveProgress();
  updateProgressDisplay();
  overlayEyebrow.textContent = "FLIGHT COMPLETE";
  overlayTitle.textContent = "ナイスフライト。";
  overlayCopy.textContent = `${Math.floor(state.distance)}m 滑空して、${earnedCoins} コイン獲得！強化して、さらに遠くを目指そう。`;
  buttonLabel.textContent = "もう一度飛ぶ";
  overlay.classList.remove("is-hidden");
  flightStatus.classList.remove("is-flying", "is-warning");
  statusText.textContent = "LANDED";
}

function thermalLift() {
  let lift = 0;
  const gliderWorldX = state.cameraX + state.width * 0.28;
  for (const thermal of thermals) {
    const distance = Math.abs(gliderWorldX - thermal.x);
    if (distance < thermal.radius) {
      lift = Math.max(lift, thermal.strength * (1 - distance / thermal.radius));
    }
  }
  return lift;
}

function update(delta) {
  const dt = Math.min(delta, 0.04);
  state.time += dt;
  const pitchTarget = Math.sin(state.time * 0.35) * 0.08;
  state.pitch += (pitchTarget - state.pitch) * Math.min(1, dt * 2.8);
  if (state.eventRemaining > 0) {
    state.eventRemaining -= dt;
    if (state.eventRemaining <= 0) {
      state.eventType = null;
      eventBanner.classList.remove("is-visible");
    }
  } else {
    state.nextEventIn -= dt;
    if (state.nextEventIn <= 0) {
      const event = Math.floor(Math.random() * 3);
      state.eventRemaining = 4 + Math.random() * 2;
      if (event === 0) {
        state.eventType = "tailwind";
        showEvent("追い風！しばらくスピードアップ");
      } else if (event === 1) {
        state.eventType = "thermal";
        showEvent("上昇気流！高度を保ちやすい");
      } else {
        state.eventType = "coins";
        state.eventBonus += 2 + Math.floor(Math.random() * 3);
        showEvent("コインの風！着地時にボーナス");
      }
      state.nextEventIn = 16 + Math.random() * 14 - progress.event * 0.8;
    }
  }
  const lift = thermalLift() + (state.eventType === "thermal" ? 8 : 0);
  const sinkRate = 21 - state.pitch * 57 - lift * (1 + progress.thermal * 0.2) - progress.thermal * 1.5 - progress.glide * 2.2;
  state.verticalSpeed += (sinkRate - state.verticalSpeed) * Math.min(1, dt * 1.5);
  const targetSpeed = 190 + progress.speed * 14 + (state.eventType === "tailwind" ? 25 : 0) - state.pitch * 38;
  state.speed += (targetSpeed - state.speed) * Math.min(1, dt * 0.6);
  state.cameraX += state.speed * dt;
  state.distance = state.cameraX;
  state.gliderY = Math.max(48, state.gliderY + state.verticalSpeed * dt);
  state.altitude = groundHeight(state.cameraX) - state.gliderY;

  if (state.altitude <= 18) {
    finishFlight();
    return;
  }

  const nextThermalX = thermals.length
    ? thermals[thermals.length - 1].x
    : state.cameraX;
  if (nextThermalX < state.cameraX + state.width * 1.9) {
    addThermal(nextThermalX + 420 + Math.random() * 650);
  }

  altitudeDisplay.textContent = String(Math.max(0, Math.floor(state.altitude * 2)));
  distanceDisplay.textContent = String(Math.floor(state.distance));
  speedDisplay.textContent = String(Math.floor(state.speed * 0.72));
  flightStatus.classList.toggle("is-warning", state.altitude < 90);
  statusText.textContent = state.eventType === "tailwind" ? "TAILWIND"
    : state.eventType === "thermal" ? "SUPER THERMAL"
      : lift > 8 ? "THERMAL LIFT" : state.altitude < 90 ? "LOW ALTITUDE" : "SOARING";
}

function drawCloud(x, y, scale) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = "rgba(255, 255, 255, 0.48)";
  context.beginPath();
  context.ellipse(0, 9, 37, 10, 0, 0, Math.PI * 2);
  context.ellipse(-18, 3, 18, 13, 0, 0, Math.PI * 2);
  context.ellipse(2, -3, 22, 18, 0, 0, Math.PI * 2);
  context.ellipse(22, 5, 17, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawThermals() {
  const gliderX = state.width * 0.28;
  const gliderY = state.gliderY;
  for (const thermal of thermals) {
    const x = thermal.x - state.cameraX + gliderX;
    if (x < -180 || x > state.width + 180) continue;
    const centerY = state.height * thermal.y;
    const fade = context.createLinearGradient(x, centerY - state.height * 0.2, x, centerY + state.height * 0.2);
    fade.addColorStop(0, "rgba(245, 172, 115, 0)");
    fade.addColorStop(0.45, "rgba(245, 172, 115, 0.13)");
    fade.addColorStop(1, "rgba(245, 172, 115, 0)");
    context.fillStyle = fade;
    context.beginPath();
    context.ellipse(x, centerY, 31, state.height * 0.2, 0, 0, Math.PI * 2);
    context.fill();
    for (let i = 0; i < 3; i += 1) {
      const rise = (state.time * 36 + i * 27) % 94;
      context.globalAlpha = 0.5 - rise / 210;
      context.strokeStyle = "#e7a171";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(x + Math.sin(state.time + i) * 7, centerY + state.height * 0.11 - rise, 6 + rise * 0.08, Math.PI, 0);
      context.stroke();
    }
    context.globalAlpha = 1;
  }
}

function drawTerrain() {
  const w = state.width;
  const h = state.height;
  const camera = state.cameraX;
  const gliderX = w * 0.28;
  const step = 12;

  context.fillStyle = "#99b9a2";
  context.beginPath();
  context.moveTo(0, h);
  for (let x = 0; x <= w + step; x += step) {
    const worldX = camera + x - gliderX;
    const farHill = groundHeight(worldX * 1.6) - h * 0.12;
    context.lineTo(x, farHill);
  }
  context.lineTo(w, h);
  context.closePath();
  context.fill();

  const terrain = context.createLinearGradient(0, h * 0.64, 0, h);
  terrain.addColorStop(0, "#72977d");
  terrain.addColorStop(1, "#456b61");
  context.fillStyle = terrain;
  context.beginPath();
  context.moveTo(0, h);
  for (let x = 0; x <= w + step; x += step) {
    context.lineTo(x, groundHeight(camera + x - gliderX));
  }
  context.lineTo(w, h);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(237, 236, 204, 0.56)";
  context.lineWidth = 2;
  context.beginPath();
  for (let x = 0; x <= w + step; x += step) {
    const y = groundHeight(camera + x - gliderX);
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function drawGlider() {
  const x = state.width * 0.28;
  const y = state.gliderY;
  const angle = -state.pitch * 0.27;
  const pilot = pilotCostumes.find(({ id }) => id === progress.pilot);
  const glider = gliderCostumes.find(({ id }) => id === progress.glider);
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.shadowColor = "rgba(34, 65, 71, 0.22)";
  context.shadowBlur = 9;
  context.shadowOffsetY = 4;
  context.fillStyle = glider.color;
  context.beginPath();
  context.moveTo(-41, 1);
  context.lineTo(13, -3);
  context.lineTo(37, 0);
  context.lineTo(13, 3);
  context.lineTo(-41, 1);
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = glider.accent;
  context.beginPath();
  context.moveTo(-9, 0);
  context.lineTo(12, -2);
  context.lineTo(26, 0);
  context.lineTo(12, 2);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(42, 75, 79, 0.6)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-3, 0);
  context.lineTo(5, 15);
  context.moveTo(20, 0);
  context.lineTo(5, 15);
  context.stroke();
  context.fillStyle = "#d99d78";
  context.beginPath();
  context.arc(5, 20, 6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = pilot.color;
  context.beginPath();
  context.roundRect(-3, 25, 16, 13, 5);
  context.fill();
  context.strokeStyle = "#35545a";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, 36);
  context.lineTo(-5, 43);
  context.moveTo(9, 36);
  context.lineTo(16, 42);
  context.stroke();
  context.strokeStyle = "#3e4543";
  context.lineWidth = 1.2;
  context.beginPath();
  if (state.crashed) {
    for (const eyeX of [2, 8]) {
      context.moveTo(eyeX - 1.5, 18.5);
      context.lineTo(eyeX + 1.5, 21.5);
      context.moveTo(eyeX + 1.5, 18.5);
      context.lineTo(eyeX - 1.5, 21.5);
    }
  } else {
    context.arc(2, 20, 0.8, 0, Math.PI * 2);
    context.arc(8, 20, 0.8, 0, Math.PI * 2);
    context.moveTo(3, 23);
    context.quadraticCurveTo(5, 25, 8, 23);
  }
  context.stroke();
  context.restore();
}

function draw() {
  const w = state.width;
  const h = state.height;
  if (!w || !h) return;

  const sky = context.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#a9dcea");
  sky.addColorStop(0.62, "#d5ece7");
  sky.addColorStop(1, "#f2ead5");
  context.fillStyle = sky;
  context.fillRect(0, 0, w, h);

  context.fillStyle = "rgba(255, 238, 193, 0.34)";
  context.beginPath();
  context.arc(w * 0.78, h * 0.19, Math.min(w, h) * 0.13, 0, Math.PI * 2);
  context.fill();

  for (const cloud of clouds) {
    const x = ((cloud.x - state.cameraX * 0.12) % (w + 140) + w + 140) % (w + 140) - 70;
    drawCloud(x, cloud.y, cloud.scale);
  }

  drawThermals();
  drawTerrain();
  drawGlider();
}
あ
function frame(timestamp) {
  if (!state.active) return;
  const delta = (timestamp - state.lastFrame) / 1000;
  state.lastFrame = timestamp;
  update(delta);
  draw();
  if (state.active) requestAnimationFrame(frame);
}

startButton.addEventListener("click", resetFlight);
for (const name of Object.keys(upgrades)) {
  upgrades[name].button.addEventListener("click", () => buyUpgrade(name));
}
document.querySelector("#open-costume-shop").addEventListener("click", openCostumeShop);
document.querySelector("#close-costume-shop").addEventListener("click", closeCostumeShop);
document.querySelector("#done-costume-shop").addEventListener("click", () => {
  closeCostumeShop();
  resetFlight();
});
costumeOverlay.addEventListener("click", (event) => {
  if (event.target === costumeOverlay) closeCostumeShop();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !costumeOverlay.classList.contains("is-hidden")) {
    closeCostumeShop();
  }
});

window.addEventListener("resize", resizeCanvas);
updateProgressDisplay();
resizeCanvas();
