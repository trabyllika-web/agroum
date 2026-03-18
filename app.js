const appScreen = document.getElementById("appScreen");
const resetAllBtn = document.getElementById("resetAllBtn");

const STORAGE_KEY = "agroum_3_levels_v1";

const state = {
  currentLevel: 0,
  completedLevels: [],
  attempts: {
    1: 0,
    2: 0,
    3: 0,
  },
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.currentLevel = parsed.currentLevel || 0;
    state.completedLevels = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];
    state.attempts = parsed.attempts || { 1: 0, 2: 0, 3: 0 };
  } catch (e) {
    console.error("Ошибка загрузки состояния:", e);
  }
}

function resetState() {
  state.currentLevel = 0;
  state.completedLevels = [];
  state.attempts = { 1: 0, 2: 0, 3: 0 };
  localStorage.removeItem(STORAGE_KEY);
}

function levelPills(active) {
  const items = [
    { n: 1, title: "Свет" },
    { n: 2, title: "Вода" },
    { n: 3, title: "Гриб" },
  ];

  return `
    <div class="level-nav">
      ${items.map(item => {
        const classes = [
          "level-pill",
          active === item.n ? "active" : "",
          state.completedLevels.includes(item.n) ? "done" : "",
        ].join(" ").trim();

        return `<div class="${classes}">${item.n}. ${item.title}</div>`;
      }).join("")}
    </div>
  `;
}

