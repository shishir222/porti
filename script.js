const screen = document.getElementById("screen");
const output = document.getElementById("output");
const form = document.getElementById("prompt-form");
const input = document.getElementById("cmd");
const menu = document.getElementById("menu");

const PROMPT = "shishir@portfolio:~$";

const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const line = (html = "", cls = "") => `<div class="${cls}">${html}</div>`;

const kv = (key, val) => `  <span class="key">${key.padEnd(10)}</span>${val}`;

/* ---------- commands (content from LinkedIn + GitHub) ---------- */

const COMMANDS = {
  about: {
    desc: "who I am",
    run: () => [
      line("Shishir Chalise", "head"),
      line("Student | Developer & Designer"),
      line(""),
      line("Second semester CSIT student at Butwal Multiple Campus."),
      line("I enjoy breaking down problems, understanding systems,"),
      line("and building clean, purposeful solutions."),
      line("Always learning. Always building.", "dim"),
      line(""),
      line("Location: Butwal, Nepal", "dim"),
    ],
  },

  skills: {
    desc: "languages & tools",
    run: () => [
      line("  languages   c · c++ · python · javascript"),
      line("  web         html · css · react"),
      line("  mobile      flutter"),
      line("  tools       git · linux · mysql · firebase"),
    ],
  },

  experience: {
    desc: "work history",
    run: () => [
      line("  <span class='key'>Freelance</span> — Developer & Designer"),
      line("    freelance · butwal, nepal", "dim"),
    ],
  },

  education: {
    desc: "academic background",
    run: () => [
      line("  <span class='key'>BSc. CSIT</span> — Tribhuvan University"),
      line("    butwal multiple campus · 2nd semester", "dim"),
    ],
  },

  projects: {
    desc: "selected work",
    run: () => [
      line(kv("DHYAN", 'javascript · <a class="link" href="https://github.com/shishir222/DHYAN" target="_blank" rel="noopener">github.com/shishir222/DHYAN</a>')),
      line(kv("more", '<a class="link" href="https://shishirchalise.com.np" target="_blank" rel="noopener">shishirchalise.com.np</a>')),
    ],
  },

  contact: {
    desc: "how to reach me",
    run: () => [
      line(kv("email", '<a class="link" href="mailto:shishirchalise255@gmail.com">shishirchalise255@gmail.com</a>')),
      line(kv("linkedin", '<a class="link" href="https://www.linkedin.com/in/shishirchalise/" target="_blank" rel="noopener">linkedin.com/in/shishirchalise</a>')),
      line(kv("github", '<a class="link" href="https://github.com/shishir222" target="_blank" rel="noopener">github.com/shishir222</a>')),
      line(kv("instagram", '<a class="link" href="https://instagram.com/shishirchalise43" target="_blank" rel="noopener">@shishirchalise43</a>')),
    ],
  },

  clear: {
    desc: "clear the screen",
    run: () => {
      output.innerHTML = "";
      return [];
    },
  },

  /* handled separately in runCommand() — entry exists so 'help' lists it */
  ask: {
    desc: "ai answers questions about me",
    run: () => [],
  },
};

COMMANDS.help = {
  desc: "list available commands",
  run: () => [
    line("available commands", "head"),
    ...Object.keys(COMMANDS).map((c) => line(kv(c, COMMANDS[c].desc))),
  ],
};

/* ---------- output helpers ---------- */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollDown = () => (screen.scrollTop = screen.scrollHeight);

const append = (html) => {
  output.insertAdjacentHTML("beforeend", html);
  scrollDown();
};

let liveSpan = null;

const echoStart = () => {
  append(line(`<span class="prompt">${PROMPT}</span> <span class="key"></span>`));
  liveSpan = output.lastElementChild.querySelector(".key");
};

const echoFull = (cmd) =>
  append(line(`<span class="prompt">${PROMPT}</span> <span class="key">${esc(cmd)}</span>`));

/* interactive (button / typed) print — one line every 45ms */
function printLines(lines, delay = 45) {
  lines.forEach((html, i) =>
    setTimeout(() => {
      append(html);
    }, reduceMotion ? 0 : i * delay)
  );
}

