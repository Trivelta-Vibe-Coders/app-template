const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const vibeMessage = process.env.VIBE_MESSAGE || "";
let globalVibes = 0;
const users = new Map();
let nextId = 1;

const avatarEmojis = ["\u{1F47E}", "\u{1F916}", "\u{1F47B}", "\u{1F435}", "\u{1F431}", "\u{1F436}", "\u{1F984}", "\u{1F409}", "\u{1F419}", "\u{1F985}", "\u{1F9CA}", "\u{1F9D9}"];
const colors = ["#ff6ec7", "#7b68ee", "#00ced1", "#ff4757", "#2ed573", "#ffa502", "#a55eea", "#1e90ff", "#ff6b81", "#7bed9f"];

function broadcast(data, excludeId) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.userId !== excludeId) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  const id = nextId++;
  const color = colors[id % colors.length];
  const emoji = avatarEmojis[id % avatarEmojis.length];
  ws.userId = id;
  users.set(id, { id, color, emoji, x: 0, y: 0 });

  ws.send(JSON.stringify({ type: "init", id, color, emoji, globalVibes, userCount: users.size }));
  broadcast({ type: "user-joined", id, color, emoji, userCount: users.size });

  ws.on("message", (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === "cursor") {
      const u = users.get(id);
      if (u) { u.x = data.x; u.y = data.y; }
      broadcast({ type: "cursor", id, x: data.x, y: data.y, color, emoji }, id);
    } else if (data.type === "click") {
      globalVibes += 10;
      broadcast({ type: "vibe-update", globalVibes, clickerId: id, x: data.x, y: data.y }, null);
    }
  });

  ws.on("close", () => {
    users.delete(id);
    broadcast({ type: "user-left", id, userCount: users.size });
  });
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trivelta Vibe Coders</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  min-height: 100vh;
  background: #0a0a0f;
  font-family: 'Segoe UI', system-ui, sans-serif;
  overflow: hidden;
  cursor: crosshair;
  color: #fff;
}

canvas#bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.content.zen { opacity: 0; pointer-events: none; transition: opacity 0.5s; }

h1 {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 800;
  background: linear-gradient(135deg, var(--c1), var(--c2), var(--c3), var(--c1));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient 4s ease infinite;
  letter-spacing: -1px;
  margin-bottom: 0.5rem;
  transition: all 0.3s;
}

.subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: rgba(255,255,255,0.5);
  font-weight: 300;
  margin-bottom: 2rem;
}

.emoji-float {
  font-size: 1.5rem;
  animation: float 3s ease-in-out infinite;
  display: inline-block;
}

.stats {
  display: flex;
  gap: 1.2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.stat {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1rem 1.4rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  min-width: 100px;
}

.stat:hover {
  border-color: var(--c2-40);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--c2-15);
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 0.2rem;
}

.terminal {
  margin-top: 2rem;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  max-width: 600px;
  text-align: left;
  backdrop-filter: blur(10px);
}

