import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase, ref, set, get, push, query, orderByChild, startAt, onChildAdded
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

/* ============================================================
   MEME RNG
   1. Config & data      4. Rolling          7. Auth & account
   2. State & helpers    5. Inventory        8. Admin & broadcasts
   3. Audio & UI         6. Placed memes     9. Panels & boot
   ============================================================ */

/* ============================================================
   1. CONFIG & DATA
   ============================================================ */

// Firebase web config (public by design — security comes from your database rules).
const firebaseConfig = {
  apiKey: "AIzaSyB4dgpFEh29DVgfcSd_nEtEmPz8GQPlE0c",
  authDomain: "meme-rng.firebaseapp.com",
  databaseURL: "https://meme-rng-default-rtdb.firebaseio.com",
  projectId: "meme-rng",
  appId: "1:643327088409:web:b624be7e4c674ca711d788"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const COOLDOWN_MS = 4000;
const REVEAL_CHARGE_MS = 2400; // Secret reveal: energy builds before the burst
const REVEAL_HOLD_MS = 6500;   // Secret reveal: card stays up before auto-close
const STAR_SKIP_MS = 600;      // click-to-skip unlocks after this long
const UPGRADE_REFRESH_MS = 1000;
const ROLL_STEPS = 18;         // how many frames the roll animation shows
const MAX_LUCK = 20;
const LUCK_PER_LEVEL = 0.1;    // +10% weight on lucky rarities per level
const MAX_INVENTORY = 500;

// Upgrade tuning
const MIN_COOLDOWN_MS = 1500;
const COOLDOWN_STEP_MS = 300;      // faster cooldown: -300ms per level
const MAX_COOLDOWN_LEVEL = 8;
const DOUBLE_PER_LEVEL = 0.05;     // +5% chance of a double drop per level
const MAX_DOUBLE_LEVEL = 15;
const MAGNET_PER_LEVEL = 0.1;      // +10% weight on Mythic per level
const MAX_MAGNET_LEVEL = 10;
const BACKPACK_SLOTS = 25;
const RADAR_PER_LEVEL = 0.1;       // +10% weight on Rare per level
const MAX_RADAR_LEVEL = 10;
const SEEKER_PER_LEVEL = 0.25;     // +25% weight on Secret per level (stacks with Luck)
const MAX_SEEKER_LEVEL = 8;
const OVERCLOCK_STEP_MS = 150;     // shaves the cooldown below the normal floor
const OVERCLOCK_FLOOR_MS = 900;
const MAX_OVERCLOCK_LEVEL = 4;
const PITY_BASE = 30;              // guaranteed Rare+ every N rolls...
const PITY_STEP = 4;               // ...minus this per level
const MAX_PITY_LEVEL = 5;
const JACKPOT_PER_LEVEL = 0.02;    // chance of a triple drop
const MAX_JACKPOT_LEVEL = 10;
const FREE_PER_LEVEL = 0.03;       // chance a roll costs no cooldown
const MAX_FREE_LEVEL = 10;
const MEME_SIZE = 100;         // px, placed memes

const SOUND_BASE = "./"; // mp3 files ship next to index.html

const ADMIN_EMAILS = [
  "r2ftzu1ha2vy@gmail.com",
  "muhamad_afif_rayyan_danial@students.edu.sg",
];

// NOTE: codes and the admin list are checked in the browser only.
// Enforce them in your Firebase rules / a Cloud Function before relying on them.
const REDEEM_CODES = {
  RELEASE: { meme: "Gigachad", amount: 1 },
  BETA: { meme: "Derpy Squarepants", amount: 1 },
};

const RARITY_COLORS = {
  Common: "#aaa", Uncommon: "#4dff88", Rare: "#4da6ff", Epic: "#ffae00",
  Mythic: "#ff757c", Legendary: "#ff004c", Secret: "#5c5c5c",
};
const LUCKY_RARITIES = ["Epic", "Legendary", "Secret"];

const meme = (name, chance, rarity, img, soundFile) => ({
  name, chance, rarity, img,
  color: RARITY_COLORS[rarity],
  sound: SOUND_BASE + encodeURIComponent(soundFile),
});

const memes = [
  meme("Bruh", 50, "Common", "https://iili.io/fpYGZZB.jpg", "fredchaferfrommedia-bruh-1-120133.mp3"),
  meme("Bing Chilling", 50, "Common", "https://iili.io/qHCIC0B.png", "bing-chilling_fcdGgUc.mp3"),
  meme("Sheesh", 25, "Uncommon", "https://iili.io/fpYGg4e.jpg", "original-sheesh-[AudioTrimmer.com].mp3"),
  meme("Pepe", 25, "Uncommon", "https://iili.io/fpaN8cN.jpg", "el-pepe_hGUhiaM.mp3"),
  meme("Sus", 12.5, "Rare", "https://iili.io/fpYGUG9.webp", "53b1bab6-a8c3-4a1a-82db-7110ce1c29ef_6KNDGWD.mp3"),
  meme("Gigachad", 12.5, "Epic", "https://iili.io/fpYG6Yb.webp", "gigachad-theme-music-[AudioTrimmer.com].mp3"),
  meme("Stick Bug", 12.5, "Epic", "https://iili.io/fykVLkG.webp", "bugged-[AudioTrimmer.com].mp3"),
  meme("Derpy Squarepants", 5, "Mythic", "https://iili.io/fy9OkJt.webp", "spongebob-boowomp.mp3"),
  meme("Bad Apple", 5, "Mythic", "https://iili.io/fyX9qkx.jpg", "bad-apple-[AudioTrimmer.com].mp3"),
  meme("9 + 10", 5, "Mythic", "https://iili.io/q9lnZbt.webp", "9-10-vine-rnm2az4_F0Tn5hMt.mp3"),
  meme("OHIO FINAL BOSS", 2.5, "Legendary", "https://iili.io/fpYGLTQ.jpg", "ohio-final-boss-theme-made-with-Voicemod-[AudioTrimmer.com].mp3"),
  meme("Keyboard cat", 2.5, "Legendary", "https://iili.io/fyjDgrg.jpg", "keyboardcat-[AudioTrimmer.com].mp3"),
  meme("Golden Dandelion", 2.5, "Legendary", "https://iili.io/qHnWJQR.jpg", "golden-dandelion.mp3"),
  meme("Raah Skeleton", 0.5, "Secret", "https://iili.io/fpaNSSI.gif", "rahh-skeletons-[AudioTrimmer.com].mp3"),
  meme("Do you know da wae", 0.5, "Secret", "https://iili.io/fy9WysS.gif", "do-you-know-the-way-[AudioTrimmer.com].mp3"),
  meme("RickRoll", 0.5, "Secret", "https://iili.io/fywJtAg.gif", "epic-[AudioTrimmer.com].mp3"),
  meme("Oie oie eye eye", 0.5, "Secret", "https://iili.io/q24wsRa.gif", "oi-oi-oe-oi-a-eye-eye-[AudioTrimmer.com].mp3"),
];

const findMeme = name => memes.find(m => m.name === name);

/* ============================================================
   2. STATE & HELPERS
   ============================================================ */

// Factories (not shared objects) so a reset or new login can never inherit old nested data.
const newStats = () => ({ totalRolls: 0, memes: {}, rarities: {} });
const newUpgrades = () => ({
  luck: 0, quickRollUnlocked: false, inventoryLimit: 50,
  cooldown: 0, doubleDrop: 0, magnet: 0, autoRollUnlocked: false,
  radar: 0, seeker: 0, overclock: 0, pity: 0, pityCount: 0, jackpot: 0, freeRoll: 0,
});
const newSettings = () => ({ stopLegendary: true }); // auto roll always stops on Secret

const state = {
  uid: null,
  username: null,
  email: null,
  isAdmin: false,
  inventory: {},
  placed: [],
  stats: newStats(),
  upgrades: newUpgrades(),
  usedCodes: {},
  settings: newSettings(),
  autoDiscard: {},    // { [rarity]: true } rolled memes of these rarities are deleted instantly
  seenMessageTs: 0,   // cursors so each broadcast is applied exactly once
  seenMemeTs: 0,
};

let cooling = false;      // roll cooldown running
let revealing = false;    // Secret star animation running
let quickRoll = false;
let autoRoll = false;
let animating = false;    // roll animation running
let selectedMeme = null;
let previewImg = null;
let pointer = { x: 0, y: 0 };
let unsubscribeMessages = null;
let unsubscribeMemes = null;

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// SVG icons live in a sprite in index.html
const icon = (name, cls = "") => `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const withIcon = (name, text, cls) => `${icon(name, cls)} ${esc(text)}`;
const setStatus = (el, kind, text) =>
  el.innerHTML = withIcon({ ok: "check", err: "x", warn: "warn" }[kind], text, kind);

const countOf = name => state.inventory[name] || 0;
const inventoryCount = () => Object.values(state.inventory).reduce((sum, n) => sum + (Number(n) || 0), 0);
const addMeme = (name, n = 1) => { state.inventory[name] = countOf(name) + n; };
const removeMeme = (name, n = 1) => {
  const left = countOf(name) - n;
  if (left > 0) state.inventory[name] = left; else delete state.inventory[name];
};
const luckyOwned = () => memes
  .filter(m => LUCKY_RARITIES.includes(m.rarity))
  .reduce((sum, m) => sum + countOf(m.name), 0);

// DOM
const rngButton = $("rngButton");
const quickRollBtn = $("quickRollBtn");
const autoRollBtn = $("autoRollBtn");
const memeImg = $("memeImg");
const resultEl = $("result");
const rarityLabel = $("rarityLabel");
const cooldownFill = $("cooldownFill");
const inventoryEl = $("inventory");
const flashEl = $("flash");
const authForm = $("authForm");
const userInfo = $("userInfo");

// Debounced cloud save: rapid actions (dragging, deleting, redeeming) collapse into one write.
let saveTimer = null;
function saveUserData() {
  if (!state.uid) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!state.uid) return; // signed out while a save was pending
    set(ref(db, "users/" + state.uid), {
      username: state.username,
      inventory: state.inventory,
      placedMemes: state.placed,
      stats: state.stats,
      upgrades: state.upgrades,
      usedCodes: state.usedCodes,
      autoDiscard: state.autoDiscard,
      settings: state.settings,
      lastSeenMessageTs: state.seenMessageTs,
      lastSeenMemeTs: state.seenMemeTs,
    }).catch(err => console.error("Failed to save user data:", err));
  }, 300);
}

/* ============================================================
   3. AUDIO & UI FEEDBACK
   ============================================================ */

const rollLoop = new Audio(SOUND_BASE + "matthewvakaliuk73627-mouse-click-290204-%5BAudioTrimmer.com%5D.mp3");
rollLoop.loop = true;
rollLoop.volume = 0.6;

const rollEnd = new Audio(SOUND_BASE + "floraphonic-tada-military-1-183974.mp3");
rollEnd.volume = 0.7;

function playSound(audio) {
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {}); // autoplay can be blocked until the first interaction
}

const audioCache = new Map();
function audioFor(m) {
  let a = audioCache.get(m.sound);
  if (!a) { a = new Audio(m.sound); a.preload = "auto"; a.volume = 0.9; audioCache.set(m.sound, a); }
  return a;
}
function playMemeSound(m) {
  if (m?.sound) playSound(audioFor(m));
}
// Warm the cache on first interaction so reveals don't stall on a download.
document.addEventListener("pointerdown", () => memes.forEach(audioFor), { once: true });

function screenFlash() {
  flashEl.classList.add("flash");
  setTimeout(() => flashEl.classList.remove("flash"), 300);
}

// Small pill that slides in at the top, then out. `html` must already be escaped.
function showFloatingText(html, color = "#fff") {
  const el = document.createElement("div");
  el.className = "float-text";
  el.style.color = color;
  el.innerHTML = html;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.top = "50px";
    el.style.opacity = "1";
  });
  setTimeout(() => {
    el.style.top = "0px";
    el.style.opacity = "0";
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  }, 1000);
}

function showGlobalMessage(text) {
  const container = $("globalMessageContainer");
  const msg = document.createElement("div");
  msg.className = "global-message";
  msg.innerHTML = withIcon("globe", text);
  container.appendChild(msg);

  setTimeout(() => {
    msg.classList.add("fade-out");
    msg.addEventListener("animationend", () => msg.remove(), { once: true });
  }, 5000);
}

/* ============================================================
   4. ROLLING
   ============================================================ */

const pityEvery = () => PITY_BASE - state.upgrades.pity * PITY_STEP;

function oddsBoost(m) {
  const u = state.upgrades;
  let b = 1;
  if (LUCKY_RARITIES.includes(m.rarity)) b *= 1 + u.luck * LUCK_PER_LEVEL;
  if (m.rarity === "Mythic") b *= 1 + u.magnet * MAGNET_PER_LEVEL;
  if (m.rarity === "Rare") b *= 1 + u.radar * RADAR_PER_LEVEL;
  if (m.rarity === "Secret") b *= 1 + u.seeker * SEEKER_PER_LEVEL;
  return b;
}

function pickMeme() {
  const u = state.upgrades;
  // Pity timer: after enough misses, only Rare and above can drop.
  const pity = u.pity > 0 && u.pityCount >= pityEvery() - 1;
  const pool = pity ? memes.filter(m => rarityRank(m) >= RARITY_ORDER.indexOf("Rare")) : memes;
  const weights = pool.map(m => m.chance * oddsBoost(m));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function displayMeme(m) {
  memeImg.src = m.img;
  resultEl.textContent = m.name;
  resultEl.style.color = m.color;
  rarityLabel.textContent = m.rarity;
}

const isLocked = () => cooling || revealing || animating;
const cooldownFor = (cd, oc) =>
  Math.max(OVERCLOCK_FLOOR_MS, Math.max(MIN_COOLDOWN_MS, COOLDOWN_MS - cd * COOLDOWN_STEP_MS) - oc * OVERCLOCK_STEP_MS);
const cooldownMs = () => cooldownFor(state.upgrades.cooldown, state.upgrades.overclock);
const syncRollButton = () => rngButton.classList.toggle("disabled", isLocked());

function startCooldown() {
  // Free Roll: this roll costs no cooldown.
  if (Math.random() < state.upgrades.freeRoll * FREE_PER_LEVEL) {
    cooling = false;
    cooldownFill.style.transition = "none";
    cooldownFill.style.width = "0%";
    showFloatingText(withIcon("bolt", "Free roll!"), "#4da6ff");
    return;
  }
  const ms = cooldownMs();
  cooling = true;
  syncRollButton();

  cooldownFill.style.transition = "none";
  cooldownFill.style.width = "100%";
  void cooldownFill.offsetWidth; // flush styles so the transition below starts from 100%
  cooldownFill.style.transition = `width ${ms}ms linear`;
  cooldownFill.style.width = "0%";

  setTimeout(() => { cooling = false; syncRollButton(); }, ms);
}

function runRollAnimation(finalMeme) {
  // The animation scales with the cooldown so a faster cooldown never overlaps a running roll.
  const scale = Math.max(0.3, cooldownMs() / COOLDOWN_MS);
  let delay = 50 * scale;       // start fast…
  const maxDelay = 380 * scale; // …and ease out slowly
  let step = 0;
  animating = true;

  (function tick() {
    displayMeme(memes[Math.floor(Math.random() * memes.length)]);
    rollLoop.playbackRate = 1.4 - (step / ROLL_STEPS) * 0.7; // pitch drops as it slows

    if (++step < ROLL_STEPS) {
      delay += (maxDelay - delay) / (ROLL_STEPS - step);
      setTimeout(tick, delay);
    } else {
      finishRoll(finalMeme);
    }
  })();
}

function finishRoll(m) {
  const { stats } = state;
  const isNew = !isDiscovered(m.name);
  animating = false;
  stats.totalRolls++;
  stats.memes[m.name] = (stats.memes[m.name] || 0) + 1;
  stats.rarities[m.rarity] = (stats.rarities[m.rarity] || 0) + 1;
  state.upgrades.pityCount = rarityRank(m) >= RARITY_ORDER.indexOf("Rare") ? 0 : (state.upgrades.pityCount || 0) + 1;

  rollLoop.pause();
  rollLoop.currentTime = 0;
  rollLoop.playbackRate = 1.4;
  playSound(rollEnd);

  const discard = !!state.autoDiscard[m.rarity];
  const space = state.upgrades.inventoryLimit - inventoryCount();
  if (discard) {
    // Still counts as a roll (stats), but never touches the inventory.
    showFloatingText(withIcon("trash", `Auto-discarded ${m.name}`), "#8d93a8");
  } else if (space <= 0) {
    showFloatingText(withIcon("box", "Inventory full — meme discarded!"), "#ff757c");
    if (autoRoll) setAutoRoll(false, "Auto Roll stopped: inventory full");
  } else {
    const { doubleDrop, jackpot } = state.upgrades;
    const wanted = Math.random() < jackpot * JACKPOT_PER_LEVEL ? 3
      : Math.random() < doubleDrop * DOUBLE_PER_LEVEL ? 2 : 1;
    const gained = Math.min(wanted, space);
    addMeme(m.name, gained);
    renderInventory();
    if (gained >= 2) showFloatingText(withIcon("dice", `${wanted === 3 ? "JACKPOT" : "Double drop"}: ${m.name} x${gained}!`), m.color);
  }

  // Secret always stops auto roll; Legendary only if the checkbox is on. Never for discarded rarities.
  const stops = m.rarity === "Secret" || (m.rarity === "Legendary" && state.settings.stopLegendary);
  if (autoRoll && !discard && stops) {
    setAutoRoll(false, `Auto Roll stopped: ${m.rarity}!`);
  }

  if (["Epic", "Legendary"].includes(m.rarity)) screenFlash();

  if (m.rarity === "Secret") {
    playStarReveal(m);
  } else {
    displayMeme(m);
    playMemeSound(m);
  }

  if (isNew) showFloatingText(withIcon("check", `New discovery: ${m.name}!`), "#4dff88");
  renderStats();
  renderUpgrades();
  renderCollection();
  saveUserData();
}

/* ---------- Secret reveal: effects ---------- */

const fx = { canvas: $("starFx"), ctx: null, parts: [], raf: 0, mode: "", last: 0, w: 0, h: 0, chargeAt: 0, chargeMs: 1 };
const FX_COLORS = ["#ff004c", "#ffae00", "#4dff88", "#4da6ff", "#b84dff", "#ffffff"];
const fxColor = () => FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)];

function fxResize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  fx.w = window.innerWidth; fx.h = window.innerHeight;
  fx.canvas.width = fx.w * dpr; fx.canvas.height = fx.h * dpr;
  fx.ctx = fx.canvas.getContext("2d");
  fx.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function fxLoop(t) {
  const { ctx } = fx;
  const dt = Math.min(2.5, (t - fx.last) / 16.67 || 1);
  fx.last = t;
  const cx = fx.w / 2, cy = fx.h / 2;
  ctx.clearRect(0, 0, fx.w, fx.h);

  if (fx.mode === "charge") {
    const p = Math.min(1, (t - fx.chargeAt) / fx.chargeMs);
    $("starOverlay").style.setProperty("--k", (1 + p * 5).toFixed(2)); // shake grows with charge
    const n = Math.floor((1 + p * 5) * dt + Math.random());
    for (let i = 0; i < n; i++) {
      fx.parts.push({
        kind: "in", ang: Math.random() * Math.PI * 2,
        r: Math.max(fx.w, fx.h) * (0.55 + Math.random() * 0.35),
        v: 6 + Math.random() * 6, len: 16 + Math.random() * 40, w: 1 + Math.random() * 1.6, color: fxColor(),
      });
    }
  } else if (fx.mode === "show" && Math.random() < 0.3 * dt) {
    fx.parts.push({
      kind: "spark", x: Math.random() * fx.w, y: fx.h + 10, vx: (Math.random() - 0.5) * 0.6,
      vy: -(0.8 + Math.random() * 1.8), g: 0, life: 1, decay: 0.004 + Math.random() * 0.004,
      size: 1 + Math.random() * 2.2, color: fxColor(),
    });
  }

  ctx.globalCompositeOperation = "lighter";
  for (const q of fx.parts) {
    if (q.kind === "in") {
      q.v *= 1 + 0.045 * dt;            // accelerate toward the core
      q.r -= q.v * dt;
      const x1 = cx + Math.cos(q.ang) * q.r, y1 = cy + Math.sin(q.ang) * q.r;
      const x2 = cx + Math.cos(q.ang) * (q.r + q.len), y2 = cy + Math.sin(q.ang) * (q.r + q.len);
      ctx.strokeStyle = q.color; ctx.globalAlpha = 0.85; ctx.lineWidth = q.w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      q.dead = q.r < 8;
    } else {
      q.vy += q.g * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.vx *= q.drag || 1;
      q.life -= q.decay * dt;
      ctx.globalAlpha = Math.max(0, q.life);
      ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
      q.dead = q.life <= 0 || q.y > fx.h + 40;
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  fx.parts = fx.parts.filter(q => !q.dead);
  fx.raf = requestAnimationFrame(fxLoop);
}

function fxStart(chargeMs) {
  fxResize();
  fx.parts = [];
  fx.mode = "charge";
  fx.chargeMs = chargeMs;
  fx.chargeAt = performance.now();
  fx.last = fx.chargeAt;
  cancelAnimationFrame(fx.raf);
  fx.raf = requestAnimationFrame(fxLoop);
}

function fxBurst() {
  fx.parts = fx.parts.filter(q => q.kind !== "in");
  fx.mode = "burst";
  const cx = fx.w / 2, cy = fx.h / 2;
  for (let i = 0; i < 220; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 2 + Math.pow(Math.random(), 1.6) * 18;
    fx.parts.push({
      kind: "spark", x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      g: 0.13, drag: 0.985, life: 1, decay: 0.006 + Math.random() * 0.012,
      size: 1.2 + Math.random() * 3.2, color: fxColor(),
    });
  }
}

function fxStop() {
  cancelAnimationFrame(fx.raf);
  fx.mode = "";
  fx.parts = [];
  fx.ctx?.clearRect(0, 0, fx.w, fx.h);
}

/* ---------- Secret reveal: synthesized sound (no audio files needed) ---------- */

// Rising whoosh that peaks right as the charge ends. Returns a function that cuts it short.
function riserSfx(ms) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime, d = ms / 1000;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55, t);
    o.frequency.exponentialRampToValueAtTime(880, t + d);
    f.type = "lowpass";
    f.frequency.setValueAtTime(180, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + d);
    o.connect(f); f.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + d + 0.1);
    let closed = false;
    return () => { if (closed) return; closed = true; ctx.close().catch(() => {}); };
  } catch { return () => {}; }
}

function boomSfx() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.85);
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch { /* audio unavailable */ }
}

// Secret reveal: blackout -> energy converges on a core (shake + riser) -> white burst + boom
// -> the card slams in, tilts with your pointer, and sparkles drift up.
// Click during the charge (after STAR_SKIP_MS) triggers the burst; click on the card closes it.
function playStarReveal(m) {
  const overlay = $("starOverlay");
  const tilt = $("cardTilt");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chargeMs = reduced ? 600 : REVEAL_CHARGE_MS;

  let phase = "charge";
  let closed = false;
  let burstTimer = 0, settleTimer = 0, holdTimer = 0, burstAt = 0;
  let stopRiser = () => {};
  const startAt = performance.now();

  revealing = true;
  syncRollButton();
  $("starCardImg").src = m.img;
  $("starCardImg").alt = m.name;
  $("starCardName").textContent = m.name;
  overlay.style.setProperty("--charge", chargeMs + "ms");
  overlay.style.setProperty("--k", "1");
  ["--rx", "--ry", "--mx", "--my"].forEach(p => tilt.style.removeProperty(p));
  overlay.classList.remove("closing");
  overlay.dataset.phase = "charge";
  overlay.classList.add("on");

  if (!reduced) { fxStart(chargeMs); stopRiser = riserSfx(chargeMs); }

  const burst = () => {
    if (phase !== "charge" || closed) return;
    phase = "burst";
    burstAt = performance.now();
    clearTimeout(burstTimer);
    stopRiser();
    boomSfx();
    overlay.dataset.phase = "burst";
    if (!reduced) fxBurst();
    displayMeme(m);
    setTimeout(() => playMemeSound(m), 250); // let the boom land first
    settleTimer = setTimeout(() => {
      if (closed || phase !== "burst") return;
      phase = "show";
      overlay.dataset.phase = "show";
      if (!reduced) fx.mode = "show";
    }, 1000);
    holdTimer = setTimeout(finish, REVEAL_HOLD_MS);
  };

  const onMove = e => {
    if (phase === "charge") return;
    const r = tilt.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const nx = Math.max(-1, Math.min(1, (px - 0.5) * 2)), ny = Math.max(-1, Math.min(1, (py - 0.5) * 2));
    tilt.style.setProperty("--ry", (nx * 14).toFixed(1) + "deg");
    tilt.style.setProperty("--rx", (-ny * 14).toFixed(1) + "deg");
    tilt.style.setProperty("--mx", (px * 100).toFixed(0) + "%");
    tilt.style.setProperty("--my", (py * 100).toFixed(0) + "%");
  };

  const finish = () => {
    if (closed) return;
    if (phase === "charge") burst(); // make sure the meme is shown/heard before closing
    closed = true;
    clearTimeout(burstTimer); clearTimeout(settleTimer); clearTimeout(holdTimer);
    stopRiser();
    overlay.removeEventListener("click", onClick);
    overlay.removeEventListener("pointermove", onMove);
    overlay.classList.add("closing");
    setTimeout(() => {
      overlay.classList.remove("on", "closing");
      overlay.dataset.phase = "";
      fxStop();
      revealing = false;
      syncRollButton();
    }, 420);
  };

  const onClick = () => {
    const now = performance.now();
    if (phase === "charge") { if (now - startAt > STAR_SKIP_MS) burst(); }
    else if (now - burstAt > 900) finish();
  };

  overlay.addEventListener("click", onClick);
  overlay.addEventListener("pointermove", onMove);
  burstTimer = setTimeout(burst, chargeMs);
}

// One roll. Returns false when locked or signed out.
function rollOnce() {
  if (isLocked() || !state.uid) return false;

  startCooldown();
  const result = pickMeme();

  if (quickRoll) {
    finishRoll(result);
  } else {
    playSound(rollLoop);
    runRollAnimation(result);
  }
  return true;
}

rngButton.addEventListener("click", () => {
  if (isLocked()) return;
  if (!state.uid) { alert("Please sign in first!"); return; }
  rollOnce();
});

quickRollBtn.addEventListener("click", () => {
  if (quickRollBtn.disabled) return;
  quickRoll = !quickRoll;
  quickRollBtn.innerHTML = `${icon("bolt")} Quick Roll: ${quickRoll ? "ON" : "OFF"}`;
});

function setAutoRoll(on, reason) {
  autoRoll = on;
  autoRollBtn.innerHTML = `${icon("gear")} Auto Roll: ${autoRoll ? "ON" : "OFF"}`;
  if (reason) showFloatingText(withIcon("warn", reason), "#ffae00");
}

autoRollBtn.addEventListener("click", () => {
  if (autoRollBtn.disabled) return;
  setAutoRoll(!autoRoll);
});

// Auto roll: fire whenever the roll button is free.
setInterval(() => { if (autoRoll && state.uid) rollOnce(); }, 250);

/* ============================================================
   5. INVENTORY & UPGRADES
   ============================================================ */

const RARITY_ORDER = Object.keys(RARITY_COLORS);
const rarityRank = m => (m ? RARITY_ORDER.indexOf(m.rarity) : -1);
// Secret's canonical grey is unreadable on the dark UI, so the inventory uses a violet accent for it.
const accentOf = m => (!m ? "#777" : m.rarity === "Secret" ? "#b84dff" : m.color);

const INV_PREF_KEY = "memeRng.invView";
const INV_SORTS = ["rarity", "rarityAsc", "name", "count"];
const invView = { sort: "rarity", filter: "all", query: "" };
try {
  const saved = JSON.parse(localStorage.getItem(INV_PREF_KEY) || "{}");
  if (INV_SORTS.includes(saved.sort)) invView.sort = saved.sort;
  if (saved.filter === "all" || RARITY_ORDER.includes(saved.filter)) invView.filter = saved.filter;
} catch { /* storage unavailable: defaults are fine */ }
const saveInvView = () => {
  try { localStorage.setItem(INV_PREF_KEY, JSON.stringify({ sort: invView.sort, filter: invView.filter })); } catch { /* ignore */ }
};

const invComparators = {
  rarity: (a, b) => rarityRank(b.m) - rarityRank(a.m) || a.name.localeCompare(b.name),
  rarityAsc: (a, b) => rarityRank(a.m) - rarityRank(b.m) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  count: (a, b) => b.count - a.count || a.name.localeCompare(b.name),
};

const invFilterEl = $("invFilters");
const invChips = new Map();

function buildInvFilters() {
  const make = (key, label, color) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "inv-chip";
    if (color) chip.style.setProperty("--rc", color);
    chip.innerHTML = (color ? "<i></i>" : "") + `<span class="chip-label"></span>`;
    chip.addEventListener("click", () => {
      invView.filter = invView.filter === key && key !== "all" ? "all" : key;
      saveInvView();
      renderInventory();
    });
    invFilterEl.appendChild(chip);
    invChips.set(key, { chip, label, text: chip.querySelector(".chip-label") });
  };
  make("all", "All");
  RARITY_ORDER.forEach(r => make(r, r, accentOf({ rarity: r, color: RARITY_COLORS[r] })));
}
buildInvFilters();

/* ---------- Auto-discard: rolled memes of chosen rarities never enter the inventory ---------- */
const adBtn = $("autoDiscardBtn");
const adPanel = $("autoDiscardPanel");
const adCleanBtn = $("adCleanBtn");
const adChips = new Map();

RARITY_ORDER.forEach(r => {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "ad-chip";
  chip.style.setProperty("--rc", accentOf({ rarity: r, color: RARITY_COLORS[r] }));
  chip.innerHTML = `<i></i>${esc(r)}`;
  chip.addEventListener("click", () => toggleAutoDiscard(r));
  $("adChips").appendChild(chip);
  adChips.set(r, chip);
});

function toggleAutoDiscard(rarity) {
  const turningOn = !state.autoDiscard[rarity];
  // Epic and above are hard to get back and some upgrades are paid in them, so ask first.
  if (turningOn && rarityRank({ rarity }) >= RARITY_ORDER.indexOf("Epic")
      && !confirm(`Auto-discard every ${rarity} you roll? They're rare, and some upgrades need them.`)) return;
  if (turningOn) state.autoDiscard[rarity] = true; else delete state.autoDiscard[rarity];
  renderAutoDiscard();
  saveUserData();
}

