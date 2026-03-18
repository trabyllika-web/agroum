const appScreen = document.getElementById("appScreen");
const resetAllBtn = document.getElementById("resetAllBtn");

const STORAGE_KEY = "agroum_story_3_levels_v2";

const state = {
  currentScreen: "intro",
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
    state.currentScreen = parsed.currentScreen || "intro";
    state.currentLevel = parsed.currentLevel || 0;
    state.completedLevels = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];
    state.attempts = parsed.attempts || { 1: 0, 2: 0, 3: 0 };
  } catch (e) {
    console.error("Ошибка загрузки состояния:", e);
  }
}

function resetState() {
  state.currentScreen = "intro";
  state.currentLevel = 0;
  state.completedLevels = [];
  state.attempts = { 1: 0, 2: 0, 3: 0 };
  localStorage.removeItem(STORAGE_KEY);
}

function showStoryIntro() {
  state.currentScreen = "intro";
  saveState();

  appScreen.innerHTML = `
    <section class="card center-card">
      <div class="story-box">
        <div class="brand-badge" style="display:inline-block">АгроУМ</div>
        <h1 class="big-title">Мир уснул... </h1>

        <div class="story-hero">
          <span>🌍</span>
        </div>

        <p class="lead">
          Мир уснул на тысячи лет.<br>
          Но ваша лаборатория проснулась!
        </p>

        <p class="small-note">
          Сегодня мы вместе вернём<br>
          <strong>свет</strong>, <strong>воду</strong> и <strong>жизнь</strong>.
        </p>

        <div class="level-badges">
          <div class="badge">💡 Свет</div>
          <div class="badge">💧 Вода</div>
          <div class="badge">🌋 Жизнь</div>
        </div>

        <div class="actions">
          <button id="toRulesBtn" class="primary-btn big-btn" type="button">Дальше</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("toRulesBtn").addEventListener("click", showRules);
}

function showRules() {
  state.currentScreen = "rules";
  saveState();

  appScreen.innerHTML = `
    <section class="card center-card">
      <div class="story-box">
        <div class="brand-badge" style="display:inline-block">Правила учёных</div>
        <h1 class="big-title">Работаем аккуратно</h1>

        <div class="rules-row">
          <div class="rule-chip">✋ Только по команде</div>
          <div class="rule-chip">👀 Трогаем нужное</div>
          <div class="rule-chip">🤝 Если незнаешь - попроси помочь родителей!</div>
        </div>

        <p class="lead">
          Готов?<br>
          Тогда начинаем возвращать мир к жизни.
        </p>

        <div class="actions">
          <button id="startAdventureBtn" class="primary-btn big-btn" type="button">Начать</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById("startAdventureBtn").addEventListener("click", () => {
    state.currentLevel = 1;
    state.currentScreen = "level1";
    saveState();
    showLevel1();
  });
}

