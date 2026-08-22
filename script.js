import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  query,
  orderByChild,
  startAt,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ========== FIREBASE CONFIG ==========
// 🔧 Replace these with the values from your Firebase project settings
// (Project settings -> General -> Your apps -> SDK setup and configuration).
// Since this uses the Realtime Database (not Firestore), make sure
// "databaseURL" is filled in — you'll find it on the Realtime Database page.
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

const memes = [
  { name: "Bruh", chance: 50, img: "https://iili.io/fpYGZZB.jpg", color: "#aaa", rarity: "Common", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/fredchaferfrommedia-bruh-1-120133.mp3" },
  { name: "Bing Chilling", chance: 50, img: "https://iili.io/qHCIC0B.png", color: "#aaa", rarity: "Common", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/bing-chilling_fcdGgUc.mp3" },
  { name: "Sheesh", chance: 25, img: "https://iili.io/fpYGg4e.jpg", color: "#4dff88", rarity: "Uncommon", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/original-sheesh-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Pepe", chance: 25, img: "https://iili.io/fpaN8cN.jpg", color: "#4dff88", rarity: "Uncommon", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/el-pepe_hGUhiaM.mp3"},
  { name: "Sus", chance: 12.5, img: "https://iili.io/fpYGUG9.webp", color: "#4da6ff", rarity: "Rare", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/53b1bab6-a8c3-4a1a-82db-7110ce1c29ef_6KNDGWD.mp3"},
  { name: "Gigachad", chance: 12.5, img: "https://iili.io/fpYG6Yb.webp", color: "#ffae00", rarity: "Epic", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/gigachad-theme-music-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Stick Bug", chance: 12.5, img: "https://iili.io/fykVLkG.webp", color: "#ffae00", rarity: "Epic", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/bugged-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Derpy Squarepants", chance: 5, img: "https://iili.io/fy9OkJt.webp", color: "#ff757c", rarity: "Mythic", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/spongebob-boowomp.mp3"},
  { name: "Bad Apple", chance: 5, img: "https://iili.io/fyX9qkx.jpg", color: "#ff757c", rarity: "Mythic", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/bad-apple-%5BAudioTrimmer.com%5D.mp3"},
  { name: "9 + 10", chance: 5, img: "https://iili.io/q9lnZbt.webp", color: "#ff757c", rarity: "Mythic", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/9-10-vine-rnm2az4_F0Tn5hMt.mp3"},
  { name: "OHIO FINAL BOSS", chance: 2.5, img: "https://iili.io/fpYGLTQ.jpg", color: "#ff004c", rarity: "Legendary", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/ohio-final-boss-theme-made-with-Voicemod-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Keyboard cat", chance: 2.5, img: "https://iili.io/fyjDgrg.jpg", color: "#ff004c", rarity: "Legendary", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/keyboardcat-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Golden Dandelion", chance: 2.5, img: "https://iili.io/qHnWJQR.jpg", color: "#ff004c", rarity: "Legendary", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/golden-dandelion.mp3"},
  { name: "Raah Skeleton", chance: 0.5, img: "https://iili.io/fpaNSSI.gif", color: "#5c5c5c", rarity: "Secret", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/rahh-skeletons-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Do you know da wae", chance: 0.5, img: "https://iili.io/fy9WysS.gif", color: "#5c5c5c", rarity: "Secret", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/do-you-know-the-way-%5BAudioTrimmer.com%5D.mp3"},
  { name: "RickRoll", chance: 0.5, img: "https://iili.io/fywJtAg.gif", color: "#5c5c5c", rarity: "Secret", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/epic-%5BAudioTrimmer.com%5D.mp3"},
  { name: "Oie oie eye eye", chance: 0.5, img: "https://iili.io/q24wsRa.gif", color: "#5c5c5c", rarity: "Secret", sound: "https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/oi-oi-oe-oi-a-eye-eye-%5BAudioTrimmer.com%5D.mp3"},
];

const ADMIN_EMAILS = [
  "r2ftzu1ha2vy@gmail.com",
  "muhamad_afif_rayyan_danial@students.edu.sg",
];

const DEFAULT_UPGRADES = { luck: 0, quickRollUnlocked: false, inventoryLimit: 50 };
const DEFAULT_STATS = { totalRolls: 0, memes: {}, rarities: {} };

// Upgrade-related stats
let upgrades = { ...DEFAULT_UPGRADES };

let isAdmin = false;
let quickRoll = false;
let stats = { ...DEFAULT_STATS };
let usedCodes = {};

const REDEEM_CODES = {
  "RELEASE": { meme: "Gigachad", amount: 1 },
  "BETA": { meme: "Derpy Squarepants", amount: 1 },
};

// DOM elements
const button = document.getElementById("rngButton");
const memeImg = document.getElementById("memeImg");
const result = document.getElementById("result");
const cooldownFill = document.getElementById("cooldownFill");
const inventoryEl = document.getElementById("inventory");
const flash = document.getElementById("flash");
const rollBox = document.getElementById("rollBox");
const adminToggleBtn = document.getElementById("adminToggleBtn");
const adminPanelWrapper = document.getElementById("adminPanelWrapper");

adminToggleBtn.onclick = () => {
  adminPanelWrapper.classList.toggle("open");
};

const authForm = document.getElementById("authForm");
const userInfo = document.getElementById("userInfo");
const welcome = document.getElementById("welcome");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const deleteBtn = document.getElementById("deleteBtn");
const usernameInput = document.getElementById("usernameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

let currentUserId = null;
let currentUser = null;
let currentEmail = null;

const rollLoopSound = new Audio("https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/matthewvakaliuk73627-mouse-click-290204-%5BAudioTrimmer.com%5D.mp3");
rollLoopSound.loop = true;
rollLoopSound.volume = 0.6;

const rollEndSound = new Audio("https://raw.githubusercontent.com/r2ftzu1ha2vy-glitch/Meme-Rng/main/floraphonic-tada-military-1-183974.mp3");
rollEndSound.volume = 0.7;

const rarityEl = document.createElement("div");
rarityEl.style.fontWeight = "bold";
rarityEl.style.marginBottom = "6px";
rollBox.insertBefore(rarityEl, memeImg);

const COOLDOWN = 4000;
let locked = false;
let inventory = {};
let placedMemes = [];
let selectedMeme = null;
let previewImg = null;

// Cursors so we only ever apply each broadcast message/meme once (fixes the
// old "re-shows every 5s forever" and "duplicates meme every 5s" bugs).
let lastSeenMessageTs = 0;
let lastSeenMemeTs = 0;

let dragging = null;
let offset = { x: 0, y: 0 };

// Live listeners for global broadcasts, torn down on logout so a signed-out
// user never keeps receiving another account's realtime updates.
let unsubscribeMessages = null;
let unsubscribeMemes = null;

// ========== AUTH STATE ==========
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    handleSignedOut();
    return;
  }

  currentEmail = user.email;
  currentUserId = user.uid;
  isAdmin = ADMIN_EMAILS.includes(currentEmail);

  let data = null;
  try {
    const snap = await get(ref(db, "users/" + currentUserId));
    data = snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error("Failed to load user data:", err);
  }

  currentUser = data?.username || user.displayName || "User";

  authForm.style.display = "none";
  userInfo.style.display = "block";

  welcome.textContent = isAdmin
    ? `👑 ADMIN ${currentUser}`
    : `👋 ${currentUser} [${currentUserId}]`;

  if (isAdmin) {
    enableAdminPanel();
    enableGlobalAdminPanel();
    adminToggleBtn.style.display = "block";
  }

  loadUserData(data);
  listenForGlobalUpdates();
});

function restorePlacedMemes() {
  document.querySelectorAll("[data-id]").forEach(e => e.remove());

  placedMemes.forEach(data => {
    const { wrap, img } = createPlacedImg(data);
    document.body.appendChild(wrap);

    // 🔊 Desktop double-click
    img.addEventListener("dblclick", e => {
      e.stopPropagation();
      const meme = memes.find(m => m.name === data.name);
      if (!meme?.sound) return;

      const audio = new Audio(meme.sound);
      audio.volume = 0.9;
      playSound(audio);
    });

    // 📱 Mobile double-tap
    let lastTap = 0;
    img.addEventListener("touchend", e => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        e.stopPropagation();

        const meme = memes.find(m => m.name === data.name);
        if (!meme?.sound) return;

        const audio = new Audio(meme.sound);
        audio.volume = 0.9;
        playSound(audio);
      }
      lastTap = now;
    });
  });
}

function buildUserRecord() {
  return {
    username: currentUser,
    inventory,
    placedMemes,
    stats,
    upgrades,
    usedCodes,
    lastSeenMessageTs,
    lastSeenMemeTs
  };
}

let saveTimeout = null;
function saveUserData() {
  if (!currentUserId) return;

  // Debounce so rapid actions (dragging, deleting, redeeming) don't fire a
  // write per event — the last write within 300ms wins.
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    set(ref(db, "users/" + currentUserId), buildUserRecord())
      .catch(err => console.error("Failed to save user data:", err));
  }, 300);
}

function rollingAnimation(finalMeme) {
  let delay = 50;        // start FAST
  let maxDelay = 380;   // end SLOW
  let steps = 18;       // how many slowdowns
  let step = 0;

  function tick() {
    const temp = memes[Math.floor(Math.random() * memes.length)];

    memeImg.src = temp.img;
    result.textContent = temp.name;
    result.style.color = temp.color;
    rarityEl.textContent = temp.rarity;

    // 🔊 slow down sound pitch
    rollLoopSound.playbackRate = 1.4 - (step / steps) * 0.7;

    step++;

    if (step < steps) {
      delay += (maxDelay - delay) / (steps - step);
      setTimeout(tick, delay);
    } else {
      finishRoll(finalMeme);
    }
  }

  tick();
}

// ========== RNG ==========
function rollRNG() {
  const totalChance = memes.reduce((sum, m) => {
    let chance = m.chance;
    if (["Epic", "Legendary", "Secret"].includes(m.rarity)) {
      chance *= 1 + upgrades.luck * 0.1;
    }
    return sum + chance;
  }, 0);

  let r = Math.random() * totalChance;
  let sum = 0;

  for (let m of memes) {
    let chance = m.chance;

    // Luck boost
    if (["Epic", "Legendary", "Secret"].includes(m.rarity)) {
      chance *= 1 + upgrades.luck * 0.1; // +10% per luck level
    }

    sum += chance;
    if (r <= sum) return m;
  }

  return memes[memes.length - 1];
}

function playSound(audio) {
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ========== COOLDOWN ==========
function startCooldown() {
  locked = true;
  button.classList.add("disabled");
  cooldownFill.style.transition = "none";
  cooldownFill.style.width = "100%";

  setTimeout(() => {
    cooldownFill.style.transition = `width ${COOLDOWN}ms linear`;
    cooldownFill.style.width = "0%";
  }, 10);

  setTimeout(() => {
    locked = false;
    button.classList.remove("disabled");
  }, COOLDOWN);
}
function getTotalInventoryCount() {
  return Object.values(inventory)
    .map(x => Number(x) || 0) // ensure all values are numbers
    .reduce((a, b) => a + b, 0);
}

// ========== INVENTORY ==========
function updateInventory() {
  inventoryEl.innerHTML = "";

  for (let name in inventory) {
    const row = document.createElement("div");
    row.className = "inv-item";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.gap = "6px";

    const label = document.createElement("span");
    label.textContent = `${name} [${inventory[name]}x]`;
    label.style.flex = "1";

    const del = document.createElement("button");
    del.textContent = "−";
    del.style.width = "26px";
    del.style.height = "26px";
    del.style.border = "none";
    del.style.borderRadius = "4px";
    del.style.background = "#ff4d4d";
    del.style.color = "white";
    del.style.fontWeight = "bold";
    del.style.cursor = "pointer";

    // Single click handler (works for touch too, via the browser's
    // synthesized click) — fixes the old bug where touchstart AND click
    // both fired and decremented inventory twice per tap on mobile.
    del.addEventListener("click", e => {
      e.stopPropagation();
      inventory[name]--;
      if (inventory[name] <= 0) delete inventory[name];
      updateInventory();
      updateUpgradeButtons?.();
      refreshUpgradesUI?.();
    });

    row.append(label, del);
    inventoryEl.appendChild(row);
  }

  makeInventorySelectable();
  saveUserData();
}

// ========== FLASH ==========
function screenFlash() {
  flash.classList.add("flash");
  setTimeout(() => flash.classList.remove("flash"), 300);
}

button.addEventListener("click", () => {
  if (locked) return;
  if (!currentUserId) {
    alert("Please sign in first!");
    return;
  }

  startCooldown();

  const final = rollRNG();

  if (quickRoll) {
    finishRoll(final);
  } else {
    playSound(rollLoopSound);
    rollingAnimation(final);
  }
});

function finishRoll(final) {
  stats.totalRolls++;
  stats.memes[final.name] = (stats.memes[final.name] || 0) + 1;
  stats.rarities[final.rarity] = (stats.rarities[final.rarity] || 0) + 1;

  rollLoopSound.pause();
  rollLoopSound.currentTime = 0;
  rollLoopSound.playbackRate = 1.4;

  playSound(rollEndSound);

  // Calculate inventory including this new meme
  const totalItems = getTotalInventoryCount() + 1;

  if (totalItems > upgrades.inventoryLimit) {
    showFloatingText("📦 Inventory full — meme discarded!", "#ff757c");
  } else {
    // Add meme safely
    inventory[final.name] = (Number(inventory[final.name]) || 0) + 1;
    updateInventory();
  }

  // Rare flash
  if (["Epic", "Legendary"].includes(final.rarity)) {
    screenFlash();
  }

  if (final.rarity === "Secret") {
    // Secret memes: show via star animation
    playStarReveal(final);
  } else {
    // Normal display
    memeImg.src = final.img;
    result.textContent = final.name;
    result.style.color = final.color;
    rarityEl.textContent = final.rarity;

    if (final.sound) {
      const memeSound = new Audio(final.sound);
      memeSound.volume = 0.9;
      playSound(memeSound);
    }
  }

  updateStatsUI();
  saveUserData();
}

function makeInventorySelectable() {
  document.querySelectorAll(".inv-item").forEach(item => {
    item.onclick = () => {
      const name = item.querySelector("span").textContent.split(" [")[0];
      selectedMeme = name; // store name only

      document.querySelectorAll(".inv-item").forEach(i => i.style.background = "");
      item.style.background = "#4caf50";

      // show preview
      previewImg?.remove();
      const memeObj = memes.find(m => m.name === selectedMeme);
      if (!memeObj) return;

      previewImg = document.createElement("img");
      previewImg.src = memeObj.img;
      previewImg.style.position = "absolute";
      previewImg.style.width = "100px";
      previewImg.style.pointerEvents = "none";
      previewImg.style.zIndex = "999";
      previewImg.style.touchAction = "none";
      document.body.appendChild(previewImg);
    };
  });
}

// ========== PREVIEW FOLLOW ==========
document.addEventListener("mousemove", movePreview);
document.addEventListener("touchmove", e => movePreview(e.touches[0]), { passive: false });

function movePreview(e) {
  if (!previewImg) return;
  const rect = previewImg.getBoundingClientRect();
  previewImg.style.left = e.pageX - rect.width / 2 + "px";
  previewImg.style.top = e.pageY - rect.height / 2 + "px";
}

// ========== PLACE MEME ==========
document.addEventListener("click", placeMeme);
document.addEventListener("touchend", e => placeMeme(e.changedTouches[0]));

function placeMeme(e) {
  if (!selectedMeme) return;

  const x = e.pageX || (e.touches && e.touches[0].pageX);
  const y = e.pageY || (e.touches && e.touches[0].pageY);
  if (!x || !y) return;

  if (e.target.closest("[data-id]")) return;
  if (e.target.closest(".inv-item")) return;

  // remove preview
  if (previewImg) {
    previewImg.remove();
    previewImg = null;
  }

  const memeObj = memes.find(m => m.name === selectedMeme);
  if (!memeObj) return;

  const data = {
    id: crypto.randomUUID(),
    name: memeObj.name,
    img: memeObj.img,
    x: x - 50,
    y: y - 50
  };

  placedMemes.push(data);
  const { wrap } = createPlacedImg(data);
  document.body.appendChild(wrap);

  // Decrement inventory for both normal users AND admins
  if (inventory[memeObj.name]) {
    inventory[memeObj.name]--;
    if (inventory[memeObj.name] <= 0) delete inventory[memeObj.name];
  }

  selectedMeme = null;
  updateInventory(); // removes the button if count is 0
  saveUserData();
}

// ========== CREATE PLACED MEME ==========
function createPlacedImg(data) {
  const wrap = document.createElement("div");
  wrap.style.position = "absolute";
  wrap.style.left = data.x + "px";
  wrap.style.top = data.y + "px";
  wrap.style.width = "100px";
  wrap.style.height = "100px";
  wrap.style.zIndex = "998";
  wrap.dataset.id = data.id;

  const img = document.createElement("img");
  img.src = data.img;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.touchAction = "none";

  const del = document.createElement("button");
  del.textContent = "✖";
  del.style.position = "absolute";
  del.style.top = "2px";
  del.style.right = "2px";
  del.style.background = "red";
  del.style.color = "white";
  del.style.border = "none";
  del.style.borderRadius = "50%";
  del.style.width = "28px";
  del.style.height = "28px";

  del.onclick = e => {
    e.stopPropagation();
    placedMemes = placedMemes.filter(m => m.id !== data.id);
    wrap.remove();
    saveUserData();
  };

  wrap.append(img, del);
  makeDraggable(wrap);

  return { wrap, img };
}

// ========== DRAG ==========
function makeDraggable(el) {
  const start = e => {
    if (dragging) return;
    const p = e.touches ? e.touches[0] : e;
    dragging = el;
    offset.x = p.pageX - el.offsetLeft;
    offset.y = p.pageY - el.offsetTop;
    e.preventDefault();
  };

  const move = e => {
    if (dragging !== el) return;
    const p = e.touches ? e.touches[0] : e;
    el.style.left = p.pageX - offset.x + "px";
    el.style.top = p.pageY - offset.y + "px";
  };

  const end = () => {
    if (dragging !== el) return;
    const data = placedMemes.find(m => m.id === el.dataset.id);
    if (data) {
      data.x = parseInt(el.style.left);
      data.y = parseInt(el.style.top);
      saveUserData();
    }
    dragging = null;
  };

  el.addEventListener("mousedown", start);
  el.addEventListener("touchstart", start, { passive: false });
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move, { passive: false });
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

function loadUserData(data) {
  if (!data) {
    inventory = {};
    placedMemes = [];
    stats = { ...DEFAULT_STATS, memes: {}, rarities: {} };
    upgrades = { ...DEFAULT_UPGRADES };
    usedCodes = {};
    // Brand-new account: don't retroactively apply old broadcasts.
    lastSeenMessageTs = Date.now();
    lastSeenMemeTs = Date.now();
  } else {
    inventory = data.inventory || {};
    placedMemes = data.placedMemes || [];
    stats = data.stats || { ...DEFAULT_STATS };
    upgrades = data.upgrades || { ...DEFAULT_UPGRADES };
    usedCodes = data.usedCodes || {};
    lastSeenMessageTs = data.lastSeenMessageTs || Date.now();
    lastSeenMemeTs = data.lastSeenMemeTs || Date.now();
  }

  quickRollBtn.disabled = !upgrades.quickRollUnlocked;

  updateInventory();
  restorePlacedMemes();
  updateStatsUI();
  refreshUpgradesUI();
  updateUpgradeButtons();
}

// ========== LOGIN / SIGN UP ==========
loginBtn.onclick = async () => {
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    // TRY SIGN IN first
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles the rest — no page reload needed.
  } catch (signInErr) {
    const noAccount = [
      "auth/user-not-found",
      "auth/invalid-credential",
      "auth/invalid-login-credentials"
    ].includes(signInErr.code);

    if (!noAccount) {
      alert(signInErr.message);
      return;
    }

    // SIGN UP
    if (!username) {
      alert("Enter a username to create a new account");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });

      const initialData = {
        username,
        inventory: {},
        placedMemes: [],
        stats: { ...DEFAULT_STATS },
        upgrades: { ...DEFAULT_UPGRADES },
        usedCodes: {},
        lastSeenMessageTs: Date.now(),
        lastSeenMemeTs: Date.now()
      };

      await set(ref(db, "users/" + cred.user.uid), initialData);
      // onAuthStateChanged fires automatically after sign-up.
    } catch (signUpErr) {
      alert(signUpErr.message);
    }
  }
};

// ========== LOGOUT ==========
logoutBtn.onclick = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
};

// ========== RESET ACCOUNT (clears cloud progress) ==========
deleteBtn.onclick = async () => {
  const confirmDelete = confirm("Are you sure you want to reset your account? This will clear all your progress.");
  if (!confirmDelete) return;
  if (!currentUserId) return;

  const fresh = {
    username: currentUser,
    inventory: {},
    placedMemes: [],
    stats: { ...DEFAULT_STATS },
    upgrades: { ...DEFAULT_UPGRADES },
    usedCodes: {},
    lastSeenMessageTs: Date.now(),
    lastSeenMemeTs: Date.now()
  };

  try {
    await set(ref(db, "users/" + currentUserId), fresh);
    loadUserData(fresh);
    alert("Your account has been reset.");
  } catch (err) {
    console.error(err);
    alert("Failed to reset account.");
  }
};

// ========== UI RESET ON SIGN-OUT ==========
function handleSignedOut() {
  if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
  if (unsubscribeMemes) { unsubscribeMemes(); unsubscribeMemes = null; }

  inventory = {};
  placedMemes = [];
  selectedMeme = null;
  currentUser = null;
  currentEmail = null;
  currentUserId = null;
  isAdmin = false;
  stats = { ...DEFAULT_STATS };
  upgrades = { ...DEFAULT_UPGRADES };
  usedCodes = {};

  document.querySelectorAll("[data-id]").forEach(e => e.remove());
  inventoryEl.innerHTML = "";
  updateStatsUI();

  authForm.style.display = "block";
  userInfo.style.display = "none";
  adminToggleBtn.style.display = "none";
  adminPanelWrapper.classList.remove("open");
}

function enableAdminPanel() {
  const panel = document.getElementById("adminPanel");
  const select = document.getElementById("adminMemeSelect");
  const spawnBtn = document.getElementById("spawnMemeBtn");

  panel.style.display = "block";

  // fill dropdown
  select.innerHTML = "";
  memes.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = `${m.name} (${m.rarity})`;
    select.appendChild(opt);
  });

  spawnBtn.onclick = () => {
    const meme = memes.find(m => m.name === select.value);
    if (!meme) return;

    inventory[meme.name] = (inventory[meme.name] || 0) + 1;
    updateInventory();
    showFloatingText(`Spawned ${meme.name}!`, meme.color);
  };
}

