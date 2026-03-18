.step-btn {
  font-size: 48px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-btn.done {
  background: #ffe9b0;
  transform: scale(1.1);
}
const SCREENS = {
  welcome: document.getElementById("welcomeScreen"),
  game: document.getElementById("gameScreen"),
  success: document.getElementById("successScreen"),
};

const startGameBtn = document.getElementById("startGameBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const icons = document.querySelectorAll(".step-btn");
const lamp = document.getElementById("heroLamp");
const gameMessage = document.getElementById("gameMessage");

// правильный порядок
const CORRECT_ORDER = ["plates", "wires", "led"];

let currentStep = 0;

function showScreen(name) {
  Object.values(SCREENS).forEach(s => s.classList.remove("active"));
  SCREENS[name].classList.add("active");
}

function resetGame() {
  currentStep = 0;
  lamp.style.opacity = 0.4;

  icons.forEach(icon => {
    icon.classList.remove("done");
  });

  gameMessage.textContent = "";
}

// клик по иконке
icons.forEach(icon => {
  icon.addEventListener("click", () => {
    const step = icon.dataset.step;

    // если правильно
    if (step === CORRECT_ORDER[currentStep]) {
      icon.classList.add("done");
      currentStep++;

      // если дошли до конца
      if (currentStep === CORRECT_ORDER.length) {
        lamp.style.opacity = 1;
        lamp.style.transform = "scale(1.2)";
        gameMessage.textContent = "💡 Свет появился!";
        
        setTimeout(() => {
          showScreen("success");
        }, 1000);
      }

    } else {
      // ошибка
      gameMessage.textContent = "Ой! Попробуй ещё раз";
      resetGame();
    }
  });
});

startGameBtn.addEventListener("click", () => {
  resetGame();
  showScreen("game");
});

playAgainBtn.addEventListener("click", () => {
  resetGame();
  showScreen("game");
});