const discardableCount = () => Object.entries(state.inventory)
  .reduce((sum, [name, n]) => sum + (state.autoDiscard[findMeme(name)?.rarity] ? Number(n) || 0 : 0), 0);

function renderAutoDiscard() {
  const active = Object.keys(state.autoDiscard).filter(r => state.autoDiscard[r]);
  for (const [r, chip] of adChips) chip.classList.toggle("on", !!state.autoDiscard[r]);
  $("adBadge").textContent = active.length;
  adBtn.classList.toggle("active", active.length > 0);
  adBtn.title = active.length ? `Auto-discard: ${active.join(", ")}` : "Auto-discard";
  const n = discardableCount();
  adCleanBtn.disabled = n === 0;
  adCleanBtn.textContent = n ? `Clean inventory now (${n})` : "Clean inventory now";
}

adBtn.addEventListener("click", () => {
  adPanel.hidden = !adPanel.hidden;
  adBtn.setAttribute("aria-expanded", String(!adPanel.hidden));
});

adCleanBtn.addEventListener("click", () => {
  const victims = Object.entries(state.inventory).filter(([name]) => state.autoDiscard[findMeme(name)?.rarity]);
  const total = victims.reduce((sum, [, n]) => sum + (Number(n) || 0), 0);
  if (!total || !confirm(`Delete ${total} meme${total === 1 ? "" : "s"} matching your auto-discard rarities?`)) return;
  victims.forEach(([name, n]) => removeMeme(name, n));
  if (selectedMeme && !countOf(selectedMeme)) clearSelection();
  updateInventory();
  showFloatingText(withIcon("trash", `Discarded ${total} meme${total === 1 ? "" : "s"}`), "#8d93a8");
});