.terminal-bar { display: flex; gap: 6px; margin-bottom: 0.8rem; }
.terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
.terminal-dot:nth-child(1) { background: #ff5f57; }
.terminal-dot:nth-child(2) { background: #febc2e; }
.terminal-dot:nth-child(3) { background: #28c840; }

.terminal-line {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.5);
}

.terminal-line .prompt { color: #28c840; }
.terminal-line .cmd { color: var(--c3); }
.typewriter { display: inline; color: var(--c1); }
.typewriter .cursor {
  display: inline-block; width: 8px; height: 1em;
  background: var(--c1); margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

.click-prompt {
  margin-top: 2rem;
  color: rgba(255,255,255,0.2);
  font-size: 0.8rem;
  animation: pulse 2s ease-in-out infinite;
}

/* Cursors */
.remote-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 20;
  transition: left 0.08s linear, top 0.08s linear;
  font-size: 1.3rem;
  filter: drop-shadow(0 0 6px var(--cursor-color));
}

/* Toasts — positioned below the palette */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.8rem;
}

.toast {
  background: rgba(15,15,25,0.85);
  border: 1px solid rgba(255,255,255,0.1);
  border-left: 3px solid var(--c2);
  border-radius: 12px;
  padding: 0.8rem 1.2rem;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  animation: toast-in 0.4s ease-out;
  min-width: 220px;
}

.toast.leaving { animation: toast-out 0.3s ease-in forwards; }
.toast-icon { font-size: 1.3rem; }
.toast-text { font-size: 0.85rem; color: rgba(255,255,255,0.8); }
.toast-title { font-weight: 700; font-size: 0.8rem; color: var(--c1); }

/* Command Palette — persistent top-right panel */
.palette {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 200;
  background: rgba(10,10,18,0.7);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  width: 240px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  overflow: hidden;
}

.palette-header {
  padding: 0.7rem 0.9rem 0.5rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.25);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.palette-header-icon { font-size: 0.8rem; }

.palette-input {
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: none;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: #fff;
  font-size: 0.8rem;
  padding: 0.6rem 0.9rem;
  outline: none;
  font-family: inherit;
}

.palette-input:focus {
  background: rgba(255,255,255,0.05);
}

.palette-input::placeholder { color: rgba(255,255,255,0.2); font-size: 0.75rem; }

.palette-items {
  max-height: 320px;
  overflow-y: auto;
  padding: 0.3rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.palette-item:hover, .palette-item.active {
  background: rgba(255,255,255,0.06);
}

.palette-item-icon { font-size: 0.9rem; width: 22px; text-align: center; flex-shrink: 0; }
.palette-item-label { font-size: 0.78rem; color: rgba(255,255,255,0.7); }
.palette-item-hint {
  margin-left: auto;
  font-size: 0.6rem;
  color: rgba(255,255,255,0.2);
  font-family: 'SF Mono', monospace;
  flex-shrink: 0;
}

/* Screen flash */
.flash {
  position: fixed; inset: 0; z-index: 50;
  background: var(--c2);
  opacity: 0;
  pointer-events: none;
  animation: flash-anim 0.3s ease-out;
}

/* Particles from clicks */
.particle {
  position: fixed;
  pointer-events: none;
  z-index: 10;
  font-size: 1.5rem;
  animation: particle-fly 1s ease-out forwards;
}

.ripple {
  position: fixed;
  pointer-events: none;
  z-index: 5;
  border: 2px solid var(--c2-50);
  border-radius: 50%;
  animation: ripple-expand 0.8s ease-out forwards;
}

@keyframes gradient { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes particle-fly {
  0%{opacity:1;transform:translate(0,0) scale(1)}
  100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)}
}
@keyframes ripple-expand {
  0%{width:0;height:0;opacity:1}
  100%{width:150px;height:150px;opacity:0}
}
@keyframes toast-in {
  0%{opacity:0;transform:translateX(40px)}
  100%{opacity:1;transform:translateX(0)}
}
@keyframes toast-out {
  0%{opacity:1;transform:translateX(0)}
  100%{opacity:0;transform:translateX(40px)}
}
@keyframes flash-anim {
  0%{opacity:0.25} 100%{opacity:0}
}

:root {
  --c1: #ff6ec7;
  --c2: #7b68ee;
  --c3: #00ced1;
  --c2-40: rgba(123,104,238,0.4);
  --c2-50: rgba(123,104,238,0.5);
  --c2-15: rgba(123,104,238,0.15);
}
</style>
</head>
<body>

<canvas id="bg"></canvas>

<div class="content" id="content">
  <div class="emoji-float" id="vibeEmoji">\u{1F680}</div>
  <h1 id="title">Trivelta Vibe Coders</h1>
  <p class="subtitle">hackathon is live &mdash; go build something awesome</p>
  <div class="stats">
    <div class="stat">
      <div class="stat-value" id="vibes">0</div>
      <div class="stat-label">Your Vibes</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="globalVibes">0</div>
      <div class="stat-label">Global Vibes</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="online">1</div>
      <div class="stat-label">Online</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="clock">00:00:00</div>
      <div class="stat-label">Time on Page</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="clicks">0</div>
      <div class="stat-label">Clicks</div>
    </div>
  </div>
  <div class="terminal" id="terminal" style="display:none">
    <div class="terminal-bar">
      <div class="terminal-dot"></div>
      <div class="terminal-dot"></div>
      <div class="terminal-dot"></div>
    </div>
    <div class="terminal-line"><span class="prompt">$</span> <span class="cmd">railway variable get</span> VIBE_MESSAGE</div>
    <div class="terminal-line"><span class="typewriter"><span id="typewriter-text"></span><span class="cursor"></span></span></div>
  </div>
  <p class="click-prompt">click anywhere to vibe</p>
</div>

<div class="toast-container" id="toasts"></div>

<div class="palette" id="palette">
  <div class="palette-header"><span class="palette-header-icon">\u{26A1}</span> Controls</div>
  <input class="palette-input" id="paletteInput" placeholder="Filter..." autocomplete="off" />
  <div class="palette-items" id="paletteItems"></div>
</div>

<script>
// ── Themes ──
const themes = {
  cyberpunk: { c1:'#ff6ec7', c2:'#7b68ee', c3:'#00ced1', bg:'#0a0a0f', particle:'rgba(123,104,238,0.6)' },
  ocean:    { c1:'#00d2ff', c2:'#3a7bd5', c3:'#00f2fe', bg:'#0a0f1a', particle:'rgba(0,210,255,0.5)' },
  sunset:   { c1:'#ff512f', c2:'#f09819', c3:'#ff6b6b', bg:'#1a0a0f', particle:'rgba(240,152,25,0.5)' },
  matrix:   { c1:'#00ff41', c2:'#20c20e', c3:'#39ff14', bg:'#050a05', particle:'rgba(0,255,65,0.5)' },
};
let currentTheme = 'cyberpunk';

function applyTheme(name) {
  const t = themes[name]; if (!t) return;
  currentTheme = name;
  const r = document.documentElement.style;
  r.setProperty('--c1', t.c1);
  r.setProperty('--c2', t.c2);
  r.setProperty('--c3', t.c3);
  r.setProperty('--c2-40', t.c2 + '66');
  r.setProperty('--c2-50', t.c2 + '80');
  r.setProperty('--c2-15', t.c2 + '26');
  document.body.style.background = t.bg;
}

// ── Sound Engine ──
let soundEnabled = true;
let audioCtx;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

function playNote(freq, duration, volume, type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.3));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (duration || 0.3));
  } catch(e) {}
}

