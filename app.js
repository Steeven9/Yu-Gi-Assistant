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
  card.querySelector(".half").disabled = defeated;

  if (delta) {
    lpEl.classList.remove("flash-down", "flash-up");
    void lpEl.offsetWidth; // restart the animation
    lpEl.classList.add(delta < 0 ? "flash-down" : "flash-up");
  }
}

$("reset").addEventListener("click", () => {
  if (!confirm(`Reset everyone to ${state.startLP} LP?`)) return;
  state.lp = Array(state.count).fill(state.startLP);
  save();
  renderDuel();
});

$("to-setup").addEventListener("click", () => {
  if (!confirm("Go back to setup? Starting a new duel will reset LP.")) return;
  state.screen = "setup";
  save();
  render();
});

render();
