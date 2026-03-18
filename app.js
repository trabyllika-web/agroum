const SCREENS = {
  welcome: document.getElementById("welcomeScreen"),
  game: document.getElementById("gameScreen"),
  success: document.getElementById("successScreen"),
};

const startGameBtn = document.getElementById("startGameBtn");
const resetProgressBtn = document.getElementById("resetProgressBtn");
const checkOrderBtn = document.getElementById("checkOrderBtn");
const clearOrderBtn = document.getElementById("clearOrderBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const applyCodeBtn = document.getElementById("applyCodeBtn");

const attemptsCount = document.getElementById("attemptsCount");
const selectedStepsBox = document.getElementById("selectedSteps");
const gameMessage = document.getElementById("gameMessage");
const codeMessage = document.getElementById("codeMessage");
const promoCodeInput = document.getElementById("promoCodeInput");
const rewardsList = document.getElementById("rewardsList");

const stepButtons = document.querySelectorAll(".step-btn");

const STORAGE_KEY = "agroum_light_level_v1";

const STEP_LABELS = {
  plates: "Вставить пластины в лимон",
  wires: "Соединить провода",
  led: "Подключить светодиод",
};

const CORRECT_ORDER = ["plates", "wires", "led"];

const PROMO_CODES = {
  LIGHT: {
    title: "Искра нового мира",
    text: "Ты получил бонус: редкая искра света.",
  },
  AGROUM: {
    title: "Знак юного учёного",
    text: "Ты получил бонус: знак юного учёного АгроУМ.",
  },
  LEMON: {
    title: "Лимонная энергия",
    text: "Ты получил бонус: +1 энергия света.",
  },
};

let state = {
  attempts: 0,
  selectedSteps: [],
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
      attempts: parsed.attempts || 0,
      selectedSteps: [],
      completed: Boolean(parsed.completed),
      rewards: Array.isArray(parsed.rewards) ? parsed.rewards : [],
      usedCodes: Array.isArray(parsed.usedCodes) ? parsed.usedCodes : [],
    };
  } catch (error) {
    console.error("Ошибка чтения состояния:", error);
  }
}

function showScreen(screenName) {
  Object.values(SCREENS).forEach((screen) => screen.classList.remove("active"));
  SCREENS[screenName].classList.add("active");
}

function updateAttempts() {
  attemptsCount.textContent = state.attempts;
}

function updateSelectedSteps() {
  if (!state.selectedSteps.length) {
    selectedStepsBox.textContent = "Пока пусто";
    return;
  }

  const text = state.selectedSteps
    .map((step, index) => `${index + 1}. ${STEP_LABELS[step]}`)
    .join(" → ");

  selectedStepsBox.textContent = text;
}

function updateStepButtons() {
  stepButtons.forEach((button) => {
    const step = button.dataset.step;
    button.classList.toggle("selected", state.selectedSteps.includes(step));
  });
}

function showMessage(element, type, text) {
  element.classList.remove("hidden", "success", "error");
  element.classList.add(type);
  element.textContent = text;
}

function hideMessage(element) {
  element.classList.add("hidden");
  element.textContent = "";
  element.classList.remove("success", "error");
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

function resetGameBoard() {
  state.selectedSteps = [];
  updateSelectedSteps();
  updateStepButtons();
  hideMessage(gameMessage);
}

function fullReset() {
  localStorage.removeItem(STORAGE_KEY);
  state = {
    attempts: 0,
    selectedSteps: [],
    completed: false,
    rewards: [],
    usedCodes: [],
  };

  updateAttempts();
  updateSelectedSteps();
  updateStepButtons();
  renderRewards();
  hideMessage(gameMessage);
  hideMessage(codeMessage);
  promoCodeInput.value = "";
  showScreen("welcome");
}

function handleStepClick(event) {
  const step = event.currentTarget.dataset.step;

  if (state.selectedSteps.includes(step)) {
    state.selectedSteps = state.selectedSteps.filter((item) => item !== step);
  } else {
    if (state.selectedSteps.length >= 3) {
      showMessage(gameMessage, "error", "Ты уже выбрал все 3 шага. Нажми “Очистить” или “Проверить”.");
      return;
    }
    state.selectedSteps.push(step);
  }

  updateSelectedSteps();
  updateStepButtons();
}

function checkOrder() {
  hideMessage(gameMessage);

  if (state.selectedSteps.length !== 3) {
    showMessage(gameMessage, "error", "Нужно выбрать все 3 шага опыта.");
    return;
  }

  state.attempts += 1;
  updateAttempts();

  const isCorrect = CORRECT_ORDER.every((step, index) => state.selectedSteps[index] === step);

  if (isCorrect) {
    state.completed = true;
    saveState();
    renderRewards();
    showScreen("success");
    return;
  }

  showMessage(
    gameMessage,
    "error",
    "Пока не получилось. Подумай: сначала вставляют пластины, потом соединяют провода, и только потом подключают светодиод."
  );

  saveState();
}

function applyCode() {
  hideMessage(codeMessage);

  const code = promoCodeInput.value.trim().toUpperCase();

  if (!code) {
    showMessage(codeMessage, "error", "Введи код.");
    return;
  }

  if (state.usedCodes.includes(code)) {
    showMessage(codeMessage, "error", "Этот код уже использован.");
    return;
  }

  const reward = PROMO_CODES[code];

  if (!reward) {
    showMessage(codeMessage, "error", "Такого кода пока нет. Проверь, правильно ли он введён.");
    return;
  }

  state.usedCodes.push(code);
  state.rewards.push(reward.title);
  saveState();
  renderRewards();

  showMessage(codeMessage, "success", reward.text);
  promoCodeInput.value = "";
}

function init() {
  loadState();
  updateAttempts();
  updateSelectedSteps();
  updateStepButtons();
  renderRewards();

  if (state.completed) {
    showScreen("success");
  } else {
    showScreen("welcome");
  }

  stepButtons.forEach((button) => {
    button.addEventListener("click", handleStepClick);
  });

  startGameBtn.addEventListener("click", () => {
    resetGameBoard();
    showScreen("game");
  });

  clearOrderBtn.addEventListener("click", resetGameBoard);
  checkOrderBtn.addEventListener("click", checkOrder);

  playAgainBtn.addEventListener("click", () => {
    resetGameBoard();
    showScreen("game");
  });

  applyCodeBtn.addEventListener("click", applyCode);
  resetProgressBtn.addEventListener("click", fullReset);
}

init();