document.getElementById("redeemBtn").onclick = () => {
  const code = document.getElementById("codeInput").value.trim().toUpperCase();
  const status = document.getElementById("codeStatus");

  if (!currentUserId) {
    status.textContent = "❌ Please sign in first";
    return;
  }

  if (!REDEEM_CODES[code]) {
    status.textContent = "❌ Invalid code";
    return;
  }

  if (usedCodes[code]) {
    status.textContent = "⚠️ Code already used";
    return;
  }

  const reward = REDEEM_CODES[code];
  inventory[reward.meme] = (inventory[reward.meme] || 0) + reward.amount;

  usedCodes[code] = true;

  updateInventory();
  status.textContent = `✅ Received ${reward.meme}!`;
};

function showFloatingText(message, color = "#fff") {
  const text = document.createElement("div");
  text.textContent = message;
  text.style.position = "fixed";
  text.style.top = "20px";
  text.style.left = "50%";
  text.style.transform = "translateX(-50%)";
  text.style.padding = "10px 20px";
  text.style.background = "rgba(0,0,0,0.7)";
  text.style.color = color;
  text.style.fontWeight = "bold";
  text.style.fontSize = "16px";
  text.style.borderRadius = "8px";
  text.style.zIndex = "9999";
  text.style.opacity = "0";
  text.style.transition = "all 0.6s ease";

  document.body.appendChild(text);

  // Animate down & fade in
  requestAnimationFrame(() => {
    text.style.top = "50px";
    text.style.opacity = "1";
  });

  // After 1s, animate up & fade out
  setTimeout(() => {
    text.style.top = "0px";
    text.style.opacity = "0";
    text.addEventListener("transitionend", () => text.remove());
  }, 1000);
}