// Capacity bar + filter chip counts. Cheap, so it runs on every inventory render.
function renderInvChrome(entries) {
  const total = inventoryCount();
  const limit = state.upgrades.inventoryLimit;
  const ratio = limit ? total / limit : 0;

  setText($("invCapText"), `${total} / ${limit}`);
  $("invCapFill").style.width = `${Math.min(100, ratio * 100)}%`;
  $("invCap").classList.toggle("warn", ratio >= 0.9 && ratio < 1);
  $("invCap").classList.toggle("full", ratio >= 1);

  const perRarity = {};
  for (const e of entries) {
    const r = e.m?.rarity;
    if (r) perRarity[r] = (perRarity[r] || 0) + e.count;
  }
  for (const [key, c] of invChips) {
    const n = key === "all" ? total : perRarity[key] || 0;
    setText(c.text, `${c.label} ${n}`);
    c.chip.classList.toggle("active", invView.filter === key);
    c.chip.classList.toggle("zero", n === 0 && key !== "all");
  }
  renderAutoDiscard();
}

function renderInventory() {
  const entries = Object.entries(state.inventory).map(([name, count]) => ({ name, count, m: findMeme(name) }));
  renderInvChrome(entries);

  const q = invView.query.trim().toLowerCase();
  const rows = entries
    .filter(e => (invView.filter === "all" || e.m?.rarity === invView.filter) && (!q || e.name.toLowerCase().includes(q)))
    .sort(invComparators[invView.sort]);

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "inv-empty";
    empty.textContent = entries.length ? "No memes match this filter." : "Nothing here yet. Roll some memes!";
    inventoryEl.replaceChildren(empty);
    return;
  }
  inventoryEl.replaceChildren(...rows.map(buildInventoryRow));
}

