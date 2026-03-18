const SCREENS = {
  welcome: document.getElementById("welcomeScreen"),
  game: document.getElementById("gameScreen"),
  success: document.getElementById("successScreen"),
};

const startGameBtn = document.getElementById("startGameBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const resetProgressBtn = document.getElementById("resetProgressBtn");
const resetGameBtn = document.getElementById("resetGameBtn");
const applyCodeBtn = document.getElementById("applyCodeBtn");

const attemptsCount = document.getElementById("attemptsCount");
const gameMessage = document.getElementById("gameMessage");
const codeMessage = document.getElementById("codeMessage");
const promoCodeInput = document.getElementById("promoCodeInput");
const rewardsList = document.getElementById("rewardsList");

const welcomeLamp = document.getElementById("welcomeLamp");
const welcomeGlow = document.getElementById("welcomeGlow");
const gameLamp = document.getElementById("gameLamp");
const gameGlow = document.getElementById("gameGlow");

const wireLayer = document.getElementById("wireLayer");
const playground = document.getElementById("playground");

const dotZinc = document.getElementById("dot-zinc");
const dotCopper = document.getElementById("dot-copper");
const dotWireRed = document.getElementById("dot-wire-red");
const dotWireBlack = document.getElementById("dot-wire-black");

const partZinc = document.getElementById("part-zinc");
const partCopper = document.getElementById("part-copper");
const partWireRed = document.getElementById("part-wire-red");
const partWireBlack = document.getElementById("part-wire-black");

const targetZinc = document.getElementById("target-zinc");
const targetCopper = document.getElementById("target-copper");
const lampRed = document.getElementById("lamp-red");
const lampBlack = document.getElementById("lamp-black");

const STORAGE_KEY = "agroum_drag_light_v4";

const PROMO_CODES = {
  LIGHT: {
    title: "Искра света",
    text: "Ты получил награду: Искра света",
  },
  AGROUM: {
    title: "Знак учёного",
    text: "Ты получил награду: Знак учёного",
  },
  LEMON: {
    title: "Лимонная энергия",
    text: "Ты получил награду: Лимонная энергия",
  },
};

const REQUIRED = {
  zinc: false,
  copper: false,
  "wire-red": false,
  "wire-black": false,
};

let state = {
  attempts: 0,
  completed: false,
  rewards: [],
  usedCodes: [],
};

let dragState = null;

const draggables = [
  { el: partZinc, part: "zinc" },
  { el: partCopper, part: "copper" },
  { el: partWireRed, part: "wire-red" },
  { el: partWireBlack, part: "wire-black" },
];

const targets = [
  { el: targetZinc, accept: "zinc" },
  { el: targetCopper, accept: "copper" },
  { el: lampRed, accept: "wire-red" },
  { el: lampBlack, accept: "wire-black" },
];

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state = {
      attempts: parsed.attempts || 0,
      completed: Boolean(parsed.completed),
      rewards: Array.isArray(parsed.rewards) ? parsed.rewards : [],
      usedCodes: Array.isArray(parsed.usedCodes) ? parsed.usedCodes : [],
    };
  } catch (error) {
    console.error("Ошибка загрузки состояния:", error);
  }
}

function showScreen(name) {
  Object.values(SCREENS).forEach((screen) => screen.classList.remove("active"));
  SCREENS[name].classList.add("active");
}

function showMessage(element, type, text) {
  element.classList.remove("hidden", "success", "error");
  element.classList.add(type);
  element.textContent = text;
}

function hideMessage(element) {
  element.classList.add("hidden");
  element.classList.remove("success", "error");
  element.textContent = "";
}

function setLampOn() {
  welcomeLamp.classList.add("on");
  welcomeGlow.classList.add("on");
  gameLamp.classList.add("on");
  gameGlow.classList.add("on");
}

function setLampOff() {
  welcomeLamp.classList.remove("on");
  welcomeGlow.classList.remove("on");
  gameLamp.classList.remove("on");
  gameGlow.classList.remove("on");
}

function updateAttempts() {
  attemptsCount.textContent = state.attempts;
}

function renderRewards() {
  rewardsList.innerHTML = "";

  if (!state.rewards.length) {
    rewardsList.innerHTML = "<li>Пока наград нет</li>";
    return;
  }

  state.rewards.forEach((reward) => {
    const li = document.createElement("li");
    li.textContent = reward;
    rewardsList.appendChild(li);
  });
}

