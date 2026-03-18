const screen = document.getElementById("screen");

let level = 0;

const levels = [
  {
    title: "💡 Зажги свет",
    correct: ["🔩", "🔌", "💡"],
  },
  {
    title: "💧 Очисти воду",
    correct: ["🧻", "⚫", "🟡"],
  },
  {
    title: "🍄 Запусти гриб",
    correct: ["💧", "🍄"],
  },
  {
    title: "🧪 Сделай реакцию",
    correct: ["🧪", "🔥"],
  },
  {
    title: "🌋 Запусти вулкан",
    correct: ["🧂", "🧪", "🔥"],
  },
];

let progress = [];

function renderStart() {
  screen.innerHTML = `
    <div class="card">
      <h1>🌿 АгроУМ</h1>
      <p>Спаси мир с помощью науки</p>
      <button class="btn" onclick="startGame()">Играть</button>
    </div>
  `;
}

function startGame() {
  level = 0;
  renderLevel();
}

function renderLevel() {
  const lvl = levels[level];
  progress = [];

  const items = shuffle([...lvl.correct]);

  screen.innerHTML = `
    <div class="card">
      <h1>${lvl.title}</h1>

      <div class="items">
        ${items.map(i => `<div class="item" onclick="clickItem('${i}', this)">${i}</div>`).join("")}
      </div>

      <div class="progress" id="progress"></div>
    </div>
  `;
}

function clickItem(val, el) {
  const correct = levels[level].correct;

  if (val === correct[progress.length]) {
    progress.push(val);
    el.classList.add("done");

    if (progress.length === correct.length) {
      setTimeout(nextLevel, 700);
    }
  } else {
    alert("Попробуй ещё");
    renderLevel();
  }
}

function nextLevel() {
  level++;

  if (level >= levels.length) {
    renderFinal();
  } else {
    renderLevel();
  }
}

function renderFinal() {
  screen.innerHTML = `
    <div class="card">
      <h1>🎉 Ты спас мир!</h1>
      <p>Теперь приходи в АгроУМ за промокодом</p>
      <button class="btn" onclick="startGame()">Играть снова</button>
    </div>
  `;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

renderStart();