function playClick() {
  const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
  playNote(freq, 0.25, 0.07, 'sine');
  playNote(freq * 2, 0.15, 0.03, 'triangle');
}

function playRemoteClick() {
  playNote(pentatonic[Math.floor(Math.random() * pentatonic.length)], 0.15, 0.02, 'sine');
}

function playAchievement() {
  const base = pentatonic[Math.floor(Math.random() * 3)];
  [0, 100, 200, 300].forEach((delay, i) => {
    setTimeout(() => playNote(base * (1 + i * 0.25), 0.3, 0.06, 'triangle'), delay);
  });
}

// ── Particle System (Canvas) ──
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = 0, mouseY = 0;
let gravityMode = false;
let ultraMode = false;
let ultraTimer = null;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    r: Math.random() * 2 + 1,
    alpha: Math.random() * 0.5 + 0.2,
  };
}

for (let i = 0; i < 90; i++) particles.push(createParticle());

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const t = themes[currentTheme];
  const connectDist = 120;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    if (gravityMode) {
      p.vy += 0.02;
      p.vx *= 0.999;
      if (p.y > canvas.height - p.r) { p.y = canvas.height - p.r; p.vy *= -0.6; }
      if (p.x < p.r || p.x > canvas.width - p.r) p.vx *= -1;
      if (p.y < p.r) { p.y = p.r; p.vy *= -0.6; }
    } else {
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 150 && dist > 0) {
        const force = (150 - dist) / 150 * 0.02;
        p.vx -= (dx / dist) * force;
        p.vy -= (dy / dist) * force;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }

    p.x += p.vx;
    p.y += p.vy;

    let color = t.particle;
    if (ultraMode) {
      const hue = (Date.now() / 10 + i * 20) % 360;
      color = 'hsla(' + hue + ',100%,60%,0.7)';
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = ultraMode ? 15 : 8;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const ddx = p.x - p2.x;
      const ddy = p.y - p2.y;
      const d = Math.sqrt(ddx*ddx + ddy*ddy);
      if (d < connectDist) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        const a = (1 - d / connectDist) * (ultraMode ? 0.3 : 0.12);
        ctx.strokeStyle = ultraMode
          ? 'hsla(' + ((Date.now()/10 + i*10) % 360) + ',100%,60%,' + a + ')'
          : t.particle.replace(/[\\d.]+\\)/, a + ')');
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

