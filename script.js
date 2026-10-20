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
const STAR_MS = 7500;          // length of the Secret reveal animation
const ROLL_STEPS = 18;         // how many frames the roll animation shows
const MAX_LUCK = 10;
const LUCK_PER_LEVEL = 0.1;    // +10% weight on lucky rarities per level
const MAX_INVENTORY = 250;
const MEME_SIZE = 100;         // px, placed memes

const SOUND_BASE = "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/";

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
const newUpgrades = () => ({ luck: 0, quickRollUnlocked: false, inventoryLimit: 50 });

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

function playMemeSound(m) {
  if (!m?.sound) return;
  const audio = new Audio(m.sound);
  audio.volume = 0.9;
  playSound(audio);
}

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
  const boost = 1 + state.upgrades.luck * LUCK_PER_LEVEL;
  const weights = memes.map(m => m.chance * (LUCKY_RARITIES.includes(m.rarity) ? boost : 1));
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

const isLocked = () => cooling || revealing;
const syncRollButton = () => rngButton.classList.toggle("disabled", isLocked());

function startCooldown() {
  cooling = true;
  syncRollButton();

  cooldownFill.style.transition = "none";
  cooldownFill.style.width = "100%";
  void cooldownFill.offsetWidth; // flush styles so the transition below starts from 100%
  cooldownFill.style.transition = `width ${COOLDOWN_MS}ms linear`;
  cooldownFill.style.width = "0%";

  setTimeout(() => { cooling = false; syncRollButton(); }, COOLDOWN_MS);
}

function runRollAnimation(finalMeme) {
  let delay = 50;       // start fast…
  const maxDelay = 380; // …and ease out slowly
  let step = 0;

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
  stats.totalRolls++;
  stats.memes[m.name] = (stats.memes[m.name] || 0) + 1;
  stats.rarities[m.rarity] = (stats.rarities[m.rarity] || 0) + 1;

  rollLoop.pause();
  rollLoop.currentTime = 0;
  rollLoop.playbackRate = 1.4;
  playSound(rollEnd);

  if (inventoryCount() + 1 > state.upgrades.inventoryLimit) {
    showFloatingText(withIcon("box", "Inventory full — meme discarded!"), "#ff757c");
  } else {
    addMeme(m.name);
    renderInventory();
  }

  if (["Epic", "Legendary"].includes(m.rarity)) screenFlash();

  if (m.rarity === "Secret") {
    playStarReveal(m);
  } else {
    displayMeme(m);
    playMemeSound(m);
  }

  renderStats();
  saveUserData();
}

function playStarReveal(m) {
  const overlay = $("starOverlay");
  const parts = [$("starGlow"), $("starReveal")];
  const resetParts = () => parts.forEach(p => {
    p.style.animation = "none";
    p.style.transform = "scale(0.2) rotate(0deg)";
  });

  revealing = true;
  syncRollButton();
  overlay.style.display = "flex";

  resetParts();
  void overlay.offsetWidth;
  parts.forEach(p => { p.style.animation = `starGrowSpin ${STAR_MS}ms linear forwards`; });

  setTimeout(() => { screenFlash(); displayMeme(m); playMemeSound(m); }, STAR_MS - 200);
  setTimeout(() => {
    resetParts();
    overlay.style.display = "none";
    revealing = false;
    syncRollButton();
  }, STAR_MS);
}

rngButton.addEventListener("click", () => {
  if (isLocked()) return;
  if (!state.uid) { alert("Please sign in first!"); return; }

  startCooldown();
  const result = pickMeme();

  if (quickRoll) {
    finishRoll(result);
  } else {
    playSound(rollLoop);
    runRollAnimation(result);
  }
});

quickRollBtn.addEventListener("click", () => {
  if (quickRollBtn.disabled) return;
  quickRoll = !quickRoll;
  quickRollBtn.innerHTML = `${icon("bolt")} Quick Roll: ${quickRoll ? "ON" : "OFF"}`;
});

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
  let remaining = amount;
  for (const m of memes.filter(x => LUCKY_RARITIES.includes(x.rarity))) {
    const used = Math.min(countOf(m.name), remaining);
    if (used) removeMeme(m.name, used);
    remaining -= used;
    if (remaining <= 0) break;
  }
}

const upgradeDefs = [
  {
    el: $("upgradeLuckBtn"),
    maxed: () => state.upgrades.luck >= MAX_LUCK,
    canBuy: () => luckyOwned() >= 2,
    failText: "Need 2 Epic+ memes",
    buy() {
      spendLucky(2);
      state.upgrades.luck++;
      return ["clover", `Luck upgraded → ${state.upgrades.luck}`, "ok"];
    },
  },
  {
    el: $("unlockQuickRollBtn"),
    maxed: () => state.upgrades.quickRollUnlocked,
    canBuy: () => countOf("Gigachad") >= 1,
    failText: "Need 1 Gigachad",
    buy() {
      removeMeme("Gigachad");
      state.upgrades.quickRollUnlocked = true;
      return ["bolt", "Quick Roll unlocked!", "warn"];
    },
  },
  {
    el: $("upgradeInventoryBtn"),
    maxed: () => state.upgrades.inventoryLimit >= MAX_INVENTORY,
    canBuy: () => countOf("Pepe") >= 3,
    failText: "Need 3 Pepe",
    buy() {
      removeMeme("Pepe", 3);
      state.upgrades.inventoryLimit += 5;
      return ["box", `Inventory limit → ${state.upgrades.inventoryLimit}`, ""];
    },
  },
];