function buildInventoryRow({ name, count, m }) {
  const row = document.createElement("div");
  row.className = "inv-item" + (selectedMeme === name ? " selected" : "");
  row.dataset.name = name;
  row.dataset.rarity = m?.rarity || "";
  row.style.setProperty("--rc", accentOf(m));
  row.title = `${name}${m ? " — " + m.rarity : ""}\nClick to place on the screen`;

  const thumb = document.createElement("img");
  thumb.className = "inv-thumb";
  thumb.src = m?.img || "";
  thumb.alt = "";
  thumb.loading = "lazy";
  thumb.draggable = false;

  const info = document.createElement("div");
  info.className = "inv-info";
  const nameEl = document.createElement("div");
  nameEl.className = "inv-name";
  nameEl.textContent = name;
  const rarityEl = document.createElement("div");
  rarityEl.className = "inv-rarity";
  rarityEl.textContent = m?.rarity || "Unknown";
  info.append(nameEl, rarityEl);

  const countEl = document.createElement("div");
  countEl.className = "inv-count";
  countEl.textContent = `×${count}`;

  const del = document.createElement("button");
  del.className = "inv-del";
  del.textContent = "−";
  del.title = "Discard one";
  del.setAttribute("aria-label", `Discard one ${name}`);
  del.addEventListener("click", e => {
    e.stopPropagation();
    // Epic and above are hard to get back, so ask first.
    if (rarityRank(m) >= RARITY_ORDER.indexOf("Epic") && !confirm(`Discard one ${name} (${m.rarity})?`)) return;
    removeMeme(name);
    if (!countOf(name) && selectedMeme === name) clearSelection();
    updateInventory();
  });

  row.addEventListener("click", () => selectMeme(name));
  row.append(thumb, info, countEl, del);
  return row;
}

