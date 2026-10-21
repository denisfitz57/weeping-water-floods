(function () {
  "use strict";
  const CFG = window.SITE_CONFIG || {};
  const ARCHIVE = "https://weepingwaterne.advantage-preservation.com/viewer/";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- theme toggle (remembered per viewer) ----------
  const root = document.documentElement;
  try { const t = localStorage.getItem("ww-theme"); if (t) root.dataset.theme = t; } catch (e) {}
  const themeBtn = $("#themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("ww-theme", root.dataset.theme); } catch (e) {}
  });

  // ---------- helpers ----------
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  function archiveUrl(c) {
    const d = c.date.replace(/-/g, "");
    const fn = c.paper === "Plattsmouth Journal"
      ? `plattsmouth_journal_usa_nebraska_plattsmouth_${d}_english_${c.page}`
      : `weeping_water_republican_usa_nebraska_weeping_water_${d}_english_${c.page}`;
    return `${ARCHIVE}?fn=${fn}&df=1&dt=10&cid=3105`;
  }
  const srcLine = (c) => `${esc(c.paper)} · ${fmtDate(c.date)} · page ${c.page}`;

  // ---------- clippings ----------
  let CLIPS = {}, ORDER = [];
  fetch("data/clips.json").then((r) => r.json()).then((list) => {
    list.forEach((c) => (CLIPS[c.id] = c));
    $$("figure[data-clip]").forEach(buildClip);
    ORDER = $$("figure[data-clip]").map((f) => f.dataset.clip);
    if (location.hash.startsWith("#clip=")) openClip(location.hash.slice(6));
  });

  function buildClip(fig) {
    const c = CLIPS[fig.dataset.clip];
    if (!c) { fig.remove(); return; }
    fig.classList.add("clip");
    const cap = fig.dataset.caption || c.title;
    if (c.hide_image) {
      fig.classList.add("text-only");
      fig.innerHTML = `<button class="zoom" aria-label="Read: ${esc(c.title)}"><div class="transcript-card"><h4>${esc(c.title)}</h4>${esc(c.text)}</div></button>
        <figcaption>${esc(cap)}<span class="src">${srcLine(c)} · photo too dark in surviving scan</span></figcaption>`;
    } else {
      const tape = c.kind === "photo" ? '<span class="tape" aria-hidden="true"></span>' : "";
      fig.innerHTML = `${tape}<button class="zoom" aria-label="Enlarge and read: ${esc(c.title)}">
        <img src="clips/${c.id}.jpg" width="${c.w}" height="${c.h}" loading="lazy" alt="${esc(c.kind === "photo" ? c.text.slice(0, 220) : "Newspaper clipping: " + c.title)}"></button>
        <figcaption>${esc(cap)}<span class="src">${srcLine(c)} · click to read</span></figcaption>`;
      if (c.h / c.w > 1.9) fig.classList.add("tall");
    }
    $("button.zoom", fig).addEventListener("click", () => openClip(c.id));
  }

  const lb = $("#lightbox");
  function openClip(id) {
    const c = CLIPS[id]; if (!c) return;
    const i = ORDER.indexOf(id);
    $("#lbImg").innerHTML = c.hide_image
      ? `<div style="padding:40px;color:var(--ink-3)">The photograph in the surviving scan is nearly solid black, so only its caption is reproduced here. <a href="${archiveUrl(c)}" target="_blank" rel="noopener">See the page in the library archive</a>.</div>`
      : `<img src="clips/${c.id}.jpg" alt="">`;
    $("#lbImg").classList.remove("zoomed");
    $("#lbText").innerHTML = `<h3>${esc(c.title)}</h3><div class="src">${srcLine(c)}</div>
      <div class="tx">${esc(c.text)}</div>
      <div class="tx-note">Transcription corrected by hand from the scan; “...” marks passages skipped. Spelling and names follow the original newspaper.</div>
      <div class="lb-nav">
        ${i > 0 ? `<button class="btn ghost" data-go="${ORDER[i - 1]}">← Previous</button>` : ""}
        ${i < ORDER.length - 1 ? `<button class="btn ghost" data-go="${ORDER[i + 1]}">Next →</button>` : ""}
        <a class="btn ghost" href="${archiveUrl(c)}" target="_blank" rel="noopener">Full page in archive ↗</a>
      </div>`;
    $$("[data-go]", lb).forEach((b) => b.addEventListener("click", () => openClip(b.dataset.go)));
    const img = $("#lbImg img");
    if (img) img.addEventListener("click", () => $("#lbImg").classList.toggle("zoomed"));
    if (!lb.open) lb.showModal();
    history.replaceState(null, "", "#clip=" + id);
  }
  function closeLb() { lb.close(); history.replaceState(null, "", location.pathname + location.search); }
  $("#lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  lb.addEventListener("cancel", (e) => { e.preventDefault(); closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.open) return;
    const b = e.key === "ArrowRight" ? $$("[data-go]", lb).pop() : e.key === "ArrowLeft" ? $$("[data-go]", lb)[0] : null;
    if (b && (e.key === "ArrowLeft" ? b.textContent.includes("Prev") : b.textContent.includes("Next"))) b.click();
  });

  // ---------- reader memories (Google Form in, approved rows of a published sheet out) ----------
  const MEM = CFG.memories || {};
  const memOn = !!(MEM.formAction && MEM.fields && MEM.fields.chapter && MEM.fields.memory);
  const cm = $("#comments");
  $$("[data-discuss]").forEach((btn) => btn.addEventListener("click", () => openComments(btn.dataset.discuss, btn.dataset.title)));
  function openComments(id, title) {
    $("#cmTitle").textContent = title || "Share a memory";
    const box = $("#cmBody");
    const mail = CFG.contactEmail ? `<p>Have photos or scans? Send them to <a href="mailto:${esc(CFG.contactEmail)}?subject=${encodeURIComponent("Weeping Water floods: " + (title || ""))}">${esc(CFG.contactEmail)}</a>.</p>` : "";
    if (!memOn) {
      box.innerHTML = `<p>Sharing memories isn't switched on yet. Once the site owner connects a Google Form, anyone will be able to leave a memory here without creating an account.</p>${mail}`;
    } else {
      box.innerHTML = `<p>Remember this flood, or know more about it? No account is needed. Your note appears on the page once the site owner has read it.</p>
        <form class="mem-form" novalidate>
          <label>Your memory<textarea name="memory" rows="6" required maxlength="5000" placeholder="What happened, when, and who was there?"></textarea></label>
          <label>Your name, as you'd like it shown <small>(optional)</small><input name="name" maxlength="100" autocomplete="name"></label>
          <label>Email, if we may contact you <small>(optional, never shown)</small><input name="email" type="email" maxlength="200" autocomplete="email"></label>
          <label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
          <div class="mem-actions"><button class="btn" type="submit">Send memory</button><span class="mem-status" role="status"></span></div>
        </form>${mail}`;
      const f = $("form", box);
      f.addEventListener("submit", (e) => { e.preventDefault(); sendMemory(f, id); });
    }
    cm.showModal();
  }
  function sendMemory(f, chapter) {
    const st = $(".mem-status", f), memory = f.memory.value.trim();
    if (memory.length < 3) { st.textContent = "Please write a few words first."; f.memory.focus(); return; }
    if (f.website.value) { st.textContent = "Thank you!"; return; }   // honeypot: bots fill every field
    const body = new URLSearchParams();
    body.append(MEM.fields.chapter, chapter);
    body.append(MEM.fields.memory, memory);
    if (MEM.fields.name) body.append(MEM.fields.name, f.name.value.trim());
    if (MEM.fields.email) body.append(MEM.fields.email, f.email.value.trim());
    const btn = $("button[type=submit]", f); btn.disabled = true; st.textContent = "Sending…";
    // Google Forms sends no CORS headers, so the reply is opaque; a network error is the only failure we can see
    fetch(MEM.formAction, { method: "POST", mode: "no-cors", body })
      .then(() => { f.outerHTML = `<p class="mem-thanks"><b>Thank you.</b> Your memory was sent and will appear here once it has been read.</p>`; })
      .catch(() => { btn.disabled = false; st.textContent = "That didn't go through. Please check your connection and try again."; });
  }
  $("#cmClose").addEventListener("click", () => cm.close());
  cm.addEventListener("click", (e) => { if (e.target === cm) cm.close(); });

  // approved memories, shown under each chapter's button
  if (MEM.publishedCsv) {
    fetch(MEM.publishedCsv).then((r) => (r.ok ? r.text() : "")).then((txt) => {
      const rows = parseCsv(txt);
      if (rows.length < 2) return;
      const head = rows[0].map((h) => h.trim().toLowerCase());
      const col = (re) => head.findIndex((h) => re.test(h));
      const iT = col(/time|date/), iC = col(/chapter/), iN = col(/name/), iM = col(/memory|comment/);
      if (iC < 0 || iM < 0) return;
      const by = {};
      rows.slice(1).forEach((r) => { if (r[iM] && r[iM].trim()) (by[r[iC].trim()] = by[r[iC].trim()] || []).push(r); });
      $$("[data-memories]").forEach((box) => {
        const list = by[box.dataset.memories]; if (!list) return;
        box.innerHTML = `<h4>Readers remember</h4>` + list.map((r) => {
          const when = iT >= 0 && r[iT] ? new Date(r[iT]) : null;
          const date = when && !isNaN(when) ? when.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
          return `<blockquote class="memory"><p>${esc(r[iM].trim())}</p><footer>${esc((iN >= 0 && r[iN].trim()) || "A reader")}${date ? " · " + date : ""}</footer></blockquote>`;
        }).join("");
      });
    }).catch(() => {});
  }
  function parseCsv(t) {
    const out = []; let row = [], f = "", q = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(f); f = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; row.push(f); out.push(row); row = []; f = ""; }
      else f += ch;
    }
    if (f || row.length) { row.push(f); out.push(row); }
    return out;
  }

  // ---------- active chapter in the nav ----------
  const navLinks = $$(".toc a");
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  $$("section[id]").forEach((s) => io.observe(s));

  // ---------- USGS peak-flow chart ----------
  const NOTES = {
    1950: "May 9, 1950: the flood of record for 43 years",
    1984: "June 13, 1984: 7.42 in. of rain at Weeping Water",
    1993: "July 23, 1993: the record, 65,100 cfs",
    2010: "June 21, 2010",
    1964: "June 1964", 1978: "July 1978", 1982: "June 1982", 1990: "July 1990", 1999: "June 1999"
  };
  fetch("data/peaks.json").then((r) => r.json()).then((rows) => drawChart(rows));
  function drawChart(rows) {
    const el = $("#peakChart"); if (!el) return;
    const byYear = {};
    rows.forEach((r) => { const y = +r.date.slice(0, 4); if (!byYear[y] || byYear[y].cfs < r.cfs) byYear[y] = r; });
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
    const W = 1000, H = 360, m = { l: 54, r: 10, t: 34, b: 30 };
    const y0 = years[0], y1 = years[years.length - 1];
    const bw = (W - m.l - m.r) / (y1 - y0 + 1);
    const max = 70000;
    const X = (y) => m.l + (y - y0) * bw, Y = (v) => m.t + (H - m.t - m.b) * (1 - v / max);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of annual peak streamflow, Weeping Water Creek at Union, 1950 to 2025. Highest: 65,100 cubic feet per second in 1993; 60,300 in 1950; 53,500 in 1984; 48,200 in 2010.">`;
    // dams-built band (first structures 1992, project essentially complete ~2000)
    s += `<rect class="band" x="${X(1991.5)}" y="${m.t - 6}" width="${X(2000.5) - X(1991.5)}" height="${H - m.t - m.b + 6}"/>`;
    s += `<text class="band-lbl" x="${X(1994) + 2}" y="${Y(46000)}">19 dams</text><text class="band-lbl" x="${X(1994) + 2}" y="${Y(46000) + 15}">built</text><text class="band-lbl" x="${X(1994) + 2}" y="${Y(46000) + 30}">1992–2000</text>`;
    s += `<g class="grid axis">`;
    for (let v = 0; v <= max; v += 10000) {
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${v ? v / 1000 + "k" : "0"}</text>`;
    }
    for (let y = 1950; y <= y1; y += 10) s += `<text x="${X(y) + bw / 2}" y="${H - 8}" text-anchor="middle">${y}</text>`;
    s += `</g>`;
    years.forEach((y) => {
      const r = byYear[y], hi = r.cfs >= 40000;
      const top = Y(r.cfs), h = Y(0) - top, w = Math.max(bw - 2, 1);
      const rad = Math.min(3, w / 2, h);
      // bar with rounded data-end, anchored square to the baseline
      s += `<path class="bar${hi ? " hi" : ""}" data-y="${y}" d="M${X(y) + 1},${Y(0)} V${top + rad} q0,-${rad} ${rad},-${rad} h${w - 2 * rad} q${rad},0 ${rad},${rad} V${Y(0)} Z"/>`;
      if (hi) s += `<text class="lbl strong" x="${X(y) + bw / 2}" y="${top - 6}" text-anchor="middle">${y}</text>`;
    });
    s += `<text class="lbl" x="${m.l}" y="14">cubic feet per second</text></svg>`;
    el.innerHTML = s;
    const tip = $("#peakTip"), wrap = el.closest(".chart-wrap");
    // generous hit targets: the whole column, not just the bar
    el.querySelector("svg").addEventListener("mousemove", (e) => {
      const svg = e.currentTarget, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const y = Math.floor((p.x - m.l) / bw) + y0, r = byYear[y];
      $$(".bar.on", el).forEach((b) => b.classList.remove("on"));
      if (!r) { tip.style.opacity = 0; return; }
      const bar = el.querySelector(`.bar[data-y="${y}"]`); if (bar) bar.classList.add("on");
      tip.innerHTML = `<b>${fmtDate(r.date)}</b><br>${r.cfs.toLocaleString()} cfs${r.stage ? ` · stage ${r.stage} ft` : ""}${NOTES[y] ? `<br><i>${NOTES[y]}</i>` : ""}`;
      const wb = wrap.getBoundingClientRect();
      let left = e.clientX - wb.left + 14; if (left > wb.width - 230) left -= 250;
      tip.style.left = left + "px"; tip.style.top = (e.clientY - wb.top - 10) + "px"; tip.style.opacity = 1;
    });
    el.querySelector("svg").addEventListener("mouseleave", () => { tip.style.opacity = 0; $$(".bar.on", el).forEach((b) => b.classList.remove("on")); });
    const tb = $("#peakTable");
    if (tb) tb.innerHTML = "<tr><th>Date</th><th>Peak (cfs)</th><th>Stage (ft)</th></tr>" +
      years.map((y) => byYear[y]).map((r) => `<tr><td>${r.date}</td><td>${r.cfs.toLocaleString()}</td><td>${r.stage ?? ""}</td></tr>`).join("");
  }
})();