function shockwave(sx, sy, force) {
  particles.forEach(p => {
    const dx = p.x - sx;
    const dy = p.y - sy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 200 && dist > 0) {
      const f = (200 - dist) / 200 * (force || 3);
      p.vx += (dx / dist) * f;
      p.vy += (dy / dist) * f;
    }
  });
}

// ── WebSocket ──
let myId = null;
let myColor = '#7b68ee';
const remoteCursors = {};

function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(proto + '//' + location.host);

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.type === 'init') {
      myId = data.id;
      myColor = data.color;
      document.getElementById('globalVibes').textContent = data.globalVibes.toLocaleString();
      document.getElementById('online').textContent = data.userCount;
      checkAchievement('online', data.userCount);
    }

    if (data.type === 'cursor') {
      if (!remoteCursors[data.id]) {
        const el = document.createElement('div');
        el.className = 'remote-cursor';
        el.style.setProperty('--cursor-color', data.color);
        el.textContent = data.emoji;
        document.body.appendChild(el);
        remoteCursors[data.id] = el;
      }
      remoteCursors[data.id].style.left = data.x + 'px';
      remoteCursors[data.id].style.top = data.y + 'px';
    }

    if (data.type === 'vibe-update') {
      document.getElementById('globalVibes').textContent = data.globalVibes.toLocaleString();
      if (data.clickerId !== myId) {
        playRemoteClick();
        flashScreen();
      }
    }

    if (data.type === 'user-joined') {
      document.getElementById('online').textContent = data.userCount;
      checkAchievement('online', data.userCount);
    }

    if (data.type === 'user-left') {
      document.getElementById('online').textContent = data.userCount;
      if (remoteCursors[data.id]) {
        remoteCursors[data.id].remove();
        delete remoteCursors[data.id];
      }
    }
  };

  ws.onclose = () => setTimeout(connectWS, 2000);

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'cursor', x: e.clientX, y: e.clientY }));
    }
  });

  window._ws = ws;
}
connectWS();