function showStart() {
  appScreen.innerHTML = `
    <section class="card center-card">
      <div class="start-box">
        <div class="brand-badge" style="display:inline-block">АгроУМ</div>
        <h1 class="big-title">Мини-игра<br>для детей</h1>
        <p class="lead">
          Пройди 3 коротких уровня и помоги миру
          вернуть свет, воду и движение.
        </p>

        <div class="level-badges">
          <div class="badge">💡 Свет</div>
          <div class="badge">💧 Вода</div>
          <div class="badge">🍄 Гриб</div>
        </div>

        <p class="small-note">
          В конце тебя ждёт подсказка:
          где получить промокод в АгроУМ.
        </p>

        <div class="actions">
          <button id="startBtn" class="primary-btn big-btn" type="button">Играть</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("startBtn").addEventListener("click", () => {
    state.currentLevel = 1;
    saveState();
    showLevel1();
  });
}

/* ---------- shared drag helpers ---------- */
function getRect(el) {
  return el.getBoundingClientRect();
}

function pointInsideRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function makeDraggable({
  el,
  part,
  playground,
  canDrag = () => true,
  onDenied = () => {},
  getTarget,
  onWrongDrop,
  onCorrectDrop,
}) {
  let dragState = null;

  if (!el.dataset.originParentId) {
    const parent = el.parentElement;
    if (parent && !parent.id) {
      parent.id = `origin-${Math.random().toString(36).slice(2, 9)}`;
    }
    if (parent) {
      el.dataset.originParentId = parent.id;
    }
  }

  el.addEventListener("pointerdown", (event) => {
    if (el.classList.contains("placed")) return;

    if (!canDrag(part)) {
      onDenied(part);
      return;
    }

    const rect = getRect(el);
    const pRect = getRect(playground);
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    if (el.parentElement !== playground) {
      playground.appendChild(el);
    }

    el.style.position = "absolute";
    el.style.width = `${rect.width}px`;
    el.style.left = `${rect.left - pRect.left}px`;
    el.style.top = `${rect.top - pRect.top}px`;
    el.style.zIndex = "20";
    el.classList.add("dragging");

    dragState = { offsetX, offsetY };
    el.setPointerCapture(event.pointerId);
  });

  el.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    const pRect = getRect(playground);

    el.style.left = `${event.clientX - pRect.left - dragState.offsetX}px`;
    el.style.top = `${event.clientY - pRect.top - dragState.offsetY}px`;
  });

  el.addEventListener("pointerup", (event) => {
    if (!dragState) return;

    const target = getTarget(part, event.clientX, event.clientY);

    if (!target) {
      onWrongDrop(el, part);
      dragState = null;
      return;
    }

    onCorrectDrop(el, part, target);
    dragState = null;
  });

  el.addEventListener("pointercancel", () => {
    if (!dragState) return;
    onWrongDrop(el, part);
    dragState = null;
  });
}

function returnToOrigin(el) {
  const originId = el.dataset.originParentId;
  const originParent = originId ? document.getElementById(originId) : null;

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

function placeOnTarget(el, playground, targetEl) {
  const pRect = getRect(playground);
  const tRect = getRect(targetEl);
  const eRect = getRect(el);

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

/* ---------- level 1 ---------- */
function showLevel1() {
  appScreen.innerHTML = `
    <section class="card game-card">
      <div class="game-head">
        <div>
          <div class="brand-badge" style="display:inline-block;padding:8px 14px;font-size:13px;box-shadow:none;">Уровень 1</div>
          <h2>Лимонный свет</h2>
        </div>
        <div class="counter-box">Ошибки: <span id="attemptCount1">${state.attempts[1]}</span></div>
      </div>

      ${levelPills(1)}

      <div id="message1" class="message-box hidden"></div>

      <div class="game-layout">
        <div id="playground1" class="playground">
          <svg id="wireLayer1" class="wire-layer"></svg>
          <div class="table-shadow"></div>

          <div class="lemon-scene">
            <div class="lemon-body"></div>
            <div class="lemon-shine"></div>
            <div class="lemon-mark mark-zinc">Zn</div>
            <div class="lemon-mark mark-copper">Cu</div>

            <div id="target-zinc" class="drop-slot plate-slot zinc-slot">Zn</div>
            <div id="target-copper" class="drop-slot plate-slot copper-slot">Cu</div>
          </div>

          <div class="lamp-scene">
            <div id="lampLight1" class="lamp-light"></div>
            <div id="lampBulb1" class="lamp-bulb">💡</div>
            <div class="lamp-base"></div>

            <div id="lamp-red" class="drop-slot wire-slot lamp-red-slot">+</div>
            <div id="lamp-black" class="drop-slot wire-slot lamp-black-slot">−</div>
          </div>
        </div>

        <div class="parts-panel">
          <h3>Детали</h3>
          <p class="parts-text">Перетащи всё на правильные места</p>

          <div class="parts-list">
            <div class="part-card">
              <div id="part-zinc" class="draggable plate zinc">Zn</div>
              <div class="part-label">Цинк</div>
            </div>

            <div class="part-card">
              <div id="part-copper" class="draggable plate copper">Cu</div>
              <div class="part-label">Медь</div>
            </div>

            <div class="part-card">
              <div id="part-wire-red" class="draggable wire wire-red">
                <span class="wire-dot red"></span>
                <span>Красный</span>
              </div>
              <div class="part-label">Провод</div>
            </div>

            <div class="part-card">
              <div id="part-wire-black" class="draggable wire wire-black">
                <span class="wire-dot black"></span>
                <span>Чёрный</span>
              </div>
              <div class="part-label">Провод</div>
            </div>
          </div>

          <div class="progress-box">
            <div class="progress-title">Готово</div>
            <div class="progress-dots">
              <div id="dot-zinc" class="progress-dot"></div>
              <div id="dot-copper" class="progress-dot"></div>
              <div id="dot-wire-red" class="progress-dot"></div>
              <div id="dot-wire-black" class="progress-dot"></div>
            </div>
          </div>

          <div class="actions" style="justify-content:flex-start;margin-top:16px;">
            <button id="restartLevel1" class="secondary-btn" type="button">Начать заново</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const message = document.getElementById("message1");
  const attemptCount = document.getElementById("attemptCount1");
  const playground = document.getElementById("playground1");
  const wireLayer = document.getElementById("wireLayer1");

  const partZinc = document.getElementById("part-zinc");
  const partCopper = document.getElementById("part-copper");
  const partWireRed = document.getElementById("part-wire-red");
  const partWireBlack = document.getElementById("part-wire-black");

  const targetZinc = document.getElementById("target-zinc");
  const targetCopper = document.getElementById("target-copper");
  const lampRed = document.getElementById("lamp-red");
  const lampBlack = document.getElementById("lamp-black");

  const lampLight = document.getElementById("lampLight1");
  const lampBulb = document.getElementById("lampBulb1");

  const dots = {
    zinc: document.getElementById("dot-zinc"),
    copper: document.getElementById("dot-copper"),
    "wire-red": document.getElementById("dot-wire-red"),
    "wire-black": document.getElementById("dot-wire-black"),
  };

  const placed = {
    zinc: false,
    copper: false,
    "wire-red": false,
    "wire-black": false,
  };

  function showMsg(type, text) {
    message.classList.remove("hidden", "success", "error");
    message.classList.add(type);
    message.textContent = text;
  }

  function hideMsg() {
    message.classList.add("hidden");
    message.classList.remove("success", "error");
    message.textContent = "";
  }

  function bumpWrong(text) {
    state.attempts[1] += 1;
    attemptCount.textContent = state.attempts[1];
    saveState();
    showMsg("error", text);
  }

  function updateDots() {
    Object.keys(dots).forEach(key => {
      dots[key].classList.toggle("done", placed[key]);
    });
  }

  function centerOf(el) {
    const pRect = getRect(playground);
    const rect = getRect(el);
    return {
      x: rect.left - pRect.left + rect.width / 2,
      y: rect.top - pRect.top + rect.height / 2,
    };
  }

  function drawWire(fromEl, toEl, color) {
    const from = centerOf(fromEl);
    const to = centerOf(toEl);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${from.x} ${from.y} C ${from.x + 80} ${from.y - 10}, ${to.x - 80} ${to.y + 10}, ${to.x} ${to.y}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "8");
    path.setAttribute("stroke-linecap", "round");
    wireLayer.appendChild(path);
  }

  function renderWires() {
    wireLayer.innerHTML = "";
    if (placed["wire-red"]) drawWire(targetCopper, lampRed, "#ef5b5b");
    if (placed["wire-black"]) drawWire(targetZinc, lampBlack, "#404040");
  }

  function getTarget(part, x, y) {
    const arr = [
      { part: "zinc", el: targetZinc },
      { part: "copper", el: targetCopper },
      { part: "wire-red", el: lampRed },
      { part: "wire-black", el: lampBlack },
    ];

    for (const item of arr) {
      if (item.part !== part) continue;
      if (pointInsideRect(x, y, getRect(item.el))) return item.el;
    }
    return null;
  }

  function canDrag(part) {
    if (part === "wire-red" || part === "wire-black") {
      return placed.zinc && placed.copper;
    }
    return true;
  }

  function completeCheck() {
    updateDots();
    renderWires();

    if (Object.values(placed).every(Boolean)) {
      lampLight.classList.add("on");
      lampBulb.classList.add("on");
      hideMsg();

      if (!state.completedLevels.includes(1)) {
        state.completedLevels.push(1);
      }
      saveState();

      showMsg("success", "Ура! Лампочка загорелась!");

      setTimeout(() => {
        state.currentLevel = 2;
        saveState();
        showLevel2();
      }, 1100);
    }
  }

  function restart() {
    hideMsg();
    wireLayer.innerHTML = "";
    lampLight.classList.remove("on");
    lampBulb.classList.remove("on");

    Object.keys(placed).forEach(key => placed[key] = false);

    [partZinc, partCopper, partWireRed, partWireBlack].forEach(el => {
      el.classList.remove("placed", "dragging");
      returnToOrigin(el);
    });

    [targetZinc, targetCopper, lampRed, lampBlack].forEach(t => t.classList.remove("filled"));
    updateDots();
  }

  makeDraggable({
    el: partZinc,
    part: "zinc",
    playground,
    getTarget,
    canDrag,
    onDenied: () => showMsg("error", "Сначала вставь пластинки"),
    onWrongDrop: (el) => { bumpWrong("Попробуй в другое место"); returnToOrigin(el); },
    onCorrectDrop: (el, part, target) => {
      hideMsg();
      placeOnTarget(el, playground, target);
      target.classList.add("filled");
      placed[part] = true;
      completeCheck();
    }
  });

  makeDraggable({
    el: partCopper,
    part: "copper",
    playground,
    getTarget,
    canDrag,
    onDenied: () => showMsg("error", "Сначала вставь пластинки"),
    onWrongDrop: (el) => { bumpWrong("Попробуй в другое место"); returnToOrigin(el); },
    onCorrectDrop: (el, part, target) => {
      hideMsg();
      placeOnTarget(el, playground, target);
      target.classList.add("filled");
      placed[part] = true;
      completeCheck();
    }
  });

  makeDraggable({
    el: partWireRed,
    part: "wire-red",
    playground,
    getTarget,
    canDrag,
    onDenied: () => showMsg("error", "Сначала вставь две пластинки в лимон"),
    onWrongDrop: (el) => { bumpWrong("Попробуй в другое место"); returnToOrigin(el); },
    onCorrectDrop: (el, part, target) => {
      hideMsg();
      placeOnTarget(el, playground, target);
      target.classList.add("filled");
      placed[part] = true;
      completeCheck();
    }
  });

  makeDraggable({
    el: partWireBlack,
    part: "wire-black",
    playground,
    getTarget,
    canDrag,
    onDenied: () => showMsg("error", "Сначала вставь две пластинки в лимон"),
    onWrongDrop: (el) => { bumpWrong("Попробуй в другое место"); returnToOrigin(el); },
    onCorrectDrop: (el, part, target) => {
      hideMsg();
      placeOnTarget(el, playground, target);
      target.classList.add("filled");
      placed[part] = true;
      completeCheck();
    }
  });

  document.getElementById("restartLevel1").addEventListener("click", restart);
}