function runCommand(raw) {
  echoFull(raw);

  const query = raw.trim();
  const sp = query.indexOf(" ");
  const name = (sp === -1 ? query : query.slice(0, sp)).toLowerCase();
  const arg = sp === -1 ? "" : query.slice(sp + 1).trim();

  if (name === "ask") return handleAsk(arg);
  if (COMMANDS[name]) printLines(COMMANDS[name].run());
  else printLines([line(`<span class="err">'${esc(name)}'</span> is not recognized. Type 'help'.`)]);
}

/* ---------- ask: AI answers about Shishir (free, keyless API) ---------- */

const PROFILE = `You are the AI assistant embedded in Shishir Chalise's portfolio website terminal.
Answer ONLY questions about Shishir Chalise. If asked about anything else, briefly say you only answer questions about Shishir.
Facts:
- Name: Shishir Chalise. Headline: Student | Developer & Designer.
- Location: Butwal, Nepal.
- Education: BSc. CSIT, 2nd semester at Butwal Multiple Campus, Tribhuvan University.
- Experience: Freelance Developer & Designer.
- Skills: C, C++, Python, JavaScript, HTML, CSS, React, Flutter, Git, Linux, MySQL, Firebase.
- Projects: DHYAN (JavaScript) and others at shishirchalise.com.np.
- Contact: shishirchalise255@gmail.com, linkedin.com/in/shishirchalise, github.com/shishir222, instagram @shishirchalise43.
- About: enjoys breaking down problems, understanding systems, and building clean, purposeful solutions. Motto: "Always learning. Always building."
Keep answers under 60 words, plain text only - no markdown, no asterisk symbols, no emojis.`;

const SUGGESTIONS = [
  "who is shishir?",
  "what can he do?",
  "where did he study?",
  "how can I contact him?",
];

