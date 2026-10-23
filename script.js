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
const REVEAL_BUILD_MS = 4200;  // Secret cutscene: star charges up
const REVEAL_HOLD_MS = 5000;   // Secret cutscene: reveal card stays before auto-close
const STAR_SKIP_MS = 1200;     // click-to-skip unlocks after this long
const UPGRADE_REFRESH_MS = 1000;
const ROLL_STEPS = 18;         // how many frames the roll animation shows
const MAX_LUCK = 10;
const LUCK_PER_LEVEL = 0.1;    // +10% weight on lucky rarities per level
const MAX_INVENTORY = 250;

// Upgrade tuning
const MIN_COOLDOWN_MS = 1500;
const COOLDOWN_STEP_MS = 300;      // faster cooldown: -300ms per level
const MAX_COOLDOWN_LEVEL = 8;
const DOUBLE_PER_LEVEL = 0.05;     // +5% chance of a double drop per level
const MAX_DOUBLE_LEVEL = 10;
const MAGNET_PER_LEVEL = 0.1;      // +10% weight on Mythic per level
const MAX_MAGNET_LEVEL = 5;
const BACKPACK_SLOTS = 25;
const AUTO_STOP_RARITIES = ["Legendary", "Secret"]; // auto roll stops so you see these
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
});

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

function pickMeme() {
  const { luck, magnet } = state.upgrades;
  const luckBoost = 1 + luck * LUCK_PER_LEVEL;
  const magnetBoost = 1 + magnet * MAGNET_PER_LEVEL;
  const weights = memes.map(m => m.chance * (
    LUCKY_RARITIES.includes(m.rarity) ? luckBoost : m.rarity === "Mythic" ? magnetBoost : 1));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < memes.length; i++) {
    r -= weights[i];
    if (r <= 0) return memes[i];
  }
  return memes[memes.length - 1];
}

function displayMeme(m) {
  memeImg.src = m.img;
  resultEl.textContent = m.name;
  resultEl.style.color = m.color;
  rarityLabel.textContent = m.rarity;
}

const isLocked = () => cooling || revealing || animating;
const cooldownMs = () => Math.max(MIN_COOLDOWN_MS, COOLDOWN_MS - state.upgrades.cooldown * COOLDOWN_STEP_MS);
const syncRollButton = () => rngButton.classList.toggle("disabled", isLocked());

function startCooldown() {
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
  const scale = cooldownMs() / COOLDOWN_MS;
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
  animating = false;
  stats.totalRolls++;
  stats.memes[m.name] = (stats.memes[m.name] || 0) + 1;
  stats.rarities[m.rarity] = (stats.rarities[m.rarity] || 0) + 1;

  rollLoop.pause();
  rollLoop.currentTime = 0;
  rollLoop.playbackRate = 1.4;
  playSound(rollEnd);

  const space = state.upgrades.inventoryLimit - inventoryCount();
  if (space <= 0) {
    showFloatingText(withIcon("box", "Inventory full — meme discarded!"), "#ff757c");
    if (autoRoll) setAutoRoll(false, "Auto Roll stopped: inventory full");
  } else {
    const wanted = Math.random() < state.upgrades.doubleDrop * DOUBLE_PER_LEVEL ? 2 : 1;
    const gained = Math.min(wanted, space);
    addMeme(m.name, gained);
    renderInventory();
    if (gained === 2) showFloatingText(withIcon("dice", `Double drop: ${m.name} x2!`), m.color);
  }

  if (autoRoll && AUTO_STOP_RARITIES.includes(m.rarity)) {
    setAutoRoll(false, `Auto Roll stopped: ${m.rarity}!`);
  }

  if (["Epic", "Legendary"].includes(m.rarity)) screenFlash();

  if (m.rarity === "Secret") {
    playStarReveal(m);
  } else {
    displayMeme(m);
    playMemeSound(m);
  }

  renderStats();
  renderUpgrades();
  saveUserData();
}

const REVEAL_CAPTIONS = ["something is stirring…", "it's getting closer…", "SECRET"];