const quickRollBtn = document.getElementById("quickRollBtn");

quickRollBtn.onclick = () => {
  if (quickRollBtn.disabled) return;
  quickRoll = !quickRoll;
  quickRollBtn.textContent = quickRoll
    ? "⚡ Quick Roll: ON"
    : "⚡ Quick Roll: OFF";
};

const statsPanel = document.getElementById("statsPanel");
const statsToggle = document.getElementById("statsToggle");

statsToggle.addEventListener("click", () => {
  statsPanel.classList.toggle("open");
});

const statsContent = document.getElementById("statsContent");

function updateStatsUI() {
  if (!statsContent) return;

  let html = `<b>Total Rolls:</b> ${stats.totalRolls}<br><br>`;

  html += "<b>Memes:</b><br>";
  for (let m in stats.memes) {
    html += `• ${m}: ${stats.memes[m]}<br>`;
  }

  html += "<br><b>Rarities:</b><br>";
  for (let r in stats.rarities) {
    html += `• ${r}: ${stats.rarities[r]}<br>`;
  }

  statsContent.innerHTML = html;
}

function enableGlobalAdminPanel() {
  const panel = document.getElementById("globalAdminPanel");
  const messageInput = document.getElementById("globalMessageInput");
  const sendBtn = document.getElementById("sendGlobalMessageBtn");
  const memeSelect = document.getElementById("globalMemeSelect");
  const giveBtn = document.getElementById("giveGlobalMemeBtn");
  const status = document.getElementById("globalAdminStatus");

  panel.style.display = "block";

  // Fill meme dropdown
  memeSelect.innerHTML = "";
  memes.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = `${m.name} (${m.rarity})`;
    memeSelect.appendChild(opt);
  });

  // Send global message
  sendBtn.onclick = async () => {
    const message = messageInput.value.trim();
    if (!message) return;
    try {
      await push(ref(db, "globalMessages"), {
        message,
        sender: currentEmail,
        timestamp: Date.now()
      });
      status.textContent = "✅ Message sent globally!";
      messageInput.value = "";
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Failed to send message.";
    }
  };

  // Give meme to all users
  giveBtn.onclick = async () => {
    const memeName = memeSelect.value;
    const meme = memes.find(m => m.name === memeName);
    if (!meme) return;

    try {
      await push(ref(db, "globalMemes"), {
        memeName,
        sender: currentEmail,
        amount: 1,
        timestamp: Date.now()
      });
      status.textContent = `✅ ${memeName} given to all users!`;
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Failed to give meme globally.";
    }
  };
}