function wrapText(text) {
  const clean = text.replace(/\*\*|[*_#`]/g, "").replace(/\s+/g, " ").trim();
  const out = [];
  clean.split(" ").forEach((w) => {
    if (!out.length) return out.push(w);
    if ((out[out.length - 1] + " " + w).length > 74) out.push(w);
    else out[out.length - 1] += " " + w;
  });
  return out.slice(0, 8).map((t) => line(esc(t)));
}

function localAnswer(q) {
  const s = q.toLowerCase();
  const has = (...w) => w.some((x) => s.includes(x));
  if (has("contact", "email", "reach", "hire", "phone"))
    return "Email shishirchalise255@gmail.com, or find him on linkedin.com/in/shishirchalise and github.com/shishir222.";
  if (has("skill", "stack", "tech", "language", "know", "can do", "use"))
    return "C, C++, Python, JavaScript, HTML, CSS, React, Flutter, Git, Linux, MySQL and Firebase.";
  if (has("educat", "school", "college", "university", "study", "degree", "campus"))
    return "He studies BSc. CSIT, currently 2nd semester at Butwal Multiple Campus, Tribhuvan University.";
  if (has("work", "experience", "job", "freelance", "do for living"))
    return "He works as a freelance Developer & Designer, based in Butwal, Nepal.";
  if (has("project", "built", "made", "portfolio"))
    return "DHYAN (JavaScript) plus more projects at shishirchalise.com.np.";
  return "Shishir Chalise - Student, Developer & Designer from Butwal, Nepal. Always learning, always building.";
}

function handleAsk(question) {
  if (!question) {
    printLines([
      line("ask me anything about Shishir", "head"),
      line("  usage:  ask &lt;your question&gt;"),
      line(""),
      line("or click one of these:", "dim"),
      ...SUGGESTIONS.map(
        (s) => line(`  <span class="q" data-q="${esc(s)}">ask "${esc(s)}"</span>`)
      ),
    ]);
    return;
  }

  const status = line("thinking", "dim");
  append(status);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  const url =
    "https://text.pollinations.ai/" +
    encodeURIComponent(question) +
    "?model=openai&system=" +
    encodeURIComponent(PROFILE);

  fetch(url, { signal: ctrl.signal })
    .then((r) => {
      if (!r.ok) throw new Error("api");
      return r.text();
    })
    .then((txt) => {
      clearTimeout(timer);
      status.remove();
      const answer = /^</.test(txt.trim()) ? localAnswer(question) : txt;
      printLines(wrapText(answer));
    })
    .catch(() => {
      clearTimeout(timer);
      status.remove();
      printLines(wrapText(localAnswer(question)));
    });
}

/* ---------- auto showcase (queue engine) ---------- */

const SHOWCASE = ["about", "skills", "experience", "education", "projects", "contact"];

let queue = [];
let qIndex = 0;
let qTimer = null;
let autoRunning = false;

const qPush = (fn, wait) => queue.push({ fn, wait });

function typeCommandSteps(cmd) {
  qPush(() => echoStart(), 300);
  for (const ch of cmd) qPush(() => { if (liveSpan) liveSpan.textContent += ch; }, 26);
  qPush(() => { liveSpan = null; }, 220);
}

function buildShowcase() {
  queue = [];
  qIndex = 0;

  [
    line("portfolio.exe v1.0 — auto showcase", "dim"),
    line("click anywhere to skip", "dim"),
    line(""),
  ].forEach((h) => qPush(() => append(h), 350));

  SHOWCASE.forEach((cmd) => {
    typeCommandSteps(cmd);
    COMMANDS[cmd].run().forEach((l) => qPush(() => append(l), 55));
    qPush(() => append(line("")), 450);
  });

  [
    line("--------------------------------------------------", "dim"),
    line("pick any command from the bar below — no typing needed", "ok"),
    line('curious? click <span class="ok">ask&#10023;</span> to question the AI about me', "dim"),
  ].forEach((h) => qPush(() => append(h), 100));
}

function runQueue() {
  if (qIndex >= queue.length) return finishAuto();
  const { fn, wait } = queue[qIndex++];
  fn();
  qTimer = setTimeout(runQueue, reduceMotion ? 0 : wait);
}

function skipAuto() {
  clearTimeout(qTimer);
  while (qIndex < queue.length) queue[qIndex++].fn();
  finishAuto();
}

function finishAuto() {
  if (!autoRunning) return;
  autoRunning = false;
  menu.hidden = false;
  scrollDown();
}

function startShowcase() {
  autoRunning = true;
  menu.hidden = true;
  output.innerHTML = "";
  liveSpan = null;
  buildShowcase();
  runQueue();
}

/* ---------- input (optional — buttons do the same job) ---------- */

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = input.value.trim();
  input.value = "";
  if (autoRunning) return skipAuto();
  if (!raw) return;
  runCommand(raw);
});

/* clickable suggested questions in the terminal output */
output.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-q]");
  if (!chip) return;
  if (autoRunning) skipAuto();
  runCommand("ask " + chip.dataset.q);
});

menu.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || autoRunning) return;
  const cmd = btn.dataset.cmd;

  if (cmd === "replay") return startShowcase();
  if (cmd === "clear") return runCommand("clear");
  runCommand(cmd);
});

screen.addEventListener("click", (e) => {
  if (autoRunning) return skipAuto(); // skip showcase, don't pop the keyboard
  if (e.target.closest("[data-q]")) return; // clicked a suggested question
  input.focus();
});

/* ---------- boot ---------- */

startShowcase();

/* ---------- spider that chases the cursor ---------- */