$("invSearch").addEventListener("input", e => { invView.query = e.target.value; renderInventory(); });
$("invSort").value = invView.sort;
$("invSort").addEventListener("change", e => {
  invView.sort = INV_SORTS.includes(e.target.value) ? e.target.value : "rarity";
  saveInvView();
  renderInventory();
});

// Re-render everything that depends on the inventory, then save.
function updateInventory() {
  renderInventory();
  renderUpgrades();
  renderCollection();
  saveUserData();
}

const upgradeStatus = $("upgradeStatus");

function spendLucky(amount) {
  spendRarity(LUCKY_RARITIES, amount);
}

const rarityOwned = list => memes
  .filter(m => list.includes(m.rarity))
  .reduce((sum, m) => sum + countOf(m.name), 0);

// Spends from the lowest rarity in the list first (memes[] is ordered common -> secret).
function spendRarity(list, amount) {
  let remaining = amount;
  for (const m of memes.filter(x => list.includes(x.rarity))) {
    const used = Math.min(countOf(m.name), remaining);
    if (used) removeMeme(m.name, used);
    remaining -= used;
    if (remaining <= 0) break;
  }
}

// Scaling costs
const cooldownCost = () => 3 + 2 * state.upgrades.cooldown;                 // Common
const doubleCost = () => 1 + Math.floor(state.upgrades.doubleDrop / 5);     // Mythic
const magnetCost = () => 4 + 2 * state.upgrades.magnet;                     // Uncommon
const nextCooldownMs = () => Math.max(MIN_COOLDOWN_MS, COOLDOWN_MS - (state.upgrades.cooldown + 1) * COOLDOWN_STEP_MS);
const secs = ms => (ms / 1000).toFixed(1) + "s";
const pct = n => Math.round(n * 100);

// Each def: level()/max drive the progress bar (max 1 = one-time unlock); cost() drives the chip + buy state.
const upgradeDefs = [
  {
    id: "cooldown", icon: "bolt", name: "Faster Cooldown",
    level: () => state.upgrades.cooldown, max: MAX_COOLDOWN_LEVEL,
    desc: () => `${secs(cooldownMs())} → ${secs(cooldownFor(state.upgrades.cooldown + 1, state.upgrades.overclock))} between rolls`,
    cost: () => ({ have: rarityOwned(["Common"]), need: cooldownCost(), what: "Common" }),
    buy() {
      spendRarity(["Common"], cooldownCost());
      state.upgrades.cooldown++;
      return ["bolt", `Cooldown → ${secs(cooldownMs())}`, "warn"];
    },
  },
  {
    id: "quick", icon: "bolt", name: "Quick Roll",
    level: () => (state.upgrades.quickRollUnlocked ? 1 : 0), max: 1,
    desc: () => "Skip the roll animation",
    cost: () => ({ have: countOf("Gigachad"), need: 1, what: "Gigachad" }),
    buy() {
      removeMeme("Gigachad");
      state.upgrades.quickRollUnlocked = true;
      return ["bolt", "Quick Roll unlocked!", "warn"];
    },
  },
  {
    id: "auto", icon: "gear", name: "Auto Roll",
    level: () => (state.upgrades.autoRollUnlocked ? 1 : 0), max: 1,
    desc: () => "Rolls for you, stops on Secret (and Legendary if enabled)",
    cost: () => ({ have: rarityOwned(["Legendary"]), need: 1, what: "Legendary" }),
    buy() {
      spendRarity(["Legendary"], 1);
      state.upgrades.autoRollUnlocked = true;
      return ["gear", "Auto Roll unlocked!", "warn"];
    },
  },
  {
    id: "luck", icon: "clover", name: "Luck",
    level: () => state.upgrades.luck, max: MAX_LUCK,
    desc: () => `Epic+ odds +${pct(state.upgrades.luck * LUCK_PER_LEVEL)}% → +${pct((state.upgrades.luck + 1) * LUCK_PER_LEVEL)}%`,
    cost: () => ({ have: luckyOwned(), need: 2, what: "Epic+" }),
    buy() {
      spendLucky(2);
      state.upgrades.luck++;
      return ["clover", `Luck upgraded → ${state.upgrades.luck}`, "ok"];
    },
  },
  {
    id: "magnet", icon: "crown", name: "Mythic Magnet",
    level: () => state.upgrades.magnet, max: MAX_MAGNET_LEVEL,
    desc: () => `Mythic odds +${pct(state.upgrades.magnet * MAGNET_PER_LEVEL)}% → +${pct((state.upgrades.magnet + 1) * MAGNET_PER_LEVEL)}%`,
    cost: () => ({ have: rarityOwned(["Uncommon"]), need: magnetCost(), what: "Uncommon" }),
    buy() {
      spendRarity(["Uncommon"], magnetCost());
      state.upgrades.magnet++;
      return ["crown", `Mythic Magnet → ${state.upgrades.magnet}`, "ok"];
    },
  },
  {
    id: "double", icon: "dice", name: "Double Drop",
    level: () => state.upgrades.doubleDrop, max: MAX_DOUBLE_LEVEL,
    desc: () => `${pct(state.upgrades.doubleDrop * DOUBLE_PER_LEVEL)}% → ${pct((state.upgrades.doubleDrop + 1) * DOUBLE_PER_LEVEL)}% chance for 2 copies`,
    cost: () => ({ have: rarityOwned(["Mythic"]), need: doubleCost(), what: "Mythic" }),
    buy() {
      spendRarity(["Mythic"], doubleCost());
      state.upgrades.doubleDrop++;
      return ["dice", `Double drop chance → ${pct(state.upgrades.doubleDrop * DOUBLE_PER_LEVEL)}%`, "ok"];
    },
  },
  {
    id: "radar", icon: "dice", name: "Rare Radar",
    level: () => state.upgrades.radar, max: MAX_RADAR_LEVEL,
    desc: () => `Rare odds +${pct(state.upgrades.radar * RADAR_PER_LEVEL)}% → +${pct((state.upgrades.radar + 1) * RADAR_PER_LEVEL)}%`,
    cost: () => ({ have: rarityOwned(["Uncommon"]), need: 6 + 2 * state.upgrades.radar, what: "Uncommon" }),
    buy() {
      spendRarity(["Uncommon"], 6 + 2 * state.upgrades.radar);
      state.upgrades.radar++;
      return ["dice", `Rare Radar → ${state.upgrades.radar}`, "ok"];
    },
  },
  {
    id: "seeker", icon: "crown", name: "Secret Seeker",
    level: () => state.upgrades.seeker, max: MAX_SEEKER_LEVEL,
    desc: () => `Secret odds +${pct(state.upgrades.seeker * SEEKER_PER_LEVEL)}% → +${pct((state.upgrades.seeker + 1) * SEEKER_PER_LEVEL)}% (on top of Luck)`,
    cost: () => ({ have: rarityOwned(["Legendary"]), need: 1 + Math.floor(state.upgrades.seeker / 3), what: "Legendary" }),
    buy() {
      spendRarity(["Legendary"], 1 + Math.floor(state.upgrades.seeker / 3));
      state.upgrades.seeker++;
      return ["crown", `Secret Seeker → ${state.upgrades.seeker}`, "ok"];
    },
  },
  {
    id: "overclock", icon: "bolt", name: "Overclock",
    level: () => state.upgrades.overclock, max: MAX_OVERCLOCK_LEVEL,
    desc: () => `${secs(cooldownMs())} → ${secs(cooldownFor(state.upgrades.cooldown, state.upgrades.overclock + 1))} between rolls`,
    cost: () => ({ have: rarityOwned(["Mythic"]), need: 2 + state.upgrades.overclock, what: "Mythic" }),
    buy() {
      spendRarity(["Mythic"], 2 + state.upgrades.overclock);
      state.upgrades.overclock++;
      return ["bolt", `Overclock → ${secs(cooldownMs())}`, "warn"];
    },
  },
  {
    id: "pity", icon: "clover", name: "Pity Timer",
    level: () => state.upgrades.pity, max: MAX_PITY_LEVEL,
    desc: () => {
      const next = PITY_BASE - (state.upgrades.pity + 1) * PITY_STEP;
      return state.upgrades.pity
        ? `Rare+ guaranteed every ${pityEvery()} rolls (${state.upgrades.pityCount}/${pityEvery() - 1}) → ${next}`
        : `Guarantee a Rare+ every ${PITY_BASE - PITY_STEP} rolls`;
    },
    cost: () => ({ have: rarityOwned(["Rare"]), need: 2 + state.upgrades.pity, what: "Rare" }),
    buy() {
      spendRarity(["Rare"], 2 + state.upgrades.pity);
      state.upgrades.pity++;
      return ["clover", `Pity Timer → every ${pityEvery()} rolls`, "ok"];
    },
  },
  {
    id: "jackpot", icon: "dice", name: "Jackpot",
    level: () => state.upgrades.jackpot, max: MAX_JACKPOT_LEVEL,
    desc: () => `${pct(state.upgrades.jackpot * JACKPOT_PER_LEVEL)}% → ${pct((state.upgrades.jackpot + 1) * JACKPOT_PER_LEVEL)}% chance for 3 copies`,
    cost: () => ({ have: rarityOwned(["Epic"]), need: 1 + Math.floor(state.upgrades.jackpot / 3), what: "Epic" }),
    buy() {
      spendRarity(["Epic"], 1 + Math.floor(state.upgrades.jackpot / 3));
      state.upgrades.jackpot++;
      return ["dice", `Jackpot chance → ${pct(state.upgrades.jackpot * JACKPOT_PER_LEVEL)}%`, "ok"];
    },
  },
  {
    id: "free", icon: "bolt", name: "Free Roll",
    level: () => state.upgrades.freeRoll, max: MAX_FREE_LEVEL,
    desc: () => `${pct(state.upgrades.freeRoll * FREE_PER_LEVEL)}% → ${pct((state.upgrades.freeRoll + 1) * FREE_PER_LEVEL)}% chance a roll has no cooldown`,
    cost: () => ({ have: rarityOwned(["Common"]), need: 10 + 5 * state.upgrades.freeRoll, what: "Common" }),
    buy() {
      spendRarity(["Common"], 10 + 5 * state.upgrades.freeRoll);
      state.upgrades.freeRoll++;
      return ["bolt", `Free Roll → ${pct(state.upgrades.freeRoll * FREE_PER_LEVEL)}%`, "warn"];
    },
  },
  {
    id: "inv50", icon: "box", name: "Inventory +50",
    level: () => state.upgrades.inventoryLimit, max: MAX_INVENTORY,
    desc: () => `Limit ${state.upgrades.inventoryLimit} → ${Math.min(MAX_INVENTORY, state.upgrades.inventoryLimit + 50)}`,
    cost: () => ({ have: rarityOwned(["Epic"]), need: 3, what: "Epic" }),
    buy() {
      spendRarity(["Epic"], 3);
      state.upgrades.inventoryLimit = Math.min(MAX_INVENTORY, state.upgrades.inventoryLimit + 50);
      return ["box", `Inventory limit → ${state.upgrades.inventoryLimit}`, ""];
    },
  },
  {
    id: "inv5", icon: "box", name: "Inventory +5",
    level: () => state.upgrades.inventoryLimit, max: MAX_INVENTORY,
    desc: () => `Limit ${state.upgrades.inventoryLimit} → ${Math.min(MAX_INVENTORY, state.upgrades.inventoryLimit + 5)}`,
    cost: () => ({ have: countOf("Pepe"), need: 3, what: "Pepe" }),
    buy() {
      removeMeme("Pepe", 3);
      state.upgrades.inventoryLimit = Math.min(MAX_INVENTORY, state.upgrades.inventoryLimit + 5);
      return ["box", `Inventory limit → ${state.upgrades.inventoryLimit}`, ""];
    },
  },
  {
    id: "inv25", icon: "box", name: `Inventory +${BACKPACK_SLOTS}`,
    level: () => state.upgrades.inventoryLimit, max: MAX_INVENTORY,
    desc: () => `Limit ${state.upgrades.inventoryLimit} → ${Math.min(MAX_INVENTORY, state.upgrades.inventoryLimit + BACKPACK_SLOTS)}`,
    cost: () => ({ have: rarityOwned(["Rare"]), need: 2, what: "Rare" }),
    buy() {
      spendRarity(["Rare"], 2);
      state.upgrades.inventoryLimit = Math.min(MAX_INVENTORY, state.upgrades.inventoryLimit + BACKPACK_SLOTS);
      return ["box", `Inventory limit → ${state.upgrades.inventoryLimit}`, ""];
    },
  },
];

