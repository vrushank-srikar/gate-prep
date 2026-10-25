/* ═══════════════════════════════════════════════════════════════════════
   GATE HUB — script.js
   Complete SPA: routing, rendering, progress tracking, search, PDF viewer
   ═══════════════════════════════════════════════════════════════════════ */

/* ── STUDY DATA ─────────────────────────────────────────────────────────
   Loaded globally from data.js
   ──────────────────────────────────────────────────────────────────────── */

/* ── ROADMAP ─────────────────────────────────────────────────────────── */
const roadmapPhases = [
  { phase: 1, name: "Foundations", color: "#06b6d4",
    description: "Start with programming and mathematical fundamentals that every CS topic builds upon.",
    subjects: ["c-programming", "programming-ds", "discrete-mathematics", "digital-logic"] },
  { phase: 2, name: "Core Computer Science", color: "#10b981",
    description: "Deep dive into the high-weightage core CS subjects that dominate the GATE paper.",
    subjects: ["algorithms", "computer-organization", "operating-systems", "computer-networks", "dbms"] },
  { phase: 3, name: "Advanced CS Theory", color: "#7c3aed",
    description: "Master theoretical computer science and compiler construction.",
    subjects: ["theory-of-computation", "compiler-design"] },
  { phase: 4, name: "Engineering Mathematics", color: "#f59e0b",
    description: "Strengthen the mathematics component — linear algebra, calculus, probability & statistics.",
    subjects: ["engineering-mathematics"] },
  { phase: 5, name: "General Aptitude", color: "#f43f5e",
    description: "Polish analytical, quantitative and verbal aptitude for the aptitude section.",
    subjects: ["aptitude"] },
];

/* ── PROGRESS (localStorage) ─────────────────────────────────────────── */
const Progress = (() => {
  const KEY = 'gate_hub_v1';
  let data = { completed: {}, lastOpened: null };

  function load() {
    try { const s = localStorage.getItem(KEY); if (s) data = JSON.parse(s); }
    catch (_) {}
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
  }
  function isComplete(path) { return !!data.completed[path]; }
  function toggle(path) {
    if (data.completed[path]) { delete data.completed[path]; }
    else { data.completed[path] = Date.now(); }
    save(); updateSidebarProgress();
    return !!data.completed[path];
  }
  function setLastOpened(info) { data.lastOpened = info; save(); }
  function getLastOpened()     { return data.lastOpened; }

  function allFiles() {
    const all = [];
    for (const sid of Object.keys(studyData)) {
      for (const tid of Object.keys(studyData[sid].topics)) {
        for (const f of studyData[sid].topics[tid].files) all.push(f.path);
      }
    }
    return all;
  }
  function getStats() {
    const all = allFiles();
    const done = all.filter(p => data.completed[p]).length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }
  function getSubjectPct(sid) {
    const subj = studyData[sid]; if (!subj) return 0;
    let total = 0, done = 0;
    for (const t of Object.values(subj.topics)) { for (const f of t.files) { total++; if (data.completed[f.path]) done++; } }
    return total ? Math.round((done / total) * 100) : 0;
  }
  function getTopicPct(sid, tid) {
    const topic = studyData[sid]?.topics[tid]; if (!topic) return 0;
    const done = topic.files.filter(f => data.completed[f.path]).length;
    return topic.files.length ? Math.round((done / topic.files.length) * 100) : 0;
  }
  function getCompletedCount(sid, tid) {
    const topic = studyData[sid]?.topics[tid]; if (!topic) return 0;
    return topic.files.filter(f => data.completed[f.path]).length;
  }

  return { load, save, isComplete, toggle, setLastOpened, getLastOpened, getStats, getSubjectPct, getTopicPct, getCompletedCount };
})();