function showGlobalMessage(text) {
  let container = document.getElementById("globalMessageContainer");

  // 🔧 Auto-create if missing
  if (!container) {
    container = document.createElement("div");
    container.id = "globalMessageContainer";
    document.body.appendChild(container);
  }

  const msg = document.createElement("div");
  msg.className = "global-message";
  msg.textContent = "🌐 " + text;

  container.appendChild(msg);

  setTimeout(() => {
    msg.classList.add("fade-out");
    msg.addEventListener("animationend", () => msg.remove());
  }, 5000);
}

// ========== REALTIME GLOBAL BROADCASTS ==========
// Replaces the old 5-second polling loop. Each listener only fires for
// entries newer than the last one this account has already processed
// (lastSeenMessageTs / lastSeenMemeTs), so messages are shown exactly once
// and global memes are credited exactly once — fixing the old bug where
// every 5-second poll re-showed every message and re-added every meme.
function listenForGlobalUpdates() {
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribeMemes) unsubscribeMemes();

  const messagesQuery = query(
    ref(db, "globalMessages"),
    orderByChild("timestamp"),
    startAt(lastSeenMessageTs + 1)
  );

  unsubscribeMessages = onChildAdded(messagesQuery, snap => {
    const msg = snap.val();
    if (!msg) return;
    showGlobalMessage(msg.message);
    if (msg.timestamp > lastSeenMessageTs) {
      lastSeenMessageTs = msg.timestamp;
      saveUserData();
    }
  });

  const memesQuery = query(
    ref(db, "globalMemes"),
    orderByChild("timestamp"),
    startAt(lastSeenMemeTs + 1)
  );

  unsubscribeMemes = onChildAdded(memesQuery, snap => {
    const gm = snap.val();
    if (!gm) return;
    inventory[gm.memeName] = (inventory[gm.memeName] || 0) + gm.amount;
    updateInventory();
    showFloatingText(`🌐 Received ${gm.memeName}!`, "#4dff88");
    if (gm.timestamp > lastSeenMemeTs) {
      lastSeenMemeTs = gm.timestamp;
      saveUserData();
    }
  });
}