function buyUpgrade(def) {
  if (def.level() >= def.max) return;
  const c = def.cost();
  if (c.have < c.need) { setStatus(upgradeStatus, "err", `Need ${c.need} ${c.what}`); return; }

  const [iconName, text, cls] = def.buy();
  upgradeStatus.innerHTML = withIcon(iconName, text, cls);
  updateInventory();
}

function buildUpgradeCard(def) {
  const card = document.createElement("div");
  card.className = "up-card";
  card.innerHTML =
    `<div class="up-ico">${icon(def.icon)}</div>` +
    `<div class="up-main">` +
      `<div class="up-top"><span class="up-name"></span><span class="up-lvl"></span></div>` +
      `<div class="up-desc"></div>` +
      `<div class="up-bar"><i></i></div>` +
      `<div class="up-costs"></div>` +
    `</div>` +
    `<button class="up-buy" type="button">Buy</button>`;

  const q = sel => card.querySelector(sel);
  def.ui = {
    card, lvl: q(".up-lvl"), desc: q(".up-desc"), bar: q(".up-bar"),
    fill: q(".up-bar i"), costs: q(".up-costs"), buy: q(".up-buy"),
  };
  q(".up-name").textContent = def.name;
  def.ui.buy.addEventListener("click", () => buyUpgrade(def));
  $("upgradeList").appendChild(card);
}
upgradeDefs.forEach(buildUpgradeCard);

const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };

// Updates cards in place (no DOM rebuild), so it is safe to call every second without eating clicks.
function renderUpgrades() {
  for (const def of upgradeDefs) {
    const ui = def.ui;
    const lvl = def.level();
    const unlock = def.max === 1;
    const done = lvl >= def.max;
    const c = def.cost();
    const can = !done && c.have >= c.need;

    setText(ui.lvl, unlock ? (done ? "UNLOCKED" : "LOCKED") : done ? "MAX" : `${lvl}/${def.max}`);
    setText(ui.desc, done ? (unlock ? "Active" : "Maxed out") : def.desc());
    ui.bar.hidden = unlock;
    ui.fill.style.width = `${Math.min(100, (lvl / def.max) * 100)}%`;

    const key = done ? "" : `${c.have}|${c.need}|${c.what}`;
    if (ui.costs.dataset.key !== key) {
      ui.costs.dataset.key = key;
      ui.costs.innerHTML = done ? "" : `<span class="chip${can ? " ok" : ""}">${c.have}/${c.need} ${esc(c.what)}</span>`;
    }

    ui.card.classList.toggle("ready", can);
    ui.card.classList.toggle("maxed", done);
    ui.buy.disabled = !can;
    setText(ui.buy, done ? (unlock ? "Owned" : "Max") : "Buy");
  }
  quickRollBtn.disabled = !state.upgrades.quickRollUnlocked;
  autoRollBtn.disabled = !state.upgrades.autoRollUnlocked;
}

// Keep the panel honest: inventory can change from broadcasts, admin gifts, other tabs' saves, etc.
setInterval(() => { if (!document.hidden) renderUpgrades(); }, UPGRADE_REFRESH_MS);

function renderStats() {
  const { stats } = state;
  const list = obj => Object.entries(obj).map(([k, v]) => `• ${esc(k)}: ${v}<br>`).join("");

  $("statsContent").innerHTML =
    `<b>Total Rolls:</b> ${stats.totalRolls}<br><br>` +
    `<b>Memes:</b><br>${list(stats.memes)}` +
    `<br><b>Rarities:</b><br>${list(stats.rarities)}`;
}

/* ---------- Collection (dictionary) ---------- */

const isDiscovered = name =>
  (state.stats.memes[name] || 0) > 0 || countOf(name) > 0 || state.placed.some(p => p?.name === name);

const TOTAL_CHANCE = memes.reduce((sum, m) => sum + m.chance, 0);
let collectionKey = "";