/* ── UTILITIES ───────────────────────────────────────────────────────── */
function $(id)    { return document.getElementById(id); }
function qs(sel)  { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function setContent(html) {
  $('content').innerHTML = html;
  $('content').scrollTop = 0;
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : '✕';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  $('toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 350); }, 2800);
}

function typeBadge(type) {
  const map = {
    'Class Notes':    ['cn',  '📘 Class Notes'],
    'DPP':            ['dpp', '📝 DPP'],
    'DPP Discussion': ['dpd', '💬 DPP Discussion'],
    'GATE-O-PEDIA':   ['gop', '📖 GATE-O-PEDIA'],
    'Lecture Planner':['lp',  '📅 Lecture Planner'],
    'Reference':      ['ref', '📄 Reference'],
  };
  const [cls, label] = map[type] || ['ref', type];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function pBar(pct, color = '') {
  return `<div class="progress-track" style="background:rgba(255,255,255,.07)">
    <div class="progress-fill" style="width:${pct}%;${color ? `background:${color};box-shadow:0 0 8px ${color}44` : ''}"></div>
  </div>`;
}

function encPath(p) { return encodeURI(p); }

function countTopics(sid) { return Object.keys(studyData[sid]?.topics || {}).length; }
function countPdfs(sid) {
  let n = 0; const s = studyData[sid]; if (!s) return 0;
  for (const t of Object.values(s.topics)) n += t.files.length;
  return n;
}

/* ── SIDEBAR PROGRESS ─────────────────────────────────────────────────── */
function updateSidebarProgress() {
  const { total, done, pct } = Progress.getStats();
  const bar = $('sb-bar'), pctEl = $('sb-pct'), statsEl = $('sb-stats');
  if (bar)    bar.style.width = pct + '%';
  if (pctEl)  pctEl.textContent = pct + '%';
  if (statsEl) statsEl.textContent = `${done} of ${total} PDFs completed`;
}

/* ── NAV HIGHLIGHT ────────────────────────────────────────────────────── */
function highlightNav(view) {
  qsa('.nav-link').forEach(a => {
    const v = a.dataset.view;
    a.classList.toggle('active', v === view || (view.startsWith('subject') && v === 'subjects'));
  });
}

/* ── ROUTER ──────────────────────────────────────────────────────────── */
const Router = {
  view: 'dashboard', sid: null,

  navigate(view, sid = null) {
    this.view = view; this.sid = sid;
    const hash = sid ? `#${view}/${sid}` : `#${view}`;
    history.pushState({ view, sid }, '', hash);
    this.render();
  },

  render() {
    highlightNav(this.view);
    closeSidebar();
    switch (this.view) {
      case 'dashboard':    renderDashboard();        break;
      case 'subjects':     renderSubjects();         break;
      case 'subject':      renderSubject(this.sid);  break;
      case 'roadmap':      renderRoadmap();          break;
      case 'gate-o-pedia': renderGateOPedia();       break;
      case 'search':       renderSearch();           break;
      default:             renderDashboard();
    }
  },

  init() {
    const h = location.hash.replace('#', '');
    const [view, sid] = h.split('/');
    if (view && studyData[view]) { this.view = 'subject'; this.sid = view; }
    else if (['dashboard','subjects','roadmap','gate-o-pedia','search'].includes(view)) { this.view = view; }
    this.render();

    window.addEventListener('popstate', (e) => {
      if (e.state) { this.view = e.state.view; this.sid = e.state.sid; this.render(); }
    });
  },
};

/* ── CLOCK ───────────────────────────────────────────────────────────── */
function startClock() {
  const el = $('clock');
  function tick() { if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  tick(); setInterval(tick, 30000);
}

/* ═══════════════════════════════════════════════════════════════════════
   RENDERERS
   ═══════════════════════════════════════════════════════════════════════ */

/* ── DASHBOARD ─────────────────────────────────────────────────────── */
function renderDashboard() {
  const { total, done, pct } = Progress.getStats();
  const R = 44; const circ = 2 * Math.PI * R;
  const offset = circ - (pct / 100) * circ;
  const last = Progress.getLastOpened();
  const subjectIds = Object.keys(studyData);
  const totalTopics = subjectIds.reduce((s, id) => s + countTopics(id), 0);

  // Recent subjects (with any progress)
  const withProg = subjectIds
    .map(id => ({ id, pct: Progress.getSubjectPct(id) }))
    .filter(x => x.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const continueCard = last
    ? `<div class="continue-card">
         <span class="continue-label">📌 Continue where you left off</span>
         <div class="continue-name">${last.name}</div>
         <div class="continue-meta">${studyData[last.sid]?.name || ''} · ${last.topic || ''}</div>
         <button class="btn btn-primary btn-sm" style="margin-top:10px;align-self:flex-start"
           onclick="PdfViewer.openFromLast()">Continue →</button>
       </div>`
    : `<div class="continue-empty">📖 Open a PDF to start tracking your progress</div>`;

  const recentSubjects = withProg.length
    ? withProg.map(({ id, pct }) => {
        const s = studyData[id];
        return `<div class="recent-subject-item" onclick="Router.navigate('subject','${id}')">
          <span class="recent-subject-icon">${s.icon}</span>
          <span class="recent-subject-name">${s.name}</span>
          <span class="recent-subject-prog">${pct}%</span>
        </div>`;
      }).join('')
    : `<div class="continue-empty">Start studying to see your recent subjects</div>`;

  setContent(`
    <div class="dash-hero">
      <div class="dash-hero-left">
        <div class="dash-hero-greeting">Welcome back 👋</div>
        <h1 class="dash-hero-title">Your <span>GATE Preparation</span> Hub</h1>
        <p class="dash-hero-sub">Everything you need to crack GATE CS — organized topic by topic, with progress tracking built in.</p>
        <div class="dash-hero-btns">
          <button class="btn btn-primary" onclick="Router.navigate('subjects')">📚 Browse Subjects</button>
          <button class="btn btn-ghost"   onclick="Router.navigate('roadmap')">🗺️ View Roadmap</button>
        </div>
      </div>
      <div class="dash-ring-wrap">
        <svg class="dash-ring" viewBox="0 0 100 100" aria-label="${pct}% overall progress">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stop-color="#4f46e5"/>
              <stop offset="100%" stop-color="#6366f1"/>
            </linearGradient>
          </defs>
          <circle class="ring-bg"   cx="50" cy="50" r="${R}" stroke-width="8"/>
          <circle class="ring-fill" cx="50" cy="50" r="${R}" stroke-width="8"
            stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
          <text x="50" y="46" text-anchor="middle" class="ring-pct">${pct}%</text>
          <text x="50" y="58" text-anchor="middle" class="ring-label">COMPLETE</text>
        </svg>
        <div class="dash-ring-sub">${done} / ${total} PDFs done</div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-icon">📚</span>
        <span class="stat-val" style="color:#4f46e5">${subjectIds.length}</span>
        <span class="stat-label">Subjects</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📑</span>
        <span class="stat-val" style="color:#0d9488">${totalTopics}</span>
        <span class="stat-label">Topics</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📄</span>
        <span class="stat-val" style="color:#2563eb">${total}</span>
        <span class="stat-label">Total PDFs</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✅</span>
        <span class="stat-val" style="color:#059669">${done}</span>
        <span class="stat-label">Completed</span>
      </div>
    </div>

    <div class="dash-row">
      <div class="dash-panel">
        <div class="dash-panel-title">Continue Studying</div>
        ${continueCard}
      </div>
      <div class="dash-panel">
        <div class="dash-panel-title">Active Subjects</div>
        ${recentSubjects}
      </div>
    </div>

    <div class="view-header">
      <div><div class="view-title">All Subjects</div></div>
    </div>
    <div class="subjects-grid">
      ${subjectIds.map(id => subjectCard(id)).join('')}
    </div>
  `);
}

/* ── SUBJECTS ────────────────────────────────────────────────────────── */
function renderSubjects() {
  const ids = Object.keys(studyData);
  setContent(`
    <div class="view-header">
      <div>
        <h1 class="view-title">Subjects</h1>
        <div class="view-sub">${ids.length} subjects · Click a card to open topics</div>
      </div>
    </div>
    <div class="subjects-grid">
      ${ids.map(id => subjectCard(id)).join('')}
    </div>
  `);
}

function subjectCard(id) {
  const s = studyData[id];
  const pct  = Progress.getSubjectPct(id);
  const pdfs = countPdfs(id);
  const topics = countTopics(id);
  return `
    <div class="subject-card" onclick="Router.navigate('subject','${id}')"
         style="--card-color:${s.color}" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')Router.navigate('subject','${id}')">
      <div class="subject-card-top">
        <div class="subject-card-icon">${s.icon}</div>
        <div class="subject-card-name">${s.name}</div>
        <div class="subject-card-desc">${s.description}</div>
      </div>
      <div class="subject-card-stats">
        <span class="subject-card-stat"><strong>${topics}</strong> topics</span>
        <span class="subject-card-stat"><strong>${pdfs}</strong> PDFs</span>
      </div>
      <div class="subject-card-footer">
        <div class="subject-card-prog-row">
          ${pBar(pct, s.color)}
          <span class="progress-pct" style="color:${s.color}">${pct}%</span>
        </div>
        <span class="subject-card-cta">Study →</span>
      </div>
    </div>`;
}

/* ── SUBJECT DETAIL ──────────────────────────────────────────────────── */
function renderSubject(sid) {
  const s = studyData[sid]; if (!s) { renderDashboard(); return; }
  const pct    = Progress.getSubjectPct(sid);
  const pdfs   = countPdfs(sid);
  const topics = countTopics(sid);

  const topicHtml = Object.entries(s.topics).map(([tid, topic]) => {
    const tpct  = Progress.getTopicPct(sid, tid);
    const done  = Progress.getCompletedCount(sid, tid);
    const total = topic.files.length;
    const groups = {};
    for (const f of topic.files) { (groups[f.type] = groups[f.type] || []).push(f); }
    const order = ['Class Notes', 'DPP', 'DPP Discussion', 'GATE-O-PEDIA', 'Lecture Planner', 'Reference'];
    const sections = order.filter(t => groups[t]).map(t => `
      <div class="topic-type-section">
        <div class="topic-type-label">${typeBadge(t)}</div>
        <div class="file-list">${groups[t].map(f => fileCard(f, sid, tid, topic.files)).join('')}</div>
      </div>`).join('');

    return `
      <div class="topic-block" id="topic-${tid}">
        <div class="topic-header" onclick="toggleTopic('${tid}')">
          <span class="topic-chevron">›</span>
          <span class="topic-name">${topic.name}</span>
          <span class="topic-meta">
            <div class="topic-prog-mini"><div class="topic-prog-mini-fill" style="width:${tpct}%"></div></div>
            <span class="topic-count">${done}/${total}</span>
          </span>
        </div>
        <div class="topic-body">${sections}</div>
      </div>`;
  }).join('');

  setContent(`
    <div class="breadcrumb">
      <span onclick="Router.navigate('subjects')">Subjects</span> › ${s.name}
    </div>
    <div class="subject-hero" style="--subject-color:${s.color}">
      <div class="subject-hero-icon">${s.icon}</div>
      <div class="subject-hero-info">
        <h1 class="subject-hero-name">${s.name}</h1>
        <p class="subject-hero-desc">${s.description}</p>
        <div class="subject-hero-meta">
          <span class="subject-hero-stat"><strong>${topics}</strong> Topics</span>
          <span class="subject-hero-stat"><strong>${pdfs}</strong> PDFs</span>
        </div>
      </div>
      <div class="subject-hero-prog">
        <div class="subject-hero-pct" style="color:${s.color}">${pct}%</div>
        <div class="subject-hero-pct-label">Complete</div>
        <div style="margin-top:6px">${pBar(pct, s.color)}</div>
      </div>
    </div>

    <div class="topics-list" id="topics-list">
      ${topicHtml}
    </div>
  `);
}

function toggleTopic(tid) {
  const block = document.getElementById('topic-' + tid);
  if (block) block.classList.toggle('open');
}

function getViewerUrl(sid, tid, idx, file) {
  const p = new URLSearchParams();
  if (sid) p.set('sid', sid);
  if (tid) p.set('tid', tid);
  if (idx !== undefined && idx !== null && idx >= 0) p.set('idx', idx);
  if (file && file.path) p.set('file', file.path);
  if (file && file.name) p.set('title', file.name);
  return 'viewer.html?' + p.toString();
}

function fileCard(file, sid, tid, allTopicFiles) {
  const done = Progress.isComplete(file.path);
  const idx  = allTopicFiles.indexOf(file);
  const viewerUrl = getViewerUrl(sid, tid, idx, file);
  const safePath = file.path.replace(/'/g, "\\'");
  const safeName = file.name.replace(/'/g, "\\'");
  return `
    <div class="file-card ${done ? 'completed' : ''}" id="fc-${btoa(file.path).replace(/[+/=]/g,'').slice(0,12)}">
      <div class="file-card-left">
        <div class="file-check">${done ? '✓' : ''}</div>
        <span class="file-name" title="${file.name}">${file.name}</span>
      </div>
      <div class="file-card-actions">
        <a class="file-action open-btn" href="${viewerUrl}" target="_blank" rel="noopener"
          onclick="Progress.setLastOpened({ path: '${safePath}', name: '${safeName}', sid: '${sid}', tid: '${tid}' })">Open</a>
        <button class="file-action done-btn ${done ? 'active' : ''}"
          onclick="toggleComplete('${safePath}','${sid}')">
          ${done ? '✓ Done' : '✓'}
        </button>
      </div>
    </div>`;
}

function toggleComplete(path, sid) {
  const nowDone = Progress.toggle(path);
  toast(nowDone ? '✓ Marked as completed!' : 'Marked as incomplete', nowDone ? 'success' : '');
  // Refresh subject view in place
  if (Router.view === 'subject') renderSubject(Router.sid);
  else if (Router.view === 'dashboard') renderDashboard();
  updateSidebarProgress();
}

/* ── SEARCH ─────────────────────────────────────────────────────────── */
function renderSearch(q = '') {
  setContent(`
    <div class="view-header">
      <div><h1 class="view-title">Search</h1></div>
    </div>
    <div class="search-hero">
      <div class="search-big-wrap">
        <span class="search-big-icon">🔍</span>
        <input id="search-input" type="search" placeholder="Type to search subjects, topics, PDFs…"
          value="${q}" autocomplete="off" oninput="doSearch(this.value)" autofocus/>
      </div>
    </div>
    <div id="search-results">${q ? buildSearchResults(q) : searchEmptyState()}</div>
  `);
  const inp = $('search-input');
  if (inp) { inp.focus(); inp.setSelectionRange(q.length, q.length); }
}

function doSearch(q) {
  const el = $('search-results');
  if (el) el.innerHTML = q.trim() ? buildSearchResults(q) : searchEmptyState();
}

function buildSearchResults(q) {
  q = q.trim().toLowerCase();
  if (!q) return searchEmptyState();

  let html = ''; let found = false;

  for (const [sid, subj] of Object.entries(studyData)) {
    const subjMatch = subj.name.toLowerCase().includes(q);
    const matchedFiles = [];

    for (const [tid, topic] of Object.entries(subj.topics)) {
      for (const f of topic.files) {
        if (subjMatch || topic.name.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)) {
          matchedFiles.push({ f, tid, topicName: topic.name, topicFiles: topic.files });
        }
      }
    }
    if (!matchedFiles.length) continue;
    found = true;

    html += `
      <div style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:1.2rem">${subj.icon}</span>
          <span class="search-group-title" style="color:${subj.color};margin-bottom:0">${subj.name}</span>
          <span style="font-size:.72rem;color:var(--text-3)">${matchedFiles.length} results</span>
        </div>
        <div class="file-list">
          ${matchedFiles.map(({ f, tid, topicFiles }) => `
            <div class="file-card ${Progress.isComplete(f.path) ? 'completed' : ''}">
              <div class="file-card-left">
                <div class="file-check">${Progress.isComplete(f.path) ? '✓' : ''}</div>
                <div>
                  <div class="file-name">${f.name}</div>
                  <div style="font-size:.7rem;color:var(--text-3);margin-top:2px">${typeBadge(f.type)}</div>
                </div>
              </div>
              <div class="file-card-actions">
              <a class="file-action open-btn" href="${getViewerUrl(sid, tid, topicFiles.indexOf(f), f)}" target="_blank" rel="noopener"
                onclick="Progress.setLastOpened({ path: '${f.path.replace(/'/g, "\\'")}', name: '${f.name.replace(/'/g, "\\'")}', sid: '${sid}', tid: '${tid}' })">Open</a>
                <button class="file-action done-btn ${Progress.isComplete(f.path) ? 'active' : ''}"
                  onclick="toggleComplete('${f.path.replace(/'/g, "\\'")}','${sid}')">✓</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  return found ? `<div class="search-results">${html}</div>` : `
    <div class="search-empty">
      <div class="search-empty-icon">🔎</div>
      <h3>No results for "${q}"</h3>
      <p>Try a different keyword like "deadlock", "sorting", or "SQL"</p>
    </div>`;
}

function searchEmptyState() {
  return `<div class="search-empty">
    <div class="search-empty-icon">🔍</div>
    <h3>Search your study materials</h3>
    <p>Find any subject, topic, class note, or DPP instantly</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:16px">
      ${['CPU Scheduling','Dynamic Programming','SQL','Regular Languages','Parsers','Probability'].map(
        s => `<button class="filter-btn" onclick="doSearch('${s}');$('search-input').value='${s}'">${s}</button>`).join('')}
    </div>
  </div>`;
}

/* ── ROADMAP ─────────────────────────────────────────────────────────── */
function renderRoadmap() {
  const phasesHtml = roadmapPhases.map(ph => {
    const done = ph.subjects.every(id => Progress.getSubjectPct(id) === 100);
    const chips = ph.subjects.map(id => {
      const s = studyData[id];
      const pct = Progress.getSubjectPct(id);
      return `<button class="phase-subject-chip" onclick="Router.navigate('subject','${id}')"
        style="border-color:${s.color}22">
        ${s.icon} ${s.name} <span style="color:${s.color};font-size:.65rem;margin-left:4px">${pct}%</span>
      </button>`;
    }).join('');

    return `
      <div class="phase-block ${done ? 'done' : ''}">
        <div class="phase-line-wrap">
          <div class="phase-num" style="${done ? `background:${ph.color}22;border-color:${ph.color};color:${ph.color}` : ''}">${done ? '✓' : ph.phase}</div>
        </div>
        <div class="phase-content">
          <div class="phase-card">
            <div class="phase-tag" style="background:${ph.color}22;color:${ph.color}">Phase ${ph.phase}</div>
            <div class="phase-name">${ph.name}</div>
            <div class="phase-desc">${ph.description}</div>
            <div class="phase-subjects">${chips}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  setContent(`
    <div class="view-header">
      <div>
        <h1 class="view-title">Preparation Roadmap</h1>
        <div class="view-sub">A recommended order to work through GATE CS topics</div>
      </div>
    </div>
    <p class="roadmap-intro">Follow these phases to cover the complete GATE CS syllabus systematically. Click any subject chip to jump to its study materials.</p>
    <div class="roadmap-phases">${phasesHtml}</div>
  `);
}

/* ── GATE-O-PEDIA ───────────────────────────────────────────────────── */
function renderGateOPedia() {
  const files = studyData['gate-o-pedia']?.topics['gate-o-pedia-refs']?.files || [];
  const gop   = files.filter(f => f.type === 'GATE-O-PEDIA');
  const planner = files.filter(f => f.type === 'Lecture Planner');

  const icons = {
    'Algorithms': '⚡', 'C Programming': '💻', 'Calculus': '📊', 'Compiler Design': '🔧',
    'Computer Networks': '🌐', 'Computer Organization': '🖥️', 'Database': '🗄️',
    'Data Structure': '🌳', 'Digital Logic': '🔌', 'Discrete': '📐',
    'General Aptitude': '🎯', 'Linear Algebra': '📐', 'Operating System': '⚙️',
    'Theory of Computation': '🤖',
  };
  function getIcon(name) {
    for (const [k, v] of Object.entries(icons)) { if (name.includes(k)) return v; }
    return '📖';
  }

  const gopCards = gop.map((f, i) => {
    const viewerUrl = getViewerUrl('gate-o-pedia', 'refs', i, f);
    return `
    <div class="gop-card">
      <div class="gop-card-header">
        <span class="gop-card-icon">${getIcon(f.name)}</span>
        <span class="gop-card-name">${f.name.replace(' — GATE-O-PEDIA','')}</span>
      </div>
      <div class="gop-card-footer">
        <a class="btn btn-primary btn-sm" href="${viewerUrl}" target="_blank" rel="noopener">📖 Open</a>
      </div>
    </div>`;
  }).join('');

  const plannerSection = planner.length ? `
    <div style="margin-bottom:28px">
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:14px">📅 Lecture Planner</h2>
      ${planner.map((f, i) => {
        const viewerUrl = getViewerUrl('gate-o-pedia', 'planner', i, f);
        return `
        <div class="gop-card" style="max-width:380px">
          <div class="gop-card-header">
            <span class="gop-card-icon">📅</span>
            <span class="gop-card-name">${f.name}</span>
          </div>
          <div class="gop-card-footer">
            <a class="btn btn-primary btn-sm" href="${viewerUrl}" target="_blank" rel="noopener">Open Planner</a>
          </div>
        </div>`;
      }).join('')}
    </div>` : '';

  setContent(`
    <div class="view-header">
      <div>
        <h1 class="view-title">GATE-O-PEDIA</h1>
        <div class="view-sub">Quick-reference revision sheets for all subjects</div>
      </div>
    </div>
    <p class="gop-intro">Use GATE-O-PEDIA sheets during your final revision sprint. Each sheet summarizes a subject's key formulas, concepts and PYQ patterns.</p>
    ${plannerSection}
    <h2 style="font-size:1rem;font-weight:700;margin-bottom:14px">📖 Subject Reference Sheets</h2>
    <div class="gop-grid">${gopCards}</div>
  `);
}

/* ═══════════════════════════════════════════════════════════════════════
   PDF VIEWER
   ═══════════════════════════════════════════════════════════════════════ */
const PdfViewer = {
  prepOpen(files, index, sid, tid) {
    const file = files && files[index];
    if (!file) return;
    Progress.setLastOpened({ path: file.path, name: file.name, sid, tid });
  },

  open(files, index, sid, tid) {
    const file = files && files[index];
    if (!file) return;
    this.prepOpen(files, index, sid, tid);
    const url = getViewerUrl(sid, tid, index, file);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  openFromLast() {
    const last = Progress.getLastOpened();
    if (!last) return;
    let fileIdx = 0;
    if (window.studyData && window.studyData[last.sid]?.topics?.[last.tid]) {
      const topic = window.studyData[last.sid].topics[last.tid];
      fileIdx = Math.max(0, topic.files.findIndex(f => f.path === last.path));
    }
    const url = getViewerUrl(last.sid, last.tid, fileIdx, { path: last.path, name: last.name });
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   EVENTS
   ═══════════════════════════════════════════════════════════════════════ */
function closeSidebar() {
  const sb = $('sidebar'); const ov = $('sidebar-overlay');
  sb.classList.remove('open');
  ov.classList.remove('visible');
  $('menu-btn').setAttribute('aria-expanded', 'false');
}
function openSidebar() {
  $('sidebar').classList.add('open');
  $('sidebar-overlay').classList.add('visible');
  $('menu-btn').setAttribute('aria-expanded', 'true');
}

function initEvents() {
  // Hamburger
  $('menu-btn').addEventListener('click', () => {
    $('sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
  });
  $('sidebar-close').addEventListener('click', closeSidebar);
  $('sidebar-overlay').addEventListener('click', closeSidebar);

  // Nav links
  qsa('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const view = a.dataset.view;
      Router.navigate(view);
    });
  });

  // PDF modal buttons (modal kept in HTML but no longer primary viewer)
  if ($('pdf-prev'))    $('pdf-prev').addEventListener('click', () => PdfViewer.navigate?.(-1));
  if ($('pdf-next'))    $('pdf-next').addEventListener('click', () => PdfViewer.navigate?.(1));
  if ($('pdf-close'))   $('pdf-close').addEventListener('click', () => PdfViewer.close?.());
  if ($('pdf-modal-overlay')) $('pdf-modal-overlay').addEventListener('click', () => PdfViewer.close?.());
  if ($('pdf-complete')) $('pdf-complete').addEventListener('click', () => PdfViewer.toggleComplete?.());

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { PdfViewer.close(); closeSidebar(); }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault(); Router.navigate('search');
    }
    if (!$('pdf-modal').hidden) {
      if (e.key === 'ArrowLeft')  PdfViewer.navigate(-1);
      if (e.key === 'ArrowRight') PdfViewer.navigate(1);
    }
  });

  // Global search (topbar)
  let searchTimer;
  $('topbar-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      Router.navigate('search');
      setTimeout(() => {
        const inp = $('search-input');
        if (inp) { inp.value = e.target.value; doSearch(e.target.value); }
      }, 50);
    }, 300);
  });
  $('topbar-search').addEventListener('focus', () => {
    if (Router.view !== 'search') Router.navigate('search');
  });

  // Logo click
  qs('.logo').addEventListener('click', (e) => { e.preventDefault(); Router.navigate('dashboard'); });
}

/* ═══════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════ */
function init() {
  Progress.load();
  initEvents();
  Router.init();
  updateSidebarProgress();
  startClock();
}

init();