// Cutscene: hyperspace streaks + charging star -> white-out -> burst + reveal card.
// Click during the build (after STAR_SKIP_MS) jumps to the reveal; click on the card closes it.
function playStarReveal(m) {
  const overlay = $("starOverlay");
  const canvas = $("starCanvas");
  const ctx = canvas.getContext("2d");
  const halo = $("starHalo");
  const caption = $("starCaption");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buildMs = reduced ? 1200 : REVEAL_BUILD_MS;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0, cx = 0, cy = 0, maxR = 1;
  const resize = () => {
    W = canvas.width = Math.round(innerWidth * dpr);
    H = canvas.height = Math.round(innerHeight * dpr);
    cx = W / 2; cy = H / 2; maxR = Math.hypot(cx, cy);
  };
  resize();
  window.addEventListener("resize", resize);

  const mkStar = anywhere => ({
    a: Math.random() * Math.PI * 2,
    r: anywhere ? Math.random() * maxR : Math.random() * 40 * dpr,
    v: (30 + Math.random() * 90) * dpr,
    hue: 190 + Math.random() * 130,
    w: (0.6 + Math.random() * 1.4) * dpr,
  });
  const stars = Array.from({ length: reduced ? 70 : 220 }, () => mkStar(true));
  const rings = [], sparks = [], confetti = [];

  let phase = "build", closed = false, raf = 0, holdTimer = 0;
  let revealAt = 0, ringTimer = 0, captionStep = -1;
  const startAt = performance.now();
  let last = startAt;

  revealing = true;
  syncRollButton();
  $("starCardImg").src = m.img;
  $("starCardImg").alt = m.name;
  $("starCardName").textContent = m.name;
  halo.style.transform = "scale(0.2) rotate(0deg)";
  overlay.style.transform = "";
  overlay.classList.remove("closing");
  overlay.dataset.phase = "build";
  overlay.classList.add("on");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const startReveal = () => {
    if (phase !== "build" || closed) return;
    phase = "reveal";
    revealAt = performance.now();
    overlay.dataset.phase = "reveal";
    overlay.style.transform = "";
    displayMeme(m);
    playMemeSound(m);

    rings.push({ r: 0, a: 1, speed: 1600 * dpr, w: 6 * dpr, hue: 45 });
    for (let i = 0; i < (reduced ? 60 : 180); i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (150 + Math.random() * 900) * dpr;
      const life = 1 + Math.random() * 1.6;
      sparks.push({
        x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life, max: life, hue: Math.random() * 360, size: (1.5 + Math.random() * 3.5) * dpr,
      });
    }
    holdTimer = setTimeout(finish, REVEAL_HOLD_MS);
  };

  const finish = () => {
    if (closed) return;
    if (phase === "build") startReveal(); // make sure the meme is shown/heard before closing
    closed = true;
    clearTimeout(holdTimer);
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    overlay.removeEventListener("click", onClick);
    overlay.classList.add("closing");
    setTimeout(() => {
      overlay.classList.remove("on", "closing");
      overlay.dataset.phase = "";
      overlay.style.transform = "";
      ctx.clearRect(0, 0, W, H);
      revealing = false;
      syncRollButton();
    }, 350);
  };

  const onClick = () => {
    const now = performance.now();
    if (phase === "build") { if (now - startAt > STAR_SKIP_MS) startReveal(); }
    else if (now - revealAt > 700) finish();
  };
  overlay.addEventListener("click", onClick);

  const frame = now => {
    if (closed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    ctx.fillStyle = phase === "build" ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round";

    if (phase === "build") {
      const p = Math.min(1, (now - startAt) / buildMs);
      const mult = 1 + 38 * p * p * p;

      for (const s of stars) {
        s.r += s.v * mult * dt;
        if (s.r > maxR) { Object.assign(s, mkStar(false)); continue; }
        const tail = Math.max(0, s.r - s.v * mult * 0.04);
        ctx.strokeStyle = `hsla(${s.hue},100%,${70 + 30 * p}%,${0.25 + 0.75 * p})`;
        ctx.lineWidth = s.w * (1 + p);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.a) * tail, cy + Math.sin(s.a) * tail);
        ctx.lineTo(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r);
        ctx.stroke();
      }

      ringTimer += dt;
      if (ringTimer > 0.7 - 0.4 * p) {
        ringTimer = 0;
        rings.push({ r: 0, a: 0.8, speed: (180 + 300 * p) * dpr, w: 2 * dpr, hue: 260 + Math.random() * 60 });
      }

      const ease = p * p * (3 - 2 * p);
      halo.style.transform = `scale(${0.2 + 1.7 * ease}) rotate(${p * 1080}deg)`;

      if (!reduced) {
        const amp = p * p * 10;
        overlay.style.transform = `translate(${(Math.random() - 0.5) * amp}px, ${(Math.random() - 0.5) * amp}px)`;
      }

      const step = p < 0.3 ? 0 : p < 0.7 ? 1 : 2;
      if (step !== captionStep) {
        captionStep = step;
        caption.textContent = REVEAL_CAPTIONS[step];
        caption.dataset.step = step;
      }

      if (p >= 1) startReveal();
    } else if (!reduced && now - revealAt < 3000 && Math.random() < 0.6) {
      confetti.push({
        x: Math.random() * W, y: -10 * dpr,
        vx: (Math.random() - 0.5) * 80 * dpr, vy: (140 + Math.random() * 220) * dpr,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
        hue: Math.random() * 360, w: (5 + Math.random() * 5) * dpr, h: (3 + Math.random() * 4) * dpr,
      });
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      const g = rings[i];
      g.r += g.speed * dt;
      g.a -= dt * 0.9;
      if (g.a <= 0 || g.r > maxR * 1.2) { rings.splice(i, 1); continue; }
      ctx.strokeStyle = `hsla(${g.hue},100%,75%,${g.a})`;
      ctx.lineWidth = g.w;
      ctx.beginPath();
      ctx.arc(cx, cy, g.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= 0.985;
      s.vy = s.vy * 0.985 + 380 * dpr * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `hsla(${s.hue},100%,65%,${Math.min(1, s.life / s.max)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const f = confetti[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      if (f.y > H + 20 * dpr) { confetti.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.fillStyle = `hsl(${f.hue},100%,60%)`;
      ctx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
      ctx.restore();
    }

    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
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

function renderInventory() {
  inventoryEl.replaceChildren(
    ...Object.entries(state.inventory).map(([name, count]) => buildInventoryRow(name, count))
  );
}

function buildInventoryRow(name, count) {
  const row = document.createElement("div");
  row.className = "inv-item" + (selectedMeme === name ? " selected" : "");
  row.dataset.name = name;

  const label = document.createElement("span");
  label.textContent = `${name} [${count}x]`;

  const del = document.createElement("button");
  del.className = "inv-del";
  del.textContent = "−";
  del.setAttribute("aria-label", `Discard one ${name}`);
  del.addEventListener("click", e => {
    e.stopPropagation();
    removeMeme(name);
    if (!countOf(name) && selectedMeme === name) clearSelection();
    updateInventory();
  });

  row.addEventListener("click", () => selectMeme(name));
  row.append(label, del);
  return row;
}

// Re-render everything that depends on the inventory, then save.
function updateInventory() {
  renderInventory();
  renderUpgrades();
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
    desc: () => `${secs(cooldownMs())} → ${secs(nextCooldownMs())} between rolls`,
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
    desc: () => "Rolls for you, stops on Legendary+",
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
  // New accounts shouldn't retroactively receive old broadcasts.
  state.seenMessageTs = data?.lastSeenMessageTs || now;
  state.seenMemeTs = data?.lastSeenMemeTs || now;

  renderInventory();
  renderUpgrades();
  renderStats();
  restorePlacedMemes();
}

function handleSignedOut() {
  unsubscribeMessages?.(); unsubscribeMessages = null;
  unsubscribeMemes?.(); unsubscribeMemes = null;
  clearTimeout(saveTimer);
  clearSelection();

  Object.assign(state, {
    uid: null, username: null, email: null, isAdmin: false,
    inventory: {}, placed: [], stats: newStats(), upgrades: newUpgrades(), usedCodes: {},
  });
  setAutoRoll(false);
  quickRoll = false;
  quickRollBtn.innerHTML = `${icon("bolt")} Quick Roll: OFF`;

  restorePlacedMemes();
  renderInventory();
  renderUpgrades();
  renderStats();

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

const PANELS = ["authBox", "redeemBox", "upgradePanel", "statsPanel", "adminPanelWrapper"];
const dockButtons = [...document.querySelectorAll("#dock [data-panel]")];
PANELS.forEach(id => $(id).classList.add("drawer"));

// Only one drawer is ever open; calling with the open panel's id closes it.
function openPanel(id) {
  const willOpen = !!id && !$(id).classList.contains("open");
  PANELS.forEach(p => $(p).classList.toggle("open", willOpen && p === id));
  dockButtons.forEach(b => b.classList.toggle("active", willOpen && b.dataset.panel === id));
  if (willOpen && id === "upgradePanel") renderUpgrades();
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