function renderCollection() {
  const found = memes.filter(m => isDiscovered(m.name));
  const key = memes.map(m => (isDiscovered(m.name) ? 1 : 0) + ":" + (state.stats.memes[m.name] || 0)).join("|");
  setText($("colCount"), `${found.length}/${memes.length}`);
  $("colFill").style.width = `${(found.length / memes.length) * 100}%`;
  $("colFill").parentElement.classList.toggle("complete", found.length === memes.length);
  if (key === collectionKey) return; // nothing changed: don't rebuild (and re-flash) the images
  collectionKey = key;

  const frag = document.createDocumentFragment();
  for (const rarity of RARITY_ORDER) {
    const group = memes.filter(m => m.rarity === rarity);
    if (!group.length) continue;
    const have = group.filter(m => isDiscovered(m.name)).length;

    const head = document.createElement("div");
    head.className = "col-head";
    head.style.setProperty("--rc", accentOf(group[0]));
    head.innerHTML = `<span>${esc(rarity)}</span><span>${have}/${group.length}</span>`;
    frag.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "col-grid";
    for (const m of group) {
      const got = isDiscovered(m.name);
      const card = document.createElement("div");
      card.className = "col-card" + (got ? "" : " locked");
      card.style.setProperty("--rc", accentOf(m));
      const odds = Math.round(TOTAL_CHANCE / m.chance);
      card.title = got ? `${m.name} — click to hear it` : `Undiscovered ${rarity} — about 1 in ${odds} base odds`;

      const img = document.createElement("img");
      img.src = m.img; img.alt = ""; img.loading = "lazy"; img.draggable = false;
      const name = document.createElement("div");
      name.className = "col-name";
      name.textContent = got ? m.name : "???";
      const sub = document.createElement("div");
      sub.className = "col-sub";
      sub.textContent = got ? `rolled ×${state.stats.memes[m.name] || 0}` : `1 in ~${odds}`;
      card.append(img, name, sub);
      if (got) card.addEventListener("click", () => playMemeSound(m));
      grid.appendChild(card);
    }
    frag.appendChild(grid);
  }
  $("colGrid").replaceChildren(frag);
}

/* ---------- Settings ---------- */

const stopLegBox = $("stopLegendary");
function syncSettingsUI() { stopLegBox.checked = !!state.settings.stopLegendary; }
stopLegBox.addEventListener("change", () => {
  state.settings.stopLegendary = stopLegBox.checked;
  saveUserData();
});

/* ============================================================
   6. PLACED MEMES
   ============================================================ */

// Clicks on these never place a meme.
const NO_PLACE_SELECTOR =
  "button, input, select, label, #rngButton, #dock, .drawer, #starOverlay, .inv-item, .placed-meme";

// Placed memes live in their own fixed layer, positioned as viewport ratios.
const placedLayer = document.createElement("div");
placedLayer.id = "placedLayer";
document.body.prepend(placedLayer);

const clamp01 = v => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const spanX = () => Math.max(1, innerWidth - MEME_SIZE);
const spanY = () => Math.max(1, innerHeight - MEME_SIZE);

function setPlacedPos(wrap, data, xr, yr) {
  data.xr = clamp01(xr);
  data.yr = clamp01(yr);
  wrap.style.left = `calc((100% - ${MEME_SIZE}px) * ${data.xr})`;
  wrap.style.top = `calc((100% - ${MEME_SIZE}px) * ${data.yr})`;
}

function selectMeme(name) {
  const m = findMeme(name);
  if (!m) return;

  selectedMeme = name;
  inventoryEl.querySelectorAll(".inv-item").forEach(row =>
    row.classList.toggle("selected", row.dataset.name === name));

  previewImg?.remove();
  previewImg = document.createElement("img");
  previewImg.className = "meme-preview";
  previewImg.src = m.img;
  document.body.appendChild(previewImg);
  movePreview();
}

function clearSelection() {
  selectedMeme = null;
  previewImg?.remove();
  previewImg = null;
  inventoryEl.querySelectorAll(".inv-item.selected").forEach(r => r.classList.remove("selected"));
}

function movePreview() {
  if (!previewImg) return;
  previewImg.style.left = pointer.x - MEME_SIZE / 2 + "px";
  previewImg.style.top = pointer.y - MEME_SIZE / 2 + "px";
}

document.addEventListener("pointermove", e => {
  pointer = { x: e.clientX, y: e.clientY };
  movePreview();
});

document.addEventListener("click", e => {
  if (!selectedMeme || e.target.closest(NO_PLACE_SELECTOR)) return;
  placeSelectedMeme(e.clientX, e.clientY);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") { clearSelection(); openPanel(null); }

  // Admin shortcut: preview the Secret reveal
  if (e.key === "=" && state.isAdmin && !revealing && !e.target.closest("input, select, textarea")) {
    const pool = memes.filter(m => LUCKY_RARITIES.includes(m.rarity));
    playStarReveal(pool[Math.floor(Math.random() * pool.length)]);
  }
});

function placeSelectedMeme(cx, cy) {
  const m = findMeme(selectedMeme);
  if (!m || !countOf(m.name)) { clearSelection(); return; }

  const data = { id: crypto.randomUUID(), name: m.name, img: m.img };
  data.xr = clamp01((cx - MEME_SIZE / 2) / spanX());
  data.yr = clamp01((cy - MEME_SIZE / 2) / spanY());
  state.placed.push(data);
  mountPlacedMeme(data);

  removeMeme(m.name);
  clearSelection();
  updateInventory();
}

function mountPlacedMeme(data) {
  if (data.xr == null) { // migrate old pixel-based saves
    data.xr = clamp01((Number(data.x) || 0) / spanX());
    data.yr = clamp01((Number(data.y) || 0) / spanY());
    delete data.x; delete data.y;
  }

  const wrap = document.createElement("div");
  wrap.className = "placed-meme";
  wrap.dataset.id = data.id;
  setPlacedPos(wrap, data, data.xr, data.yr);

  const img = document.createElement("img");
  img.src = data.img;
  img.alt = data.name;
  img.draggable = false;

  const del = document.createElement("button");
  del.className = "placed-del";
  del.innerHTML = icon("x");
  del.setAttribute("aria-label", `Return ${data.name} to inventory`);
  del.title = "Return to inventory";
  del.addEventListener("click", e => {
    e.stopPropagation();
    const known = !!findMeme(data.name);
    if (known && inventoryCount() >= state.upgrades.inventoryLimit) {
      showFloatingText(withIcon("box", "Inventory full — can't pick it up"), "#ff757c");
      return;
    }
    state.placed = state.placed.filter(p => p.id !== data.id);
    wrap.remove();
    if (known) addMeme(data.name);
    updateInventory(); // re-renders inventory + upgrades and saves
    if (known) showFloatingText(withIcon("box", `${data.name} returned to inventory`), "#4dff88");
  });

  wrap.append(img, del);
  enableDragAndTap(wrap, data);
  placedLayer.appendChild(wrap);
}

// Drag to move; double-tap/double-click to hear the meme. One pointer-event path covers mouse and touch.
function enableDragAndTap(wrap, data) {
  let grab = null;
  let moved = false;
  let lastTap = 0;

  wrap.addEventListener("pointerdown", e => {
    if (e.target.closest(".placed-del")) return;
    const r = wrap.getBoundingClientRect();
    grab = { gx: e.clientX - r.left, gy: e.clientY - r.top, sx: e.clientX, sy: e.clientY };
    moved = false;
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  wrap.addEventListener("pointermove", e => {
    if (!grab) return;
    if (Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) > 4) moved = true;
    setPlacedPos(wrap, data, (e.clientX - grab.gx) / spanX(), (e.clientY - grab.gy) / spanY());
  });

  wrap.addEventListener("pointerup", () => {
    if (!grab) return;
    grab = null;
    if (moved) { saveUserData(); return; }
    const now = Date.now();
    if (now - lastTap < 300) playMemeSound(findMeme(data.name));
    lastTap = now;
  });

  wrap.addEventListener("pointercancel", () => { grab = null; });
}

function restorePlacedMemes() {
  placedLayer.replaceChildren();
  state.placed.forEach(mountPlacedMeme);
}

/* ============================================================
   7. AUTH & ACCOUNT
   ============================================================ */

const accountFields = {
  username: $("usernameInput"),
  email: $("emailInput"),
  password: $("passwordInput"),
};

const freshRecord = username => ({
  username,
  inventory: {},
  placedMemes: [],
  stats: newStats(),
  upgrades: newUpgrades(),
  usedCodes: {},
  autoDiscard: {},
  settings: newSettings(),
  lastSeenMessageTs: Date.now(),
  lastSeenMemeTs: Date.now(),
});

const NO_ACCOUNT_CODES = ["auth/user-not-found", "auth/invalid-credential", "auth/invalid-login-credentials"];

$("loginBtn").addEventListener("click", async () => {
  const email = accountFields.email.value.trim().toLowerCase();
  const password = accountFields.password.value;
  const username = accountFields.username.value.trim();

  if (!email || !password) { alert("Email and password required"); return; }

  try {
    // Try signing in first; onAuthStateChanged does the rest.
    await signInWithEmailAndPassword(auth, email, password);
  } catch (signInErr) {
    if (!NO_ACCOUNT_CODES.includes(signInErr.code)) { alert(signInErr.message); return; }
    if (!username) { alert("Enter a username to create a new account"); return; }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await set(ref(db, "users/" + cred.user.uid), freshRecord(username));
    } catch (signUpErr) {
      alert(signUpErr.message);
    }
  }
});