const upgradeStatus = document.getElementById("upgradeStatus");
const upgradeLuckBtn = document.getElementById("upgradeLuckBtn");
const unlockQuickRollBtn = document.getElementById("unlockQuickRollBtn");
const upgradeInventoryBtn = document.getElementById("upgradeInventoryBtn");

// Upgrade Luck
upgradeLuckBtn.onclick = () => {
  if (upgrades.luck >= 10) return;

  const eligible = memes.filter(m =>
    ["Epic", "Legendary", "Secret"].includes(m.rarity)
  );

  let total = 0;
  eligible.forEach(m => total += inventory[m.name] || 0);

  if (total < 2) {
    upgradeStatus.textContent = "❌ Need 2 Epic+ memes";
    return;
  }

  let consume = 2;
  for (let m of eligible) {
    const count = inventory[m.name] || 0;
    const used = Math.min(count, consume);
    inventory[m.name] -= used;
    if (inventory[m.name] <= 0) delete inventory[m.name];
    consume -= used;
    if (consume <= 0) break;
  }

  upgrades.luck++;
  upgradeStatus.textContent = `🍀 Luck upgraded → ${upgrades.luck}`;

  updateInventory();
  saveUserData();
  refreshUpgradesUI();
};

unlockQuickRollBtn.onclick = () => {
  if (upgrades.quickRollUnlocked) return;

  if ((inventory["Gigachad"] || 0) < 1) {
    upgradeStatus.textContent = "❌ Need 1 Gigachad";
    return;
  }

  inventory["Gigachad"]--;
  if (inventory["Gigachad"] <= 0) delete inventory["Gigachad"];

  upgrades.quickRollUnlocked = true;
  quickRollBtn.disabled = false;

  upgradeStatus.textContent = "⚡ Quick Roll unlocked!";

  updateInventory();
  saveUserData();
  refreshUpgradesUI();
};