(() => {
  const spiderEl = document.getElementById("spider");
  const winEl = document.querySelector(".window");
  if (!spiderEl || !winEl || reduceMotion) {
    if (spiderEl) spiderEl.style.display = "none";
    return;
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  let x, y;
  let ang = -90;
  let boost = 0;
  let target = null;
  let lastPointer = -1e9;
  let nextWander = 0;
  let leap = null; // glide into a freshly cast web
  let landT = 1; // landing squash timer (>= LAND_DUR means idle)
  const LAND_DUR = 0.22;

  /* thrown webs: spawn while walking, fade out and expire */
  const webTpl = document.getElementById("web-tpl");
  const websLayer = document.getElementById("webs");
  const webs = [];
  let webDelay = 1.5; // first web shortly after the page loads

  /* irregular, wispy web — used when a web lands on top of words */
  function makeMessyWeb() {
    const n = 5 + Math.floor(Math.random() * 4); // 5–8 uneven spokes
    const cx = 20;
    const cy = 20;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const r = 8 + Math.random() * 12;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    const spokes = pts.map((p) => `M20 20 L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const ring = (f) => {
      const rp = pts.map((p) => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f]);
      let d = `M${rp[0][0].toFixed(1)} ${rp[0][1].toFixed(1)}`;
      for (let i = 1; i <= n; i++) {
        const prev = rp[i - 1];
        const b = rp[i % n];
        const mx = (prev[0] + b[0]) / 2;
        const my = (prev[1] + b[1]) / 2;
        const ctlX = mx + (cx - mx) * 0.35; // strands sag toward the middle
        const ctlY = my + (cy - my) * 0.35;
        d += ` Q${ctlX.toFixed(1)} ${ctlY.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
      }
      return d + " Z";
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.innerHTML =
      `<g fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="${spokes}"/><path d="${ring(0.55)}"/><path d="${ring(0.9)}"/></g>`;
    return svg;
  }

  /* is this spot on top of actual words? */
  function overWords(px, py) {
    const wr = winEl.getBoundingClientRect();
    const hit = document.elementFromPoint(wr.left + px, wr.top + py);
    if (!hit) return false;
    if (hit.closest(".prompt-line")) return true; // the prompt line has words
    const out = hit.closest("#output");
    if (!out || hit === out) return false;
    return !!hit.textContent.trim(); // only the exact line under the spot counts
  }

  function throwWeb(heading) {
    if (!webTpl || !websLayer) return;
    const a = heading + (Math.random() - 0.5) * 1.4; // spread around walking direction
    const speed = 300 + Math.random() * 160; // snappy launch
    const travelMax = 130 + Math.random() * 140; // long cast — 130–270px
    const roll = Math.random();
    const size =
      roll < 0.45 ? 14 + Math.random() * 10 // small
      : roll < 0.85 ? 30 + Math.random() * 16 // medium
      : 58 + Math.random() * 32; // large, rarer — up to ~90px

    /* shape depends on where it will land: words → wispy, blank → classic */
    const landsOnText = overWords(
      x + Math.cos(a) * Math.min(travelMax, 150),
      y + Math.sin(a) * Math.min(travelMax, 150)
    );
    const el = landsOnText
      ? makeMessyWeb()
      : webTpl.content.firstElementChild.cloneNode(true);
    el.classList.add("web");
    if (landsOnText) el.classList.add("messy");
    el.style.width = size + "px";
    el.style.height = size + "px";
    websLayer.appendChild(el);

    /* silk thread from the spider to the web */
    const thread = document.createElement("div");
    thread.className = "thread";
    websLayer.appendChild(thread);

    webs.push({
      el,
      thread,
      x: x + Math.cos(a) * 16,
      y: y + Math.sin(a) * 16,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      rot: (a * 180) / Math.PI,
      life: 0,
      flyFor: 0.55 + Math.random() * 0.45, // flight time before it sticks
      travel: 0,
      travelMax,
      max: 2.6 + Math.random() * 1.4, // total life before it disappears
      size,
      phase: "fly",
      snap: 0,
      splat: -1, // starts counting once it sticks
      lens: null, // cached stroke lengths for the dissolve
    });
    if (webs.length > 9) {
      const old = webs.shift();
      old.el.remove();
      if (old.thread) old.thread.remove();
    }
  }

  /* web hits something → sticks fast and stays put,
     and the spider glides straight into it */
  function stickWeb(w, g) {
    w.phase = "stuck";
    w.splat = 0;
    w.vx = 0;
    w.vy = 0;
    w.x = Math.min(g.maxX, Math.max(g.minX, w.x));
    w.y = Math.min(g.maxY, Math.max(g.minY, w.y));

    const d = Math.hypot(w.x - x, w.y - y);
    if (!leap && landT >= LAND_DUR && d > 60 && d < 460) {
      leap = { fx: x, fy: y, tx: w.x, ty: w.y, t: 0, dur: 0.35 + d / 700 };
    }
  }

  /* spider roams only inside the terminal screen area */
  const geom = () => {
    const w = winEl.getBoundingClientRect();
    const s = screen.getBoundingClientRect();
    return {
      ox: w.left,
      oy: w.top,
      minX: s.left - w.left + 18,
      maxX: s.right - w.left - 18,
      minY: s.top - w.top + 18,
      maxY: s.bottom - w.top - 18,
    };
  };

  const g0 = geom();
  x = rnd(g0.minX, g0.maxX);
  y = rnd(g0.minY, g0.maxY);

  window.addEventListener("pointermove", (e) => {
    const g = geom();
    const px = e.clientX - g.ox;
    const py = e.clientY - g.oy;
    if (px >= g.minX - 60 && px <= g.maxX + 60 && py >= g.minY - 60 && py <= g.maxY + 60) {
      target = {
        x: Math.min(g.maxX, Math.max(g.minX, px)),
        y: Math.min(g.maxY, Math.max(g.minY, py)),
      };
      lastPointer = performance.now();
    }
  });

  /* click = scurry burst */
  window.addEventListener("pointerdown", () => {
    boost = 1;
  });

  let prev = performance.now();

  (function tick(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const g = geom();

    /* mouse idle or off-window → wander on its own */
    if (now - lastPointer > 2000 && (!target || now > nextWander)) {
      target = { x: rnd(g.minX, g.maxX), y: rnd(g.minY, g.maxY) };
      nextWander = now + 1400 + Math.random() * 1600;
    }

    let moving = false;
    let hop = 1; // scale: stretched mid-air, squashed on landing

    if (leap) {
      /* smooth glide into the web it just cast */
      leap.t += dt;
      const p = Math.min(1, leap.t / leap.dur);
      const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic — soft start, gentle arrival
      const nx = leap.fx + (leap.tx - leap.fx) * ease;
      const ny = leap.fy + (leap.ty - leap.fy) * ease;
      const mdx = nx - x;
      const mdy = ny - y;
      x = nx;
      y = ny;

      if (mdx || mdy) {
        const want = (Math.atan2(mdy, mdx) * 180) / Math.PI + 90;
        const delta = ((want - ang + 540) % 360) - 180;
        ang += delta * Math.min(1, 12 * dt);
      }

      hop = 1 + 0.3 * Math.sin(Math.PI * p); // stretch while flying
      moving = true;
      if (p >= 1) {
        leap = null;
        landT = 0; // landing squash follows
      }
    } else if (landT < LAND_DUR) {
      landT += dt;
      hop = 1 - 0.22 * Math.sin(Math.PI * (landT / LAND_DUR)); // squash on touchdown
    } else if (target) {
      const dx = target.x - x;
      const dy = target.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > 3) {
        const step = Math.min(dist, (120 + 170 * boost) * dt);
        x += (dx / dist) * step;
        y += (dy / dist) * step;

        /* face the walking direction (svg art points up) */
        const want = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const delta = ((want - ang + 540) % 360) - 180;
        ang += delta * Math.min(1, 12 * dt);
        moving = true;
      }
    }
    boost *= Math.exp(-3 * dt);

    /* throw a web every 2–4.5 s while moving */
    if (moving && target) {
      webDelay -= dt;
      if (webDelay <= 0) {
        throwWeb(Math.atan2(target.y - y, target.x - x));
        webDelay = 2 + Math.random() * 2.5;
      }
    }

    /* fly, stick on landing, hold, then dissolve away */
    for (let i = webs.length - 1; i >= 0; i--) {
      const w = webs[i];
      w.life += dt;
      if (w.life >= w.max) {
        w.el.remove();
        if (w.thread) w.thread.remove();
        webs.splice(i, 1);
        continue;
      }

      if (w.phase === "fly") {
        /* shot that decelerates smoothly, with a light flutter in the air */
        const drag = Math.exp(-2.2 * dt);
        w.vx *= drag;
        w.vy *= drag;
        const sp = Math.hypot(w.vx, w.vy);
        const ang = Math.atan2(w.vy, w.vx);
        const flut = Math.sin(w.life * 26) * Math.min(45, sp * 0.3);
        const dx = (w.vx - Math.sin(ang) * flut) * dt;
        const dy = (w.vy + Math.cos(ang) * flut) * dt;
        w.x += dx;
        w.y += dy;
        w.travel += Math.hypot(dx, dy);

        /* nose-dived into the flight direction, with a slight wobble */
        const want = (ang * 180) / Math.PI;
        const delta = ((want - w.rot + 540) % 360) - 180;
        w.rot += delta * Math.min(1, 8 * dt) + Math.sin(w.life * 18) * 24 * dt;

        if (
          w.travel >= w.travelMax ||
          w.life >= w.flyFor ||
          w.x <= g.minX ||
          w.x >= g.maxX ||
          w.y <= g.minY ||
          w.y >= g.maxY
        ) {
          stickWeb(w, g);
        }

        /* silk thread stretches from the spider's live position */
        if (w.thread) {
          const tdx = w.x - x;
          const tdy = w.y - y;
          w.thread.style.opacity = "1";
          w.thread.style.width = Math.hypot(tdx, tdy).toFixed(1) + "px";
          w.thread.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${Math.atan2(
            tdy,
            tdx
          )}rad)`;
        }
      } else {
        w.splat += dt;
        if (w.thread) {
          /* thread snaps shortly after the web sticks */
          w.snap += dt;
          const o = Math.max(0, 1 - w.snap / 0.3);
          w.thread.style.opacity = o.toFixed(2);
          if (o <= 0) {
            w.thread.remove();
            w.thread = null;
          }
        }
      }

      /* ---- appearance: splat on landing, fade in, then shrivel + break apart ---- */
      const t = w.life / w.max;
      const diss = Math.max(0, (t - 0.6) / 0.4); // 0 → 1 dissolve
      const op = t < 0.08 ? t / 0.08 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
      const e = w.splat < 0 ? 1 : Math.min(1, w.splat / 0.28);
      const boost = 1 + 0.45 * (1 - e) * Math.cos(e * Math.PI); // overshoot → settle
      const scale = (1 - 0.5 * diss * diss) * boost; // shrivels inward as it dies

      w.el.style.opacity = op.toFixed(2);
      w.el.style.transform = `translate(${(w.x - w.size / 2).toFixed(1)}px, ${(w.y - w.size / 2).toFixed(
        1
      )}px) rotate(${w.rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      w.el.style.filter =
        diss > 0
          ? `blur(${(diss * 1.8).toFixed(2)}px) drop-shadow(0 0 3px rgba(78, 245, 131, 0.45))`
          : "";

      /* strands snap one by one as it dissolves */
      if (diss > 0) {
        const shapes = w.el.querySelectorAll("path, polygon");
        if (!w.lens) {
          w.lens = [...shapes].map((s) => {
            try {
              return s.getTotalLength();
            } catch {
              return 0;
            }
          });
        }
        shapes.forEach((s, idx) => {
          const L = w.lens[idx];
          if (!L) return;
          s.style.strokeDasharray = L;
          s.style.strokeDashoffset = (L * Math.min(1, diss * 1.15)).toFixed(1);
        });
      }

      /* stretch along the flight direction while airborne */
      const svg = w.el.firstElementChild;
      if (w.phase === "fly") {
        const stretch = 1 + Math.min(0.6, Math.hypot(w.vx, w.vy) / 380);
        svg.style.transform = `scale(${stretch.toFixed(2)}, ${(1 / Math.sqrt(stretch)).toFixed(2)})`;
      } else {
        svg.style.transform = "";
      }
    }

    x = Math.min(g.maxX, Math.max(g.minX, x));
    y = Math.min(g.maxY, Math.max(g.minY, y));

    spiderEl.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${ang.toFixed(
      1
    )}deg) scale(${hop.toFixed(3)})`;
    /* lift the shadow off the ground while airborne */
    spiderEl.style.filter =
      hop > 1.03
        ? "drop-shadow(0 7px 5px rgba(0,0,0,0.55)) drop-shadow(0 0 9px rgba(78,245,131,0.5))"
        : "";
    spiderEl.classList.toggle("walking", moving);

    requestAnimationFrame(tick);
  })(prev);
})();