// ── Achievements ──
const earned = new Set();
const achievements = [
  { id: 'first-blood',     test: (s) => s.clicks >= 1,                     icon: '\u{1F3AF}', title: 'First Blood',       text: 'Your first click!' },
  { id: 'centurion',       test: (s) => s.vibes >= 100,                    icon: '\u{1F4AF}', title: 'Centurion',          text: '100 personal vibes' },
  { id: 'kilovibe',        test: (s) => s.vibes >= 1000,                   icon: '\u{1F525}', title: 'Kilovibe',           text: '1,000 vibes reached' },
  { id: 'combo-king',      test: (s) => s.combo >= 10,                     icon: '\u{26A1}',  title: 'Combo King',         text: '10 clicks in 2 seconds!' },
  { id: 'social-butterfly', test: (s) => s.onlineCount >= 5,               icon: '\u{1F98B}', title: 'Social Butterfly',   text: '5+ vibers online' },
  { id: 'marathon',        test: (s) => s.elapsed >= 300,                  icon: '\u{23F0}',  title: 'Marathon',           text: '5 minutes strong' },
  { id: 'mega-clicker',    test: (s) => s.clicks >= 100,                   icon: '\u{1F4A5}', title: 'Mega Clicker',       text: '100 clicks!' },
];

const state = { clicks: 0, vibes: 0, combo: 0, onlineCount: 1, elapsed: 0 };
let comboClicks = [];

function checkAchievement(key, val) {
  if (key === 'online') state.onlineCount = val;
  achievements.forEach(a => {
    if (!earned.has(a.id) && a.test(state)) {
      earned.add(a.id);
      showToast(a.icon, a.title, a.text);
      playAchievement();
    }
  });
}

function showToast(icon, title, text) {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<div class="toast-icon">' + icon + '</div><div><div class="toast-title">' + title + '</div><div class="toast-text">' + text + '</div></div>';
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Flash ──
function flashScreen() {
  const f = document.createElement('div');
  f.className = 'flash';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 300);
}

// ── Emojis / Clicks ──
const emojis = ['\u{1F680}', '\u{2728}', '\u{1F525}', '\u{1F3AF}', '\u{26A1}', '\u{1F308}', '\u{1F389}', '\u{1F47E}', '\u{1F3B6}', '\u{1F4A5}', '\u{1F9E0}', '\u{1F916}'];