function resetRequired() {
  Object.keys(REQUIRED).forEach((key) => {
    REQUIRED[key] = false;
  });
}

function updateProgressDots() {
  dotZinc.classList.toggle("done", REQUIRED.zinc);
  dotCopper.classList.toggle("done", REQUIRED.copper);
  dotWireRed.classList.toggle("done", REQUIRED["wire-red"]);
  dotWireBlack.classList.toggle("done", REQUIRED["wire-black"]);
}

function clearWireLayer() {
  wireLayer.innerHTML = "";
}

function playgroundRect() {
  return playground.getBoundingClientRect();
}

function centerOf(el) {
  const pRect = playgroundRect();
  const rect = el.getBoundingClientRect();

  return {
    x: rect.left - pRect.left + rect.width / 2,
    y: rect.top - pRect.top + rect.height / 2,
  };
}

function drawWire(fromEl, toEl, color) {
  const from = centerOf(fromEl);
  const to = centerOf(toEl);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const c1x = from.x + 80;
  const c1y = from.y - 10;
  const c2x = to.x - 80;
  const c2y = to.y + 10;

  const d = `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;

  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "8");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.12))");

  wireLayer.appendChild(path);
}

function renderWiresIfNeeded() {
  clearWireLayer();

  if (REQUIRED["wire-red"]) {
    drawWire(targetCopper, lampRed, "#ef5b5b");
  }

  if (REQUIRED["wire-black"]) {
    drawWire(targetZinc, lampBlack, "#404040");
  }
}

function markTargetFilled(targetEl, filled) {
  targetEl.classList.toggle("filled", filled);
}

function isEverythingDone() {
  return Object.values(REQUIRED).every(Boolean);
}

function handleWin() {
  state.completed = true;
  saveState();
  setLampOn();
  showMessage(gameMessage, "success", "Ура! Лампочка загорелась!");

  setTimeout(() => {
    hideMessage(gameMessage);
    renderRewards();
    showScreen("success");
  }, 1200);
}

function tryWin() {
  updateProgressDots();
  renderWiresIfNeeded();

  if (isEverythingDone()) {
    handleWin();
  }
}

function getAcceptingTarget(part, x, y) {
  for (const target of targets) {
    const rect = target.el.getBoundingClientRect();
    const inside =
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom;

    if (inside && target.accept === part) {
      return target;
    }
  }

  return null;
}

function returnToOrigin(el) {
  const originParent = el.dataset.originParentId
    ? document.getElementById(el.dataset.originParentId)
    : null;

  if (originParent) {
    originParent.appendChild(el);
  }

  el.style.position = "relative";
  el.style.left = "";
  el.style.top = "";
  el.style.zIndex = "";
  el.style.width = "";
  el.classList.remove("dragging");
}

function placeOnTarget(el, targetEl) {
  const pRect = playgroundRect();
  const tRect = targetEl.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();

  if (el.parentElement !== playground) {
    playground.appendChild(el);
  }

  const left = tRect.left - pRect.left + (tRect.width - eRect.width) / 2;
  const top = tRect.top - pRect.top + (tRect.height - eRect.height) / 2;

  el.style.position = "absolute";
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.zIndex = "10";
  el.classList.remove("dragging");
  el.classList.add("placed");
  el.style.cursor = "default";
}

function wrongDrop() {
  state.attempts += 1;
  updateAttempts();
  saveState();
  showMessage(gameMessage, "error", "Попробуй в другое место");
}

function correctDrop(part, el, target) {
  placeOnTarget(el, target.el);
  markTargetFilled(target.el, true);

  REQUIRED[part] = true;
  hideMessage(gameMessage);

  tryWin();
}

function canPlacePart(part) {
  if (part === "wire-red" || part === "wire-black") {
    return REQUIRED.zinc && REQUIRED.copper;
  }
  return true;
}

function resetPartToTray(el) {
  const originParent = el.dataset.originParentId
    ? document.getElementById(el.dataset.originParentId)
    : null;

  if (originParent) {
    originParent.appendChild(el);
  }

  el.classList.remove("placed");
  el.classList.remove("dragging");
  el.style.position = "relative";
  el.style.left = "";
  el.style.top = "";
  el.style.zIndex = "";
  el.style.width = "";
  el.style.cursor = "grab";
}

function resetBoard() {
  state.completed = false;
  resetRequired();
  setLampOff();
  hideMessage(gameMessage);

  markTargetFilled(targetZinc, false);
  markTargetFilled(targetCopper, false);
  markTargetFilled(lampRed, false);
  markTargetFilled(lampBlack, false);

  draggables.forEach(({ el }) => {
    resetPartToTray(el);
  });

  clearWireLayer();
  updateProgressDots();
}

function fullReset() {
  localStorage.removeItem(STORAGE_KEY);

  state = {
    attempts: 0,
    completed: false,
    rewards: [],
    usedCodes: [],
  };

  updateAttempts();
  renderRewards();
  hideMessage(gameMessage);
  hideMessage(codeMessage);
  promoCodeInput.value = "";
  resetBoard();
  showScreen("welcome");
}

function applyCode() {
  hideMessage(codeMessage);

  const code = promoCodeInput.value.trim().toUpperCase();

  if (!code) {
    showMessage(codeMessage, "error", "Введи код");
    return;
  }

  if (state.usedCodes.includes(code)) {
    showMessage(codeMessage, "error", "Код уже использован");
    return;
  }

  const reward = PROMO_CODES[code];

  if (!reward) {
    showMessage(codeMessage, "error", "Такого кода нет");
    return;
  }

  state.usedCodes.push(code);
  state.rewards.push(reward.title);
  renderRewards();
  saveState();

  showMessage(codeMessage, "success", reward.text);
  promoCodeInput.value = "";
}

function makeDraggable(el, part) {
  const originParent = el.parentElement;
  if (originParent.id) {
    el.dataset.originParentId = originParent.id;
  }

  el.addEventListener("pointerdown", (event) => {
    if (el.classList.contains("placed")) return;

    if (!canPlacePart(part)) {
      showMessage(gameMessage, "error", "Сначала вставь две пластинки в лимон");
      return;
    }

    hideMessage(gameMessage);

    const rect = el.getBoundingClientRect();
    const pRect = playgroundRect();

    const width = rect.width;
    const height = rect.height;

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Переносим элемент в playground без скачка
    if (el.parentElement !== playground) {
      playground.appendChild(el);
    }

    el.style.position = "absolute";
    el.style.width = `${width}px`;
    el.style.left = `${rect.left - pRect.left}px`;
    el.style.top = `${rect.top - pRect.top}px`;
    el.style.zIndex = "20";
    el.classList.add("dragging");

    dragState = {
      el,
      part,
      offsetX,
      offsetY,
      pointerId: event.pointerId,
    };

    el.setPointerCapture(event.pointerId);
  });

  el.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.el !== el) return;

    const pRect = playgroundRect();

    const left = event.clientX - pRect.left - dragState.offsetX;
    const top = event.clientY - pRect.top - dragState.offsetY;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });

  el.addEventListener("pointerup", (event) => {
    if (!dragState || dragState.el !== el) return;

    const target = getAcceptingTarget(part, event.clientX, event.clientY);

    if (!target) {
      wrongDrop();
      returnToOrigin(el);
      dragState = null;
      return;
    }

    correctDrop(part, el, target);
    dragState = null;
  });

  el.addEventListener("pointercancel", () => {
    if (!dragState || dragState.el !== el) return;
    returnToOrigin(el);
    dragState = null;
  });
}

function initDrag() {
  draggables.forEach(({ el, part }, index) => {
    const partCard = el.closest(".part-card");
    if (partCard && !partCard.id) {
      partCard.id = `part-origin-${index}`;
      el.dataset.originParentId = partCard.id;
    }

    makeDraggable(el, part);
  });
}

function init() {
  loadState();
  updateAttempts();
  renderRewards();
  resetBoard();
  initDrag();

  if (state.completed) {
    setLampOn();
    showScreen("success");
  } else {
    showScreen("welcome");
  }

  startGameBtn.addEventListener("click", () => {
    resetBoard();
    showScreen("game");
  });

  playAgainBtn.addEventListener("click", () => {
    resetBoard();
    showScreen("game");
  });

  resetGameBtn.addEventListener("click", () => {
    resetBoard();
  });

  resetProgressBtn.addEventListener("click", fullReset);
  applyCodeBtn.addEventListener("click", applyCode);

  window.addEventListener("resize", () => {
    renderWiresIfNeeded();
  });
}

init();