/* ---------- level 2 ---------- */
function showLevel2() {
  appScreen.innerHTML = `
    <section class="card game-card">
      <div class="game-head">
        <div>
          <div class="brand-badge" style="display:inline-block;padding:8px 14px;font-size:13px;box-shadow:none;">Уровень 2</div>
          <h2>Чистая вода</h2>
        </div>
        <div class="counter-box">Ошибки: <span id="attemptCount2">${state.attempts[2]}</span></div>
      </div>

      ${levelPills(2)}

      <div id="message2" class="message-box hidden"></div>

      <div class="game-layout">
        <div id="playground2" class="playground">
          <div class="filter-scene">
            <div class="filter-neck"></div>
            <div class="filter-bottle">
              <div id="slot-top" class="filter-slot slot-top">1</div>
              <div id="slot-middle" class="filter-slot slot-middle">2</div>
              <div id="slot-bottom" class="filter-slot slot-bottom">3</div>
              <div id="cleanWater" class="clean-water"></div>
            </div>
          </div>

          <div class="drop-water"></div>
        </div>

        <div class="parts-panel">
          <h3>Слои фильтра</h3>
          <p class="parts-text">Собери фильтр правильно</p>

          <div class="parts-list">
            <div class="part-card">
              <div id="part-cotton" class="draggable layer-card layer-cotton">Вата</div>
              <div class="part-label">Мягкий слой</div>
            </div>

            <div class="part-card">
              <div id="part-charcoal" class="draggable layer-card layer-charcoal">Уголь</div>
              <div class="part-label">Тёмный слой</div>
            </div>

            <div class="part-card">
              <div id="part-sand" class="draggable layer-card layer-sand">Песок</div>
              <div class="part-label">Песочный слой</div>
            </div>
          </div>

          <div class="progress-box">
            <div class="progress-title">Готово</div>
            <div class="progress-dots">
              <div id="dot-cotton" class="progress-dot"></div>
              <div id="dot-charcoal" class="progress-dot"></div>
              <div id="dot-sand" class="progress-dot"></div>
            </div>
          </div>

          <div class="actions" style="justify-content:flex-start;margin-top:16px;">
            <button id="restartLevel2" class="secondary-btn" type="button">Начать заново</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const message = document.getElementById("message2");
  const attemptCount = document.getElementById("attemptCount2");
  const playground = document.getElementById("playground2");
  const cleanWater = document.getElementById("cleanWater");

  const partCotton = document.getElementById("part-cotton");
  const partCharcoal = document.getElementById("part-charcoal");
  const partSand = document.getElementById("part-sand");

  const slotTop = document.getElementById("slot-top");
  const slotMiddle = document.getElementById("slot-middle");
  const slotBottom = document.getElementById("slot-bottom");

  const dots = {
    cotton: document.getElementById("dot-cotton"),
    charcoal: document.getElementById("dot-charcoal"),
    sand: document.getElementById("dot-sand"),
  };

  const placed = {
    cotton: false,
    charcoal: false,
    sand: false,
  };

  function showMsg(type, text) {
    message.classList.remove("hidden", "success", "error");
    message.classList.add(type);
    message.textContent = text;
  }

  function hideMsg() {
    message.classList.add("hidden");
    message.classList.remove("success", "error");
    message.textContent = "";
  }

  function bumpWrong(text) {
    state.attempts[2] += 1;
    attemptCount.textContent = state.attempts[2];
    saveState();
    showMsg("error", text);
  }

  function updateDots() {
    Object.keys(dots).forEach(key => {
      dots[key].classList.toggle("done", placed[key]);
    });
  }

  function getTarget(part, x, y) {
    const arr = [
      { part: "cotton", el: slotTop },
      { part: "charcoal", el: slotMiddle },
      { part: "sand", el: slotBottom },
    ];

    for (const item of arr) {
      if (item.part !== part) continue;
      if (pointInsideRect(x, y, getRect(item.el))) return item.el;
    }
    return null;
  }

  function completeCheck() {
    updateDots();
    if (Object.values(placed).every(Boolean)) {
      cleanWater.classList.add("on");

      if (!state.completedLevels.includes(2)) {
        state.completedLevels.push(2);
      }
      saveState();

      showMsg("success", "Ура! Вода стала чище!");

      setTimeout(() => {
        state.currentLevel = 3;
        saveState();
        showLevel3();
      }, 1100);
    }
  }

  function restart() {
    hideMsg();
    cleanWater.classList.remove("on");
    Object.keys(placed).forEach(key => placed[key] = false);

    [partCotton, partCharcoal, partSand].forEach(el => {
      el.classList.remove("placed", "dragging");
      returnToOrigin(el);
    });

    [slotTop, slotMiddle, slotBottom].forEach(slot => slot.classList.remove("filled"));
    updateDots();
  }

  [
    { el: partCotton, part: "cotton" },
    { el: partCharcoal, part: "charcoal" },
    { el: partSand, part: "sand" },
  ].forEach(({ el, part }) => {
    makeDraggable({
      el,
      part,
      playground,
      getTarget,
      onDenied: () => {},
      onWrongDrop: (element) => { bumpWrong("Нужен другой слой"); returnToOrigin(element); },
      onCorrectDrop: (element, p, target) => {
        hideMsg();
        placeOnTarget(element, playground, target);
        target.classList.add("filled");
        placed[p] = true;
        completeCheck();
      }
    });
  });

  document.getElementById("restartLevel2").addEventListener("click", restart);
}

/* ---------- level 3 ---------- */
function showLevel3() {
  appScreen.innerHTML = `
    <section class="card game-card">
      <div class="game-head">
        <div>
          <div class="brand-badge" style="display:inline-block;padding:8px 14px;font-size:13px;box-shadow:none;">Уровень 3</div>
          <h2>Гриб-реактивный двигатель</h2>
        </div>
        <div class="counter-box">Ошибки: <span id="attemptCount3">${state.attempts[3]}</span></div>
      </div>

      ${levelPills(3)}

      <div id="message3" class="message-box hidden"></div>

      <div class="game-layout">
        <div id="playground3" class="playground">
          <div class="water-scene">
            <div class="pond"></div>
            <div class="ring r1"></div>
            <div class="ring r2"></div>
            <div class="ring r3"></div>

            <div id="mushroom" class="mushroom">🍄</div>
            <div id="soapTarget" class="soap-target">кап</div>
          </div>
        </div>

        <div class="parts-panel">
          <h3>Пуск</h3>
          <p class="parts-text">Перетащи каплю к грибу</p>

          <div class="parts-list">
            <div class="part-card">
              <div id="soapDrop" class="draggable soap-drop">мыло</div>
              <div class="part-label">Капля</div>
            </div>
          </div>

          <div class="progress-box">
            <div class="progress-title">Готово</div>
            <div class="progress-dots">
              <div id="dot-move" class="progress-dot"></div>
            </div>
          </div>

          <div class="actions" style="justify-content:flex-start;margin-top:16px;">
            <button id="restartLevel3" class="secondary-btn" type="button">Начать заново</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const message = document.getElementById("message3");
  const attemptCount = document.getElementById("attemptCount3");
  const playground = document.getElementById("playground3");
  const mushroom = document.getElementById("mushroom");
  const soapDrop = document.getElementById("soapDrop");
  const soapTarget = document.getElementById("soapTarget");
  const dotMove = document.getElementById("dot-move");

  let done = false;

  function showMsg(type, text) {
    message.classList.remove("hidden", "success", "error");
    message.classList.add(type);
    message.textContent = text;
  }

  function hideMsg() {
    message.classList.add("hidden");
    message.classList.remove("success", "error");
    message.textContent = "";
  }

  function bumpWrong(text) {
    state.attempts[3] += 1;
    attemptCount.textContent = state.attempts[3];
    saveState();
    showMsg("error", text);
  }

  function getTarget(part, x, y) {
    if (part !== "soap") return null;
    return pointInsideRect(x, y, getRect(soapTarget)) ? soapTarget : null;
  }

  function restart() {
    done = false;
    hideMsg();
    dotMove.classList.remove("done");
    mushroom.classList.remove("move");
    soapDrop.classList.remove("placed", "dragging");
    returnToOrigin(soapDrop);
  }

  makeDraggable({
    el: soapDrop,
    part: "soap",
    playground,
    getTarget,
    onWrongDrop: (el) => {
      bumpWrong("Капни рядом с грибом");
      returnToOrigin(el);
    },
    onCorrectDrop: (el, part, target) => {
      hideMsg();
      placeOnTarget(el, playground, target);
      el.style.opacity = "0.7";
      mushroom.classList.add("move");
      dotMove.classList.add("done");
      done = true;

      if (!state.completedLevels.includes(3)) {
        state.completedLevels.push(3);
      }
      saveState();

      showMsg("success", "Ура! Гриб поплыл!");

      setTimeout(() => {
        showFinal();
      }, 1200);
    }
  });

  document.getElementById("restartLevel3").addEventListener("click", restart);
}