upgradeInventoryBtn.onclick = () => {
  if (upgrades.inventoryLimit >= 250) return;

  if ((inventory["Pepe"] || 0) < 3) {
    upgradeStatus.textContent = "❌ Need 3 Pepe";
    return;
  }

  inventory["Pepe"] -= 3;
  if (inventory["Pepe"] <= 0) delete inventory["Pepe"];

  upgrades.inventoryLimit += 5;
  upgradeStatus.textContent =
    `📦 Inventory limit → ${upgrades.inventoryLimit}`;

  updateInventory();
  saveUserData();
  refreshUpgradesUI();
};

// Quick Roll starts disabled until upgrades load in loadUserData()
quickRollBtn.disabled = true;

function updateUpgradeButtons() {
  // Luck requires 2 Epic+
  const epicPlusCount = memes
    .filter(m => ["Epic", "Legendary", "Secret"].includes(m.rarity))
    .reduce((s, m) => s + (inventory[m.name] || 0), 0);
  upgradeLuckBtn.disabled = epicPlusCount < 2;

  // Quick Roll requires 1 Gigachad and not already unlocked
  unlockQuickRollBtn.disabled = (inventory["Gigachad"] || 0) < 1 || upgrades.quickRollUnlocked;

  // Inventory upgrade requires 3 Pepe
  upgradeInventoryBtn.disabled = (inventory["Pepe"] || 0) < 3;
}