function levelPills(active) {
  const items = [
    { n: 1, title: "Свет" },
    { n: 2, title: "Вода" },
    { n: 3, title: "Жизнь" },
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

function guideBox(icon, text) {
  return `
    <div class="guide-box">
      <div class="guide-icon">${icon}</div>
      <div class="guide-text">${text}</div>
    </div>
  `;
}

function getRect(el) {
  return el.getBoundingClientRect();
}

function pointInsideRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
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

function clearHighlights(elements) {
  elements.forEach(el => el && el.classList.remove("highlight-target", "highlight-part"));
}

/* ---------- LEVEL 1 ---------- */
function showLevel1() {
  state.currentScreen = "level1";
  state.currentLevel = 1;
  saveState();

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

      ${guideBox("👉", "Сначала вставь две пластинки в лимон")}

      <div id="message1" class="message-box hidden"></div>

      <div class="game-layout">
        <div id="playground1" class="playground">
          <svg id="wireLayer1" class="wire-layer"></svg>
          <div class="table-shadow"></div>

          <div class="lemon-scene">
            <div class="lemon-body"></div>
            <div class="lemon-shine"></div>

            <div id="target-zinc" class="drop-slot plate-slot zinc-slot highlight-target">Zn</div>
            <div id="target-copper" class="drop-slot plate-slot copper-slot highlight-target">Cu</div>
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
          <p class="parts-text">Перетащи детали на правильные места</p>

          <div class="parts-list">
            <div class="part-card">
              <div id="part-zinc" class="draggable plate zinc highlight-part">Zn</div>
              <div class="part-label">Цинк</div>
            </div>

            <div class="part-card">
              <div id="part-copper" class="draggable plate copper highlight-part">Cu</div>
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
            <button id="restartLevel1" class="secondary-btn" type="button">Заново</button>
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

  function setGuideStep(step) {
    clearHighlights([partZinc, partCopper, partWireRed, partWireBlack, targetZinc, targetCopper, lampRed, lampBlack]);

    if (step === 1) {
      partZinc.classList.add("highlight-part");
      partCopper.classList.add("highlight-part");
      targetZinc.classList.add("highlight-target");
      targetCopper.classList.add("highlight-target");
    } else if (step === 2) {
      partWireRed.classList.add("highlight-part");
      partWireBlack.classList.add("highlight-part");
      lampRed.classList.add("highlight-target");
      lampBlack.classList.add("highlight-target");
    }
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

    if (placed.zinc && placed.copper && (!placed["wire-red"] || !placed["wire-black"])) {
      setGuideStep(2);
      showMsg("success", "Теперь подсоедини два провода");
    }

    if (Object.values(placed).every(Boolean)) {
      lampLight.classList.add("on");
      lampBulb.classList.add("on");
      clearHighlights([partZinc, partCopper, partWireRed, partWireBlack, targetZinc, targetCopper, lampRed, lampBlack]);

      if (!state.completedLevels.includes(1)) {
        state.completedLevels.push(1);
      }
      saveState();

      showMsg("success", "Ура! Свет вернулся!");

      setTimeout(() => {
        state.currentLevel = 2;
        state.currentScreen = "level2";
        saveState();
        showLevel2();
      }, 1300);
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
    setGuideStep(1);
  }

  makeDraggable({
    el: partZinc,
    part: "zinc",
    playground,
    getTarget,
    canDrag,
    onDenied: () => showMsg("error", "Сейчас нужны пластинки"),
    onWrongDrop: (el) => { bumpWrong("Положи пластинку в лимон"); returnToOrigin(el); },
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
    onDenied: () => showMsg("error", "Сейчас нужны пластинки"),
    onWrongDrop: (el) => { bumpWrong("Положи пластинку в лимон"); returnToOrigin(el); },
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
    onDenied: () => showMsg("error", "Сначала вставь две пластинки"),
    onWrongDrop: (el) => { bumpWrong("Красный провод — к лампочке"); returnToOrigin(el); },
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
    onDenied: () => showMsg("error", "Сначала вставь две пластинки"),
    onWrongDrop: (el) => { bumpWrong("Чёрный провод — к лампочке"); returnToOrigin(el); },
    onCorrectDrop: (el, part, target) => {
      hideMsg();
      placeOnTarget(el, playground, target);
      target.classList.add("filled");
      placed[part] = true;
      completeCheck();
    }
  });

  document.getElementById("restartLevel1").addEventListener("click", restart);

  setGuideStep(1);
}

/* ---------- LEVEL 2 ---------- */
function showLevel2() {
  state.currentScreen = "level2";
  state.currentLevel = 2;
  saveState();

  appScreen.innerHTML = `
    <section class="card game-card">
      <div class="game-head">
        <div>
          <div class="brand-badge" style="display:inline-block;padding:8px 14px;font-size:13px;box-shadow:none;">Уровень 2</div>
          <h2>Фильтр чистой воды</h2>
        </div>
        <div class="counter-box">Ошибки: <span id="attemptCount2">${state.attempts[2]}</span></div>
      </div>

      ${levelPills(2)}

      ${guideBox("💧", "Собери слои: вата, уголь, песок")}

      <div id="message2" class="message-box hidden"></div>

      <div class="game-layout">
        <div id="playground2" class="playground">
          <div class="filter-scene">
            <div class="filter-neck"></div>
            <div class="filter-bottle">
              <div id="slot-top" class="filter-slot slot-top highlight-target">1</div>
              <div id="slot-middle" class="filter-slot slot-middle">2</div>
              <div id="slot-bottom" class="filter-slot slot-bottom">3</div>
              <div id="cleanWater" class="clean-water"></div>
            </div>
          </div>

          <div class="dirty-water"></div>
        </div>

        <div class="parts-panel">
          <h3>Слои фильтра</h3>
          <p class="parts-text">Перетащи слои в правильном порядке</p>

          <div class="parts-list">
            <div class="part-card">
              <div id="part-cotton" class="draggable layer-card layer-cotton highlight-part">Вата</div>
              <div class="part-label">1 слой</div>
            </div>

            <div class="part-card">
              <div id="part-charcoal" class="draggable layer-card layer-charcoal">Уголь</div>
              <div class="part-label">2 слой</div>
            </div>

            <div class="part-card">
              <div id="part-sand" class="draggable layer-card layer-sand">Песок</div>
              <div class="part-label">3 слой</div>
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
            <button id="restartLevel2" class="secondary-btn" type="button">Заново</button>
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

  function setGuideStep(step) {
    clearHighlights([partCotton, partCharcoal, partSand, slotTop, slotMiddle, slotBottom]);

    if (step === 1) {
      partCotton.classList.add("highlight-part");
      slotTop.classList.add("highlight-target");
    } else if (step === 2) {
      partCharcoal.classList.add("highlight-part");
      slotMiddle.classList.add("highlight-target");
    } else if (step === 3) {
      partSand.classList.add("highlight-part");
      slotBottom.classList.add("highlight-target");
    }
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

    if (placed.cotton && !placed.charcoal) {
      setGuideStep(2);
      showMsg("success", "Теперь положи уголь");
    }

    if (placed.cotton && placed.charcoal && !placed.sand) {
      setGuideStep(3);
      showMsg("success", "Теперь добавь песок");
    }

    if (Object.values(placed).every(Boolean)) {
      cleanWater.classList.add("on");
      clearHighlights([partCotton, partCharcoal, partSand, slotTop, slotMiddle, slotBottom]);

      if (!state.completedLevels.includes(2)) {
        state.completedLevels.push(2);
      }
      saveState();

      showMsg("success", "Ура! Вода стала чище!");

      setTimeout(() => {
        state.currentLevel = 3;
        state.currentScreen = "level3";
        saveState();
        showLevel3();
      }, 1300);
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
    setGuideStep(1);
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
      onWrongDrop: (element) => { bumpWrong("Положи слой в нужное место"); returnToOrigin(element); },
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

  setGuideStep(1);
}

/* ---------- LEVEL 3 ---------- */
function showLevel3() {
  state.currentScreen = "level3";
  state.currentLevel = 3;
  saveState();

  appScreen.innerHTML = `
    <section class="card game-card">
      <div class="game-head">
        <div>
          <div class="brand-badge" style="display:inline-block;padding:8px 14px;font-size:13px;box-shadow:none;">Уровень 3</div>
          <h2>Вулкан жизни</h2>
        </div>
        <div class="counter-box">Ошибки: <span id="attemptCount3">${state.attempts[3]}</span></div>
      </div>

      ${levelPills(3)}

      ${guideBox("🌋", "По очереди: мыло, дрожжи, перекись")}

      <div id="message3" class="message-box hidden"></div>

      <div class="game-layout">
        <div id="playground3" class="playground">
          <div class="volcano-scene">
            <div class="volcano-mountain"></div>
            <div class="volcano-hole"></div>

            <div id="v-slot-1" class="v-slot v-slot-1 highlight-target">🫧</div>
            <div id="v-slot-2" class="v-slot v-slot-2">🍞</div>
            <div id="v-slot-3" class="v-slot v-slot-3">💧</div>

            <div id="volcanoFoam" class="volcano-foam">
              <div class="foam-bubble fb1"></div>
              <div class="foam-bubble fb2"></div>
              <div class="foam-bubble fb3"></div>
              <div class="foam-bubble fb4"></div>
              <div class="foam-bubble fb5"></div>
            </div>
          </div>
        </div>

        <div class="parts-panel">
          <h3>Ингредиенты</h3>
          <p class="parts-text">Добавляй по одному, как показывает подсказка</p>

          <div class="parts-list">
            <div class="part-card">
              <div id="part-soap" class="draggable v-item v-soap highlight-part">🫧</div>
              <div class="part-label">Мыло</div>
            </div>

            <div class="part-card">
              <div id="part-yeast" class="draggable v-item v-yeast">🍞</div>
              <div class="part-label">Дрожжи</div>
            </div>

            <div class="part-card">
              <div id="part-peroxide" class="draggable v-item v-peroxide">💧</div>
              <div class="part-label">Перекись</div>
            </div>
          </div>

          <div class="progress-box">
            <div class="progress-title">Готово</div>
            <div class="progress-dots">
              <div id="dot-soap" class="progress-dot"></div>
              <div id="dot-yeast" class="progress-dot"></div>
              <div id="dot-peroxide" class="progress-dot"></div>
            </div>
          </div>

          <div class="actions" style="justify-content:flex-start;margin-top:16px;">
            <button id="restartLevel3" class="secondary-btn" type="button">Заново</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const message = document.getElementById("message3");
  const attemptCount = document.getElementById("attemptCount3");
  const playground = document.getElementById("playground3");

  const partSoap = document.getElementById("part-soap");
  const partYeast = document.getElementById("part-yeast");
  const partPeroxide = document.getElementById("part-peroxide");

  const slot1 = document.getElementById("v-slot-1");
  const slot2 = document.getElementById("v-slot-2");
  const slot3 = document.getElementById("v-slot-3");
  const foam = document.getElementById("volcanoFoam");

  const dots = {
    soap: document.getElementById("dot-soap"),
    yeast: document.getElementById("dot-yeast"),
    peroxide: document.getElementById("dot-peroxide"),
  };

  const placed = {
    soap: false,
    yeast: false,
    peroxide: false,
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

  function setGuideStep(step) {
    clearHighlights([partSoap, partYeast, partPeroxide, slot1, slot2, slot3]);

    if (step === 1) {
      partSoap.classList.add("highlight-part");
      slot1.classList.add("highlight-target");
    } else if (step === 2) {
      partYeast.classList.add("highlight-part");
      slot2.classList.add("highlight-target");
    } else if (step === 3) {
      partPeroxide.classList.add("highlight-part");
      slot3.classList.add("highlight-target");
    }
  }

  function bumpWrong(text) {
    state.attempts[3] += 1;
    attemptCount.textContent = state.attempts[3];
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
      { part: "soap", el: slot1 },
      { part: "yeast", el: slot2 },
      { part: "peroxide", el: slot3 },
    ];

    for (const item of arr) {
      if (item.part !== part) continue;
      if (pointInsideRect(x, y, getRect(item.el))) return item.el;
    }
    return null;
  }

  function canDrag(part) {
    if (part === "yeast") return placed.soap;
    if (part === "peroxide") return placed.soap && placed.yeast;
    return true;
  }

  function completeCheck() {
    updateDots();

    if (placed.soap && !placed.yeast) {
      setGuideStep(2);
      showMsg("success", "Теперь добавь дрожжи");
    }

    if (placed.soap && placed.yeast && !placed.peroxide) {
      setGuideStep(3);
      showMsg("success", "Теперь вливай перекись");
    }

    if (Object.values(placed).every(Boolean)) {
      foam.classList.add("on");
      clearHighlights([partSoap, partYeast, partPeroxide, slot1, slot2, slot3]);

      if (!state.completedLevels.includes(3)) {
        state.completedLevels.push(3);
      }
      saveState();

      showMsg("success", "Ура! Жизнь вспыхнула!");

      setTimeout(() => {
        showFinal();
      }, 1400);
    }
  }

  function restart() {
    hideMsg();
    foam.classList.remove("on");
    Object.keys(placed).forEach(key => placed[key] = false);

    [partSoap, partYeast, partPeroxide].forEach(el => {
      el.classList.remove("placed", "dragging");
      returnToOrigin(el);
    });

    [slot1, slot2, slot3].forEach(slot => slot.classList.remove("filled"));
    updateDots();
    setGuideStep(1);
  }

  [
    { el: partSoap, part: "soap" },
    { el: partYeast, part: "yeast" },
    { el: partPeroxide, part: "peroxide" },
  ].forEach(({ el, part }) => {
    makeDraggable({
      el,
      part,
      playground,
      canDrag,
      onDenied: (p) => {
        if (p === "yeast") showMsg("error", "Сначала добавь мыло");
        if (p === "peroxide") showMsg("error", "Сначала мыло и дрожжи");
      },
      getTarget,
      onWrongDrop: (element) => {
        bumpWrong("Положи ингредиент в нужное место");
        returnToOrigin(element);
      },
      onCorrectDrop: (element, p, target) => {
        hideMsg();
        placeOnTarget(element, playground, target);
        target.classList.add("filled");
        placed[p] = true;
        completeCheck();
      }
    });
  });

  document.getElementById("restartLevel3").addEventListener("click", restart);

  setGuideStep(1);
}

/* ---------- FINAL ---------- */
function showFinal() {
  state.currentScreen = "final";
  state.currentLevel = 4;
  saveState();

  appScreen.innerHTML = `
    <section class="card center-card">
      <div class="final-box">
        <div class="brand-badge" style="display:inline-block">АгроУМ</div>
        <h1 class="big-title">Ты помог миру ожить!</h1>

        <div class="final-glow"></div>

        <p class="lead">
          Ты вернул свет, очистил воду и запустил жизнь.
        </p>

        <p class="final-story">
          Дальше — получи промокод в лаборатории,<br>
          чтобы помочь цивилизации возродиться дальше.
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
    showStoryIntro();
  });
}

/* ---------- INIT ---------- */
resetAllBtn.addEventListener("click", () => {
  resetState();
  showStoryIntro();
});

function init() {
  loadState();

  if (state.currentScreen === "rules") {
    showRules();
  } else if (state.currentScreen === "level1") {
    showLevel1();
  } else if (state.currentScreen === "level2") {
    showLevel2();
  } else if (state.currentScreen === "level3") {
    showLevel3();
  } else if (state.currentScreen === "final") {
    showFinal();
  } else {
    showStoryIntro();
  }
}

init();