upgradeDefs.forEach(def => def.el.addEventListener("click", () => {
  if (def.maxed()) return;
  if (!def.canBuy()) { setStatus(upgradeStatus, "err", def.failText); return; }

  const [iconName, text, cls] = def.buy();
  upgradeStatus.innerHTML = withIcon(iconName, text, cls);
  quickRollBtn.disabled = !state.upgrades.quickRollUnlocked;
  updateInventory();
}));

function renderUpgrades() {
  upgradeDefs.forEach(def => {
    def.el.style.display = def.maxed() ? "none" : "block";
    def.el.disabled = def.maxed() || !def.canBuy();
  });
  quickRollBtn.disabled = !state.upgrades.quickRollUnlocked;
}

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
  "button, input, select, label, #rngButton, #statsToggle, #authBox, #statsPanel, " +
  "#adminPanelWrapper, #redeemBox, #upgradeWrapper, .inv-item, .placed-meme";

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
  pointer = { x: e.pageX, y: e.pageY };
  movePreview();
});

document.addEventListener("click", e => {
  if (!selectedMeme || e.target.closest(NO_PLACE_SELECTOR)) return;
  placeSelectedMeme(e.pageX, e.pageY);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") clearSelection();

  // Admin shortcut: preview the Secret reveal
  if (e.key === "=" && state.isAdmin && !revealing && !e.target.closest("input, select, textarea")) {
    const pool = memes.filter(m => LUCKY_RARITIES.includes(m.rarity));
    playStarReveal(pool[Math.floor(Math.random() * pool.length)]);
  }
});

function placeSelectedMeme(x, y) {
  const m = findMeme(selectedMeme);
  if (!m || !countOf(m.name)) { clearSelection(); return; }

  const data = { id: crypto.randomUUID(), name: m.name, img: m.img, x: x - MEME_SIZE / 2, y: y - MEME_SIZE / 2 };
  state.placed.push(data);
  mountPlacedMeme(data);

  removeMeme(m.name);
  clearSelection();
  updateInventory();
}

function mountPlacedMeme(data) {
  const wrap = document.createElement("div");
  wrap.className = "placed-meme";
  wrap.dataset.id = data.id;
  wrap.style.left = data.x + "px";
  wrap.style.top = data.y + "px";

  const img = document.createElement("img");
  img.src = data.img;
  img.alt = data.name;
  img.draggable = false;

  const del = document.createElement("button");
  del.className = "placed-del";
  del.innerHTML = icon("x");
  del.setAttribute("aria-label", `Remove ${data.name}`);
  del.addEventListener("click", e => {
    e.stopPropagation();
    state.placed = state.placed.filter(p => p.id !== data.id);
    wrap.remove();
    saveUserData();
  });

  wrap.append(img, del);
  enableDragAndTap(wrap, data);
  document.body.appendChild(wrap);
}

// Drag to move; double-tap/double-click to hear the meme. One pointer-event path covers mouse and touch.
function enableDragAndTap(wrap, data) {
  let grab = null;
  let moved = false;
  let lastTap = 0;

  wrap.addEventListener("pointerdown", e => {
    if (e.target.closest(".placed-del")) return;
    grab = { dx: e.pageX - wrap.offsetLeft, dy: e.pageY - wrap.offsetTop, sx: e.pageX, sy: e.pageY };
    moved = false;
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  wrap.addEventListener("pointermove", e => {
    if (!grab) return;
    if (Math.hypot(e.pageX - grab.sx, e.pageY - grab.sy) > 4) moved = true;
    wrap.style.left = e.pageX - grab.dx + "px";
    wrap.style.top = e.pageY - grab.dy + "px";
  });

  wrap.addEventListener("pointerup", () => {
    if (!grab) return;
    grab = null;

    if (moved) {
      data.x = wrap.offsetLeft;
      data.y = wrap.offsetTop;
      saveUserData();
      return;
    }
    const now = Date.now();
    if (now - lastTap < 300) playMemeSound(findMeme(data.name));
    lastTap = now;
  });

  wrap.addEventListener("pointercancel", () => { grab = null; });
}

function restorePlacedMemes() {
  document.querySelectorAll(".placed-meme").forEach(el => el.remove());
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

$("adminToggleBtn").addEventListener("click", () => $("adminPanelWrapper").classList.toggle("open"));
$("statsToggle").addEventListener("click", () => $("statsPanel").classList.toggle("open"));

$("upgradeToggle").addEventListener("click", () => {
  const closed = $("upgradeWrapper").classList.toggle("closed");
  $("upgradeToggle").textContent = closed ? ">" : "<";
});

// Keyboard access for the div-based controls
for (const id of ["rngButton", "statsToggle"]) {
  $(id).addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $(id).click(); }
  });
}

renderUpgrades();
renderStats();
