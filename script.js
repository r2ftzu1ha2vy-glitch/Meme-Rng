import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://ndqiwftuzyoseibkwdnk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcWl3ZnR1enlvc2VpYmt3ZG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTM0NDAsImV4cCI6MjA4NjIyOTQ0MH0.RwAs1c9hduHa1rbK22K5o6YljabFwyTzOBkdiBjYIwo"
);

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
  "yeo_wayne@students.edu.sg",
  "muhamad_afif_rayyan_danial@students.edu.sg",
];

// Upgrade-related stats
let upgrades = {
  luck: 0,                 // affects rare meme chances
  quickRollUnlocked: false, // allows Quick Roll toggle
  inventoryLimit: 50       // starting inventory limit
};

let isAdmin = false;
let quickRoll = false;
let stats = {
  totalRolls: 0,
  memes: {},      // { "Bruh": 12 }
  rarities: {}    // { "Common": 20 }
};

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
let currentUserId = null; // new variable to track user ID

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
let currentUser = null;
let currentEmail = null;

let dragging = null;
let offset = { x: 0, y: 0 };

supabase.auth.onAuthStateChange((event, session) => {
  if (!session?.user) return;

  currentEmail = session.user.email;
  isAdmin = ADMIN_EMAILS.includes(currentEmail);


  const data = JSON.parse(localStorage.getItem("memeUser_" + currentEmail)) || {};
  currentUser = data.username || "User";
  currentUserId = data.userId || crypto.randomUUID();

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

  loadUserData();
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

function saveUserData() {
  if (!currentEmail) return;

  const data = {
    userId: currentUserId,
    username: currentUser,
    inventory,
    placedMemes,
    stats,
    upgrades // <--- save upgrades too
  };

  localStorage.setItem("memeUser_" + currentEmail, JSON.stringify(data));
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
  const totalChance = memes.reduce((sum, m) => sum + m.chance, 0);
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

    del.addEventListener("click", e => {
      e.stopPropagation();
      inventory[name]--;
      if (inventory[name] <= 0) delete inventory[name];
      updateInventory();
    });

    del.addEventListener("touchstart", e => {
      e.preventDefault();
      e.stopPropagation();
      inventory[name]--;
      if (inventory[name] <= 0) delete inventory[name];
      updateInventory();
      updateUpgradeButtons?.(); // if exists
      refreshUpgradesUI();
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
function loadUserData() {
  if (!currentEmail) return;

  const data = JSON.parse(localStorage.getItem("memeUser_" + currentEmail));
  if (!data) return;

  currentUserId = data.userId || crypto.randomUUID();
  currentUser = data.username || "User";

  inventory = data.inventory || {};
  placedMemes = data.placedMemes || [];
  stats = data.stats || { totalRolls: 0, memes: {}, rarities: {} };

  upgrades = data.upgrades || {
    luck: 0,
    quickRollUnlocked: false,
    inventoryLimit: 50
  };

  updateInventory();
  restorePlacedMemes();
  updateStatsUI();
  refreshUpgradesUI();
}

loginBtn.onclick = async () => {
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  // TRY SIGN IN
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!signInError) {
    alert("Login successful! Reloading…");
    location.reload();
    return;
  }

  // SIGN UP
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (signUpError) {
    alert(signUpError.message);
    return;
  }

  currentUserId = crypto.randomUUID();
  currentUser = username;

localStorage.setItem(
  "memeUser_" + email,
  JSON.stringify({
    userId: currentUserId,
    username: currentUser,
    inventory: {},
    placedMemes: [],
    stats: {
      totalRolls: 0,
      memes: {},
      rarities: {}
    }
  })
);
};

// ========== LOGOUT ==========
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  resetLocalData();
};

// ========== DELETE ACCOUNT (local reset) ==========
deleteBtn.onclick = () => {
  const confirmDelete = confirm("Are you sure you want to reset your account? This will clear all your local progress.");
  if (!confirmDelete) return;

  resetLocalData();
  alert("Your local account has been reset. You can now create a new one.");
};

// ========== RESET FUNCTION ==========
function resetLocalData() {
  if (currentEmail) {
    localStorage.removeItem("memeUser_" + currentEmail);
  }

  inventory = {};
  placedMemes = [];
  selectedMeme = null;
  currentUser = null;
  currentEmail = null;

  document.querySelectorAll("[data-id]").forEach(e => e.remove());
  updateInventory();

  authForm.style.display = "block";
  userInfo.style.display = "none";
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
const usedCodesKey = () => "usedCodes_" + currentEmail;

document.getElementById("redeemBtn").onclick = () => {
  const code = document.getElementById("codeInput").value.trim().toUpperCase();
  const status = document.getElementById("codeStatus");

  if (!REDEEM_CODES[code]) {
    status.textContent = "❌ Invalid code";
    return;
  }

  const used = JSON.parse(localStorage.getItem(usedCodesKey())) || [];
  if (used.includes(code)) {
    status.textContent = "⚠️ Code already used";
    return;
  }

  const reward = REDEEM_CODES[code];
  inventory[reward.meme] = (inventory[reward.meme] || 0) + reward.amount;

  used.push(code);
  localStorage.setItem(usedCodesKey(), JSON.stringify(used));

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
      await supabase.from("globalMessages").insert({ message, sender: currentEmail });
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
      await supabase.from("globalMemes").insert({ memeName, sender: currentEmail, amount: 1 });
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

async function checkGlobalUpdates() {
  // Fetch messages
  const { data: messages } = await supabase.from("globalMessages").select("*").order("created_at", { ascending: true });
  messages.forEach(msg => {
  showGlobalMessage(msg.message);
});

  // Fetch memes
  const { data: globalMemes } = await supabase.from("globalMemes").select("*").order("created_at", { ascending: true });
  globalMemes.forEach(gm => {
    inventory[gm.memeName] = (inventory[gm.memeName] || 0) + gm.amount;
  });

  updateInventory();
  console.log("🌐 Global messages:", messages);
}

// Run periodically or on login
setInterval(checkGlobalUpdates, 5000);
checkGlobalUpdates();
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

// Ensure quickRollBtn is enabled/disabled based on saved upgrades
quickRollBtn.disabled = !upgrades.quickRollUnlocked;
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

// Call this whenever inventory changes or on load
updateUpgradeButtons();
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