setInterval(() => {
  document.getElementById('vibeEmoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
}, 2000);

const startTime = Date.now();
setInterval(() => {
  state.elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(state.elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((state.elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(state.elapsed % 60).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m + ':' + s;
  checkAchievement();
}, 1000);

document.addEventListener('click', (e) => {
  if (e.target.closest('.palette')) return;

  state.clicks++;
  state.vibes += 10;
  document.getElementById('clicks').textContent = state.clicks;
  document.getElementById('vibes').textContent = state.vibes.toLocaleString();

  const now = Date.now();
  comboClicks.push(now);
  comboClicks = comboClicks.filter(t => now - t < 2000);
  state.combo = comboClicks.length;

  playClick();
  shockwave(e.clientX, e.clientY, gravityMode ? 5 : 2);
  checkAchievement();

  if (window._ws && window._ws.readyState === 1) {
    window._ws.send(JSON.stringify({ type: 'click', x: e.clientX, y: e.clientY }));
  }

  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (Math.PI * 2 * i) / 6;
    const dist = 60 + Math.random() * 80;
    particle.style.left = e.clientX + 'px';
    particle.style.top = e.clientY + 'px';
    particle.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    particle.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }

  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = (e.clientX - 75) + 'px';
  ripple.style.top = (e.clientY - 75) + 'px';
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 800);
});

// ── Typewriter ──
const vibeMsg = "${vibeMessage.replace(/\\/g, '\\\\').replace(/"/g, '\\\\"').replace(/`/g, '\\\\`').replace(/\\$/g, '\\\\$')}";
if (vibeMsg) {
  const terminal = document.getElementById('terminal');
  terminal.style.display = 'block';
  const target = document.getElementById('typewriter-text');
  let ci = 0;
  setTimeout(() => {
    const typeChar = () => {
      if (ci < vibeMsg.length) {
        target.textContent += vibeMsg[ci];
        ci++;
        setTimeout(typeChar, 50 + Math.random() * 60);
      }
    };
    typeChar();
  }, 800);
}

// ── Command Palette (persistent panel) ──
const paletteEl = document.getElementById('palette');
const paletteInput = document.getElementById('paletteInput');
const paletteItemsEl = document.getElementById('paletteItems');

const commands = [
  { icon: '\u{1F50A}', label: 'Toggle Sound',      hint: '',       action: () => { soundEnabled = !soundEnabled; showToast(soundEnabled ? '\u{1F50A}' : '\u{1F507}', soundEnabled ? 'Sound On' : 'Sound Off', ''); }},
  { icon: '\u{1FA90}', label: 'Toggle Gravity',     hint: '',       action: () => { gravityMode = !gravityMode; showToast(gravityMode ? '\u{1FA90}' : '\u{1F32C}', gravityMode ? 'Gravity On' : 'Float Mode', ''); }},
  { icon: '\u{1F30C}', label: 'Theme: Cyberpunk',   hint: 'default', action: () => { applyTheme('cyberpunk'); showToast('\u{1F30C}', 'Cyberpunk', ''); }},
  { icon: '\u{1F30A}', label: 'Theme: Ocean',       hint: '',       action: () => { applyTheme('ocean'); showToast('\u{1F30A}', 'Ocean', ''); }},
  { icon: '\u{1F305}', label: 'Theme: Sunset',      hint: '',       action: () => { applyTheme('sunset'); showToast('\u{1F305}', 'Sunset', ''); }},
  { icon: '\u{1F7E2}', label: 'Theme: Matrix',      hint: '',       action: () => { applyTheme('matrix'); showToast('\u{1F7E2}', 'Matrix', ''); }},
  { icon: '\u{1F9D8}', label: 'Zen Mode',           hint: '',       action: () => { document.getElementById('content').classList.toggle('zen'); }},
  { icon: '\u{1F504}', label: 'Reset Your Vibes',   hint: '',       action: () => { state.vibes = 0; state.clicks = 0; document.getElementById('vibes').textContent = '0'; document.getElementById('clicks').textContent = '0'; }},
];

function renderPalette(filter) {
  const f = (filter || '').toLowerCase();
  const filtered = commands.filter(c => c.label.toLowerCase().includes(f));
  paletteItemsEl.innerHTML = '';
  filtered.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'palette-item';
    el.innerHTML = '<div class="palette-item-icon">' + c.icon + '</div><div class="palette-item-label">' + c.label + '</div>' + (c.hint ? '<div class="palette-item-hint">' + c.hint + '</div>' : '');
    el.addEventListener('click', (e) => { e.stopPropagation(); c.action(); });
    paletteItemsEl.appendChild(el);
  });
}

renderPalette('');

paletteInput.addEventListener('input', () => renderPalette(paletteInput.value));
paletteInput.addEventListener('click', (e) => e.stopPropagation());

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    paletteInput.focus();
    paletteInput.select();
  }
});

// ── Konami Code ──
const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;

document.addEventListener('keydown', (e) => {
  if (document.activeElement === paletteInput) return;
  if (e.key === konamiSeq[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === konamiSeq.length) {
      konamiIdx = 0;
      activateUltraMode();
    }
  } else {
    konamiIdx = 0;
  }
});

function activateUltraMode() {
  if (ultraMode) return;
  ultraMode = true;
  document.getElementById('title').textContent = '\u{26A1} ULTRA VIBE MODE \u{26A1}';

  for (let i = 0; i < 90; i++) particles.push(createParticle());

  shockwave(canvas.width / 2, canvas.height / 2, 8);
  flashScreen();
  playAchievement();
  showToast('\u{1F308}', 'ULTRA MODE', 'Konami code activated!');

  if (ultraTimer) clearTimeout(ultraTimer);
  ultraTimer = setTimeout(() => {
    ultraMode = false;
    document.getElementById('title').textContent = 'Trivelta Vibe Coders';
    particles.splice(90);
  }, 10000);
}
</script>
</body>
</html>`;

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log("Vibes live on port " + port));