$("logoutBtn").addEventListener("click", () => signOut(auth).catch(console.error));

$("deleteBtn").addEventListener("click", async () => {
  if (!state.uid) return;
  if (!confirm("Are you sure you want to reset your account? This will clear all your progress.")) return;

  const fresh = freshRecord(state.username);
  try {
    await set(ref(db, "users/" + state.uid), fresh);
    loadUserData(fresh);
    alert("Your account has been reset.");
  } catch (err) {
    console.error(err);
    alert("Failed to reset account.");
  }
});

onAuthStateChanged(auth, async user => {
  if (!user) { handleSignedOut(); return; }

  state.uid = user.uid;
  state.email = user.email;
  state.isAdmin = ADMIN_EMAILS.includes(user.email);

  let data = null;
  try {
    const snap = await get(ref(db, "users/" + state.uid));
    data = snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error("Failed to load user data:", err);
  }

  state.username = data?.username || user.displayName || "User";

  authForm.hidden = true;
  userInfo.hidden = false;
  $("welcome").innerHTML = state.isAdmin
    ? withIcon("crown", `ADMIN ${state.username}`)
    : withIcon("user", `${state.username} [${state.uid}]`);

  if (state.isAdmin) enableAdminTools();

  loadUserData(data);
  listenForGlobalUpdates();
  openPanel(null);
});

function loadUserData(data) {
  const now = Date.now();
  state.inventory = data?.inventory || {};
  state.placed = data?.placedMemes || [];
  state.stats = { ...newStats(), ...(data?.stats || {}) };
  state.stats.memes ||= {};
  state.stats.rarities ||= {};
  state.upgrades = { ...newUpgrades(), ...(data?.upgrades || {}) };
  state.usedCodes = data?.usedCodes || {};
  state.autoDiscard = data?.autoDiscard || {};
  state.settings = { ...newSettings(), ...(data?.settings || {}) };
  syncSettingsUI();
  // New accounts shouldn't retroactively receive old broadcasts.
  state.seenMessageTs = data?.lastSeenMessageTs || now;
  state.seenMemeTs = data?.lastSeenMemeTs || now;

  renderInventory();
  renderUpgrades();
  renderStats();
  renderAutoDiscard();
  renderCollection();
  restorePlacedMemes();
}

function handleSignedOut() {
  unsubscribeMessages?.(); unsubscribeMessages = null;
  unsubscribeMemes?.(); unsubscribeMemes = null;
  clearTimeout(saveTimer);
  clearSelection();

  Object.assign(state, {
    uid: null, username: null, email: null, isAdmin: false,
    inventory: {}, placed: [], stats: newStats(), upgrades: newUpgrades(), usedCodes: {}, autoDiscard: {}, settings: newSettings(),
  });
  setAutoRoll(false);
  quickRoll = false;
  quickRollBtn.innerHTML = `${icon("bolt")} Quick Roll: OFF`;

  restorePlacedMemes();
  renderInventory();
  renderUpgrades();
  renderStats();
  renderAutoDiscard();
  syncSettingsUI();
  renderCollection();

  authForm.hidden = false;
  userInfo.hidden = true;
  $("adminToggleBtn").hidden = true;
  $("adminPanelWrapper").classList.remove("open");
  showPanel("authBox"); // signed out: surface the login drawer
}

/* ============================================================
   8. REDEEM CODES, ADMIN & BROADCASTS
   ============================================================ */

$("redeemBtn").addEventListener("click", () => {
  const input = $("codeInput");
  const status = $("codeStatus");
  const code = input.value.trim().toUpperCase();
  const reward = REDEEM_CODES[code];

  if (!state.uid) return setStatus(status, "err", "Please sign in first");
  if (!reward) return setStatus(status, "err", "Invalid code");
  if (state.usedCodes[code]) return setStatus(status, "warn", "Code already used");

  addMeme(reward.meme, reward.amount);
  state.usedCodes[code] = true;
  input.value = "";
  updateInventory();
  setStatus(status, "ok", `Received ${reward.meme}!`);
});

function fillMemeSelect(select) {
  select.innerHTML = memes.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${m.rarity})</option>`).join("");
}

function enableAdminTools() {
  $("adminToggleBtn").hidden = false;
  $("adminPanel").style.display = "block";

  const spawnSelect = $("adminMemeSelect");
  const giveSelect = $("globalMemeSelect");
  const messageInput = $("globalMessageInput");
  const status = $("globalAdminStatus");
  fillMemeSelect(spawnSelect);
  fillMemeSelect(giveSelect);

  $("spawnMemeBtn").onclick = () => {
    const m = findMeme(spawnSelect.value);
    if (!m) return;
    addMeme(m.name);
    updateInventory();
    showFloatingText(withIcon("check", `Spawned ${m.name}!`), m.color);
  };

  $("sendGlobalMessageBtn").onclick = async () => {
    const message = messageInput.value.trim();
    if (!message) return;
    try {
      await push(ref(db, "globalMessages"), { message, sender: state.email, timestamp: Date.now() });
      setStatus(status, "ok", "Message sent globally!");
      messageInput.value = "";
    } catch (err) {
      console.error(err);
      setStatus(status, "err", "Failed to send message.");
    }
  };

  $("giveGlobalMemeBtn").onclick = async () => {
    const memeName = giveSelect.value;
    if (!findMeme(memeName)) return;
    try {
      await push(ref(db, "globalMemes"), { memeName, sender: state.email, amount: 1, timestamp: Date.now() });
      setStatus(status, "ok", `${memeName} given to all users!`);
    } catch (err) {
      console.error(err);
      setStatus(status, "err", "Failed to give meme globally.");
    }
  };
}

// Realtime broadcasts. Each listener only sees entries newer than the last one this
// account processed, so a message shows once and a global meme is credited once.
function listenForGlobalUpdates() {
  unsubscribeMessages?.();
  unsubscribeMemes?.();

  unsubscribeMessages = onChildAdded(
    query(ref(db, "globalMessages"), orderByChild("timestamp"), startAt(state.seenMessageTs + 1)),
    snap => {
      const msg = snap.val();
      if (!msg) return;
      showGlobalMessage(msg.message);
      if (msg.timestamp > state.seenMessageTs) {
        state.seenMessageTs = msg.timestamp;
        saveUserData();
      }
    }
  );

  unsubscribeMemes = onChildAdded(
    query(ref(db, "globalMemes"), orderByChild("timestamp"), startAt(state.seenMemeTs + 1)),
    snap => {
      const gift = snap.val();
      if (!gift || !findMeme(gift.memeName)) return;
      addMeme(gift.memeName, gift.amount);
      if (gift.timestamp > state.seenMemeTs) state.seenMemeTs = gift.timestamp;
      updateInventory();
      showFloatingText(withIcon("globe", `Received ${gift.memeName}!`), "#4dff88");
    }
  );
}

/* ============================================================
   9. PANELS & BOOT
   ============================================================ */

const PANELS = ["authBox", "redeemBox", "upgradePanel", "statsPanel", "collectionPanel", "adminPanelWrapper"];
const dockButtons = [...document.querySelectorAll("#dock [data-panel]")];
PANELS.forEach(id => $(id).classList.add("drawer"));

// Only one drawer is ever open; calling with the open panel's id closes it.
function openPanel(id) {
  const willOpen = !!id && !$(id).classList.contains("open");
  PANELS.forEach(p => $(p).classList.toggle("open", willOpen && p === id));
  dockButtons.forEach(b => b.classList.toggle("active", willOpen && b.dataset.panel === id));
  if (willOpen && id === "upgradePanel") renderUpgrades();
  if (willOpen && id === "collectionPanel") renderCollection();
}
const showPanel = id => { openPanel(null); openPanel(id); };

dockButtons.forEach(b => b.addEventListener("click", e => {
  e.stopPropagation();
  openPanel(b.dataset.panel);
}));
document.addEventListener("click", e => {
  if (!e.target.closest(".drawer, #dock")) openPanel(null);
});

// Placed-meme layer cycles: behind UI -> arrange (above UI) -> hidden
const LAYER_MODES = ["", "arrange", "hidden"];
const LAYER_LABELS = { "": "Memes: behind UI", arrange: "Memes: arrange mode", hidden: "Memes: hidden" };
let layerMode = 0;
$("arrangeBtn").addEventListener("click", () => {
  layerMode = (layerMode + 1) % LAYER_MODES.length;
  const mode = LAYER_MODES[layerMode];
  placedLayer.classList.toggle("arrange", mode === "arrange");
  placedLayer.classList.toggle("hidden", mode === "hidden");
  $("arrangeBtn").title = LAYER_LABELS[mode];
  showFloatingText(esc(LAYER_LABELS[mode]));
});

// Keyboard access for the div-based roll button
rngButton.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rngButton.click(); }
});

renderUpgrades();
renderStats();
renderCollection();