function refreshUpgradesUI() {
  // QUICK ROLL
  unlockQuickRollBtn.style.display =
    upgrades.quickRollUnlocked ? "none" : "block";
  unlockQuickRollBtn.disabled =
    upgrades.quickRollUnlocked || (inventory["Gigachad"] || 0) < 1;

  quickRollBtn.disabled = !upgrades.quickRollUnlocked;

  // LUCK
  upgradeLuckBtn.style.display =
    upgrades.luck >= 5 ? "none" : "block";

  const epicPlusCount = memes
    .filter(m => ["Epic", "Legendary", "Secret"].includes(m.rarity))
    .reduce((s, m) => s + (inventory[m.name] || 0), 0);

  upgradeLuckBtn.disabled = epicPlusCount < 2;

  // INVENTORY LIMIT
  upgradeInventoryBtn.style.display =
    upgrades.inventoryLimit >= 100 ? "none" : "block";

  upgradeInventoryBtn.disabled = (inventory["Pepe"] || 0) < 3;
}

function playStarReveal(meme) {
  const overlay = document.getElementById("starOverlay");
  const glow = document.getElementById("starGlow");
  const star = document.getElementById("starReveal");

  overlay.style.display = "flex";

  // Reset stars
  glow.style.animation = "none";
  star.style.animation = "none";
  glow.style.transform = "scale(0.2) rotate(0deg)";
  star.style.transform = "scale(0.2) rotate(0deg)";
  void glow.offsetWidth; // force reflow

  // Start animation
  glow.style.animation = "starGrowSpin 7.5s linear forwards";
  star.style.animation = "starGrowSpin 7.5s linear forwards";

  // Flash + reveal meme near end
  setTimeout(() => {
    screenFlash();
    revealMemeAfterStar(meme);
  }, 7300);

  // Remove overlay after animation
  star.onanimationend = () => {
    glow.style.animation = "none";
    star.style.animation = "none";
    glow.style.transform = "scale(0.2) rotate(0deg)";
    star.style.transform = "scale(0.2) rotate(0deg)";
    overlay.style.display = "none";
  };
}

function revealMemeAfterStar(meme) {
  memeImg.src = meme.img;
  result.textContent = meme.name;
  result.style.color = meme.color;
  rarityEl.textContent = meme.rarity;

  if (meme.sound) {
    const a = new Audio(meme.sound);
    a.volume = 0.9;
    playSound(a); // ✅ plays once
  }
}

document.addEventListener("keydown", e => {
  if (e.key !== "=") return;
  if (!isAdmin) return;

  const pool = memes.filter(m =>
    ["Epic", "Legendary", "Secret"].includes(m.rarity)
  );

  const meme = pool[Math.floor(Math.random() * pool.length)];

  playStarReveal(meme);
});

const upgradeWrapper = document.getElementById("upgradeWrapper");
const upgradeToggle = document.getElementById("upgradeToggle");

let upgradesOpen = true;

upgradeToggle.onclick = () => {
  upgradesOpen = !upgradesOpen;
  upgradeWrapper.classList.toggle("closed", !upgradesOpen);
  upgradeToggle.textContent = upgradesOpen ? "<" : ">";
};
