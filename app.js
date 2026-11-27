"use strict";

const STORAGE_KEY = "yugi-lp-tracker";
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 10;
const DEFAULT_PLAYERS = 2;
const DEFAULT_LP = 8000;

const $ = (id) => document.getElementById(id);

function defaultState() {
  return {
    screen: "setup",
    count: DEFAULT_PLAYERS,
    startLP: DEFAULT_LP,
    // Kept at max length so names survive lowering and raising the player count.
    names: Array(MAX_PLAYERS).fill(""),
    lp: [],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      const state = { ...defaultState(), ...saved };
      if (state.screen === "duel" && state.lp.length !== state.count) {
        state.screen = "setup";
      }
      return state;
    }
  } catch {
    // Corrupted data: fall back to defaults.
  }
  return defaultState();
}

let state = loadState();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function displayName(i) {
  return state.names[i].trim() || `Player ${i + 1}`;
}

function render() {
  $("setup").hidden = state.screen !== "setup";
  $("duel").hidden = state.screen !== "duel";
  if (state.screen === "setup") renderSetup();
  else renderDuel();
}

/* ---------- Setup ---------- */

function renderSetup() {
  $("count").textContent = state.count;
  $("count-dec").disabled = state.count <= MIN_PLAYERS;
  $("count-inc").disabled = state.count >= MAX_PLAYERS;
  $("start-lp").value = state.startLP;

  const names = $("names");
  names.replaceChildren();
  for (let i = 0; i < state.count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 20;
    input.placeholder = `Player ${i + 1}`;
    input.value = state.names[i];
    input.setAttribute("aria-label", `Player ${i + 1} name`);
    input.addEventListener("input", () => {
      state.names[i] = input.value;
      save();
    });
    names.append(input);
  }
}

function changeCount(delta) {
  state.count = Math.min(
    MAX_PLAYERS,
    Math.max(MIN_PLAYERS, state.count + delta),
  );
  save();
  renderSetup();
}

$("count-dec").addEventListener("click", () => changeCount(-1));
$("count-inc").addEventListener("click", () => changeCount(1));

$("start-lp").addEventListener("input", (e) => {
  state.startLP = e.target.value;
  save();
});

$("setup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const lp = parseInt($("start-lp").value, 10);
  state.startLP = lp;
  state.lp = Array(state.count).fill(lp);
  state.screen = "duel";
  save();
  render();
});

/* ---------- Duel ---------- */

function renderDuel() {
  const list = $("players");
  const tpl = $("player-tpl");
  list.replaceChildren();

  for (let i = 0; i < state.count; i++) {
    const card = tpl.content.firstElementChild.cloneNode(true);
    card.querySelector(".name").textContent = displayName(i);

    const amount = card.querySelector(".amount");
    const apply = (sign) => {
      const value = parseInt(amount.value, 10);
      if (!(value > 0)) {
        amount.focus();
        return;
      }
      setLP(i, state.lp[i] + sign * value);
      amount.value = "";
    };

    card.querySelector(".minus").addEventListener("click", () => apply(-1));
    card.querySelector(".plus").addEventListener("click", () => apply(1));
    amount.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      apply(-1);
    });
    card.querySelectorAll("[data-amount]").forEach((btn) => {
      const value = Number(btn.dataset.amount);
      btn.addEventListener("click", () => setLP(i, state.lp[i] - value));
    });
    // Official rule: when halving LP, round up.
    card.querySelector(".half").addEventListener("click", () => {
      setLP(i, Math.ceil(state.lp[i] / 2));
    });

    list.append(card);
    updateCard(i);
  }
}

function setLP(i, value) {
  const prev = state.lp[i];
  state.lp[i] = Math.max(0, value);
  save();
  updateCard(i, state.lp[i] - prev);
}

function updateCard(i, delta = 0) {
  const card = $("players").children[i];
  const lpEl = card.querySelector(".lp");
  const defeated = state.lp[i] === 0;

  lpEl.textContent = state.lp[i];
  card.classList.toggle("defeated", defeated);
  card.querySelectorAll(".quick button").forEach((btn) => {
    btn.disabled = defeated;
  });

  if (delta) {
    lpEl.classList.remove("flash-down", "flash-up");
    void lpEl.offsetWidth; // restart the animation
    lpEl.classList.add(delta < 0 ? "flash-down" : "flash-up");
  }
}

/* ---------- Coin toss & die ---------- */

// Unbiased random integer in [0, n) for small n, via rejection sampling.
function randomInt(n) {
  const limit = 256 - (256 % n);
  const buf = new Uint8Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

$("coin").addEventListener("click", () => {
  const coin = $("coin");
  const heads = randomInt(2) === 0;

  coin.disabled = true;
  coin.textContent = "";
  coin.classList.remove("heads", "tails");
  $("coin-result").textContent = "Tossing…";
  coin.classList.add("flipping");

  coin.addEventListener(
    "animationend",
    () => {
      coin.classList.remove("flipping");
      coin.classList.add(heads ? "heads" : "tails");
      coin.textContent = heads ? "H" : "T";
      $("coin-result").textContent = heads ? "Heads!" : "Tails!";
      coin.disabled = false;
    },
    { once: true },
  );
});

// Pip positions on a 3x3 grid (0 = top-left, 8 = bottom-right).
const DIE_FACES = [
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
];

function showDieFace(value) {
  const pips = DIE_FACES[value - 1];
  const cells = Array.from({ length: 9 }, (_, i) => {
    const cell = document.createElement("span");
    if (pips.includes(i)) cell.className = "pip";
    return cell;
  });
  $("die").replaceChildren(...cells);
}

$("die").addEventListener("click", () => {
  const die = $("die");
  const value = randomInt(6) + 1;

  die.disabled = true;
  die.classList.add("rolled", "rolling");
  $("die-result").textContent = "Rolling…";
  // Flicker through faces while it tumbles.
  const flicker = setInterval(() => showDieFace(randomInt(6) + 1), 90);
  showDieFace(randomInt(6) + 1);

  die.addEventListener(
    "animationend",
    () => {
      clearInterval(flicker);
      die.classList.remove("rolling");
      showDieFace(value);
      $("die-result").textContent = `Rolled a ${value}!`;
      die.disabled = false;
    },
    { once: true },
  );
});

/* ---------- Confirm dialog ---------- */

function confirmDialog({ title, message, ok }) {
  const dialog = $("confirm");
  $("confirm-title").textContent = title;
  $("confirm-message").textContent = message;
  $("confirm-ok").textContent = ok;
  // Esc and backdrop clicks close without a value, which counts as cancel.
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "ok"),
      { once: true },
    );
  });
}

$("confirm").addEventListener("click", (e) => {
  // The form fills the dialog, so a click on the dialog itself is the backdrop.
  if (e.target === e.currentTarget) e.currentTarget.close();
});

$("reset").addEventListener("click", async () => {
  const confirmed = await confirmDialog({
    title: "Reset LP?",
    message: `Everyone goes back to ${state.startLP} LP.`,
    ok: "Reset",
  });
  if (!confirmed) return;
  state.lp = Array(state.count).fill(state.startLP);
  save();
  renderDuel();
});

$("to-setup").addEventListener("click", async () => {
  const confirmed = await confirmDialog({
    title: "Back to setup?",
    message: "Starting a new duel will reset LP.",
    ok: "Go to setup",
  });
  if (!confirmed) return;
  state.screen = "setup";
  save();
  render();
});

render();