/* ---------- final ---------- */
function showFinal() {
  state.currentLevel = 4;
  saveState();

  appScreen.innerHTML = `
    <section class="card center-card">
      <div class="final-box">
        <div class="brand-badge" style="display:inline-block">АгроУМ</div>
        <h1 class="big-title">Ты прошёл 3 уровня!</h1>

        <div class="final-glow"></div>

        <p class="lead">
          Ты помог вернуть свет, очистить воду и запустить гриб по воде.
        </p>

        <p class="small-note" style="margin-top:16px;">
          Дальше — <strong>промокод в АгроУМ</strong><br>
          Приходи в лабораторию и получи его на занятии или мастер-классе.
        </p>

        <div class="final-code">ПРОМОКОД ЖДЁТ В АГРОУМ</div>

        <div class="actions">
          <button id="playAgainBtn" class="secondary-btn big-btn" type="button">Играть снова</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetState();
    showStart();
  });
}

/* ---------- app init ---------- */
resetAllBtn.addEventListener("click", () => {
  resetState();
  showStart();
});

function init() {
  loadState();

  if (state.currentLevel === 1) {
    showLevel1();
  } else if (state.currentLevel === 2) {
    showLevel2();
  } else if (state.currentLevel === 3) {
    showLevel3();
  } else if (state.currentLevel >= 4) {
    showFinal();
  } else {
    showStart();
  }
}

init();
