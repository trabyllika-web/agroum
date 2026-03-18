const SCREENS = {
  welcome: document.getElementById("welcomeScreen"),
  game: document.getElementById("gameScreen"),
  success: document.getElementById("successScreen"),
};

const startGameBtn = document.getElementById("startGameBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const resetProgressBtn = document.getElementById("resetProgressBtn");
const applyCodeBtn = document.getElementById("applyCodeBtn");

const attemptsCount = document.getElementById("attemptsCount");
const gameMessage = document.getElementById("gameMessage");
const codeMessage = document.getElementById("codeMessage");
const promoCodeInput = document.getElementById("promoCodeInput");
const rewardsList = document.getElementById("rewardsList");

const heroLamp = document.getElementById("heroLamp");
const gameLamp = document.getElementById("gameLamp");
const welcomeGlow = document.getElementById("welcomeGlow");
const gameGlow = document.getElementById("gameGlow");

const dots = [
  document.getElementById("dot1"),
  document.getElementById("dot2"),
  document.getElementById("dot3"),
];

const stepButtons = document.querySelectorAll(".step-btn");

const STORAGE_KEY = "agroum_light_level_icons_v2";

const CORRECT_ORDER = ["plates", "wires", "led"];

const PROMO_CODES = {
  LIGHT: {
    title: "Искра света",
    text: "Ты получил награду: Искра света",
  },
  AGROUM: {
    title: "Знак учёного",
    text: "Ты получил награду: Знак учёного",
  },
  SUN: {
    title: "Солнечный бонус",
    text: "Ты получил награду: Солнечный бонус",
  },
};

let state = {
  currentStep: 0,
  attempts: 0,
  completed: false,
  rewards: [],
  usedCodes: [],
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state = {
      currentStep: 0,
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

function updateAttempts() {
  attemptsCount.textContent = state.attempts;
}

function updateDots() {
  dots.forEach((dot, index) => {
    dot.classList.toggle("done", index < state.currentStep);
  });
}

function updateButtons() {
  stepButtons.forEach((button) => {
    const buttonStep = button.dataset.step;
    const stepIndex = CORRECT_ORDER.indexOf(buttonStep);
    button.classList.toggle("done", stepIndex < state.currentStep);
  });
}

function setLampOn() {
  gameLamp.classList.add("on");
  gameGlow.classList.add("on");
  heroLamp.classList.add("on");
  welcomeGlow.classList.add("on");
}

function setLampOff() {
  gameLamp.classList.remove("on");
  gameGlow.classList.remove("on");
  heroLamp.classList.remove("on");
  welcomeGlow.classList.remove("on");
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

function resetGameOnly() {
  state.currentStep = 0;
  hideMessage(gameMessage);
  updateDots();
  updateButtons();
  setLampOff();
}

function fullReset() {
  localStorage.removeItem(STORAGE_KEY);

  state = {
    currentStep: 0,
    attempts: 0,
    completed: false,
    rewards: [],
    usedCodes: [],
  };

  updateAttempts();
  updateDots();
  updateButtons();
  renderRewards();
  setLampOff();
  hideMessage(gameMessage);
  hideMessage(codeMessage);
  promoCodeInput.value = "";
  showScreen("welcome");
}

function handleWrongStep() {
  state.attempts += 1;
  updateAttempts();
  saveState();

  showMessage(gameMessage, "error", "Ой! Давай ещё раз");
  setLampOff();

  setTimeout(() => {
    resetGameOnly();
  }, 900);
}

function handleCorrectStep(button) {
  button.classList.add("done");
  state.currentStep += 1;
  updateDots();
  updateButtons();

  if (state.currentStep === CORRECT_ORDER.length) {
    state.completed = true;
    setLampOn();
    saveState();

    showMessage(gameMessage, "success", "Ура! Лампочка горит!");

    setTimeout(() => {
      renderRewards();
      hideMessage(gameMessage);
      showScreen("success");
    }, 1100);
  }
}

function onStepClick(event) {
  const clickedStep = event.currentTarget.dataset.step;
  const expectedStep = CORRECT_ORDER[state.currentStep];

  if (clickedStep === expectedStep) {
    handleCorrectStep(event.currentTarget);
  } else {
    handleWrongStep();
  }
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

function init() {
  loadState();
  updateAttempts();
  updateDots();
  updateButtons();
  renderRewards();

  if (state.completed) {
    setLampOn();
    showScreen("success");
  } else {
    setLampOff();
    showScreen("welcome");
  }

  startGameBtn.addEventListener("click", () => {
    resetGameOnly();
    showScreen("game");
  });

  playAgainBtn.addEventListener("click", () => {
    resetGameOnly();
    showScreen("game");
  });

  resetProgressBtn.addEventListener("click", fullReset);
  applyCodeBtn.addEventListener("click", applyCode);

  stepButtons.forEach((button) => {
    button.addEventListener("click", onStepClick);
  });
}

init();
