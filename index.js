const http = require("http");

const vibeMessage = process.env.VIBE_MESSAGE || "";

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
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', system-ui, sans-serif;
      overflow: hidden;
      cursor: crosshair;
    }

    .bg {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(120, 40, 200, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 50%, rgba(0, 200, 200, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, rgba(255, 50, 100, 0.1) 0%, transparent 50%);
      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 2;
      text-align: center;
    }

    h1 {
      font-size: clamp(2.5rem, 8vw, 5rem);
      font-weight: 800;
      background: linear-gradient(135deg, #ff6ec7, #7b68ee, #00ced1, #ff6ec7);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient 4s ease infinite;
      margin-bottom: 0.5rem;
      letter-spacing: -1px;
    }

    .subtitle {
      font-size: clamp(1rem, 3vw, 1.5rem);
      color: rgba(255, 255, 255, 0.5);
      font-weight: 300;
      margin-bottom: 2rem;
    }

    .emoji-rain {
      font-size: clamp(1.2rem, 2vw, 1.5rem);
      animation: float 3s ease-in-out infinite;
      display: inline-block;
    }

    .stats {
      display: flex;
      gap: 2rem;
      margin-top: 2.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .stat {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.2rem 1.8rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .stat:hover {
      border-color: rgba(123, 104, 238, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(123, 104, 238, 0.15);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 0.3rem;
    }

    .click-prompt {
      margin-top: 3rem;
      color: rgba(255, 255, 255, 0.2);
      font-size: 0.85rem;
      animation: pulse 2s ease-in-out infinite;
    }

    .terminal {
      margin-top: 2.5rem;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      max-width: 600px;
      text-align: left;
      backdrop-filter: blur(10px);
    }

    .terminal-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 0.8rem;
    }

    .terminal-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .terminal-dot:nth-child(1) { background: #ff5f57; }
    .terminal-dot:nth-child(2) { background: #febc2e; }
    .terminal-dot:nth-child(3) { background: #28c840; }

    .terminal-line {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.5);
    }

    .terminal-line .prompt {
      color: #28c840;
    }

    .terminal-line .cmd {
      color: #00ced1;
    }

    .terminal-line .val {
      color: #ff6ec7;
    }

    .typewriter {
      display: inline;
      color: #ff6ec7;
    }

    .typewriter .cursor {
      display: inline-block;
      width: 8px;
      height: 1em;
      background: #ff6ec7;
      margin-left: 2px;
      vertical-align: text-bottom;
      animation: blink 1s step-end infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

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
      border: 2px solid rgba(123, 104, 238, 0.5);
      border-radius: 50%;
      animation: ripple-expand 0.8s ease-out forwards;
    }

    @keyframes gradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }

    @keyframes particle-fly {
      0% { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
    }

    @keyframes ripple-expand {
      0% { width: 0; height: 0; opacity: 1; }
      100% { width: 150px; height: 150px; opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="content">
    <div class="emoji-rain" id="vibeEmoji">\\u{1F680}</div>
    <h1>Trivelta Vibe Coders</h1>
    <p class="subtitle">hackathon is live &mdash; go build something awesome</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="vibes">0</div>
        <div class="stat-label">Vibes</div>
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

  <script>
    const emojis = ['\\u{1F680}', '\\u{2728}', '\\u{1F525}', '\\u{1F3AF}', '\\u{26A1}', '\\u{1F308}', '\\u{1F389}', '\\u{1F47E}', '\\u{1F3B6}', '\\u{1F4A5}', '\\u{1F9E0}', '\\u{1F916}'];
    let vibes = 0;
    let clicks = 0;
    const startTime = Date.now();

    setInterval(() => {
      vibes += Math.floor(Math.random() * 3) + 1;
      document.getElementById('vibes').textContent = vibes.toLocaleString();
      document.getElementById('vibeEmoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
    }, 800);

    setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      document.getElementById('clock').textContent = h + ':' + m + ':' + s;
    }, 1000);

    const vibeMsg = "${vibeMessage.replace(/"/g, '\\"')}";
    if (vibeMsg) {
      const terminal = document.getElementById('terminal');
      terminal.style.display = 'block';
      const target = document.getElementById('typewriter-text');
      let i = 0;
      setTimeout(() => {
        const type = () => {
          if (i < vibeMsg.length) {
            target.textContent += vibeMsg[i];
            i++;
            setTimeout(type, 50 + Math.random() * 60);
          }
        };
        type();
      }, 800);
    }

    document.addEventListener('click', (e) => {
      clicks++;
      document.getElementById('clicks').textContent = clicks;
      vibes += 10;

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
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log("Vibes live on port " + port));
