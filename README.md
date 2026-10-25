# GATE HUB — CS Preparation Dashboard

A fully static, offline-capable GATE CS preparation dashboard.  
Open `index.html` in any browser — no server, no build step, no login required.

---

## Folder Structure

```
PW/
├── index.html          ← Main page (SPA shell)
├── style.css           ← Dark-mode styles
├── script.js           ← All app logic + PDF data
├── README.md           ← This file
└── pdfs/
    ├── algorithms/
    ├── aptitude/
    ├── c-programming/
    ├── compiler-design/
    ├── computer-networks/
    ├── computer-organization/
    ├── dbms/
    ├── digital-logic/
    ├── discrete-mathematics/
    ├── engineering-mathematics/
    ├── gate-o-pedia/
    ├── miscellaneous/
    ├── operating-systems/
    ├── programming-ds/
    └── theory-of-computation/
```

---

## How to Open

### Option 1 — Direct (simplest)
Double-click `index.html`. It will open in your default browser.  
> ⚠️ PDF embedding in iframes may be blocked on `file://` in some browsers.  
> If PDFs don't embed, click **"Open PDF in New Tab"** — they will always open there.

### Option 2 — Local web server (recommended for full PDF embedding)
```bash
# Using Python (built-in on most systems)
cd "C:\Users\vrushank\OneDrive\Desktop\PW"
python -m http.server 8080
# Then open: http://localhost:8080

# Using Node.js
npx serve .
# Then open the URL shown in terminal
```

---

## How to Add PDFs

### Step 1 — Place the PDF in the correct subject folder
```
pdfs/operating-systems/My New Notes.pdf
```

### Step 2 — Open `script.js` and find the subject
Search for `"operating-systems":` — it starts around line 200.

### Step 3 — Add an entry to an existing topic (or create a new topic)

**Adding to an existing topic:**
```js
"cpu-scheduling": { name: "CPU Scheduling", files: [
  // ... existing entries ...

  // ← ADD YOUR NEW ENTRY HERE:
  { name: "CPU Scheduling — Class Notes 07", type: "Class Notes",
    path: "pdfs/operating-systems/CPU Scheduling 07 _ Class Notes.pdf" },
]},
```

**Creating a new topic:**
```js
"basics-of-os": { name: "Basics of OS", files: [
  { name: "Basics of OS — Class Notes", type: "Class Notes",
    path: "pdfs/operating-systems/Basics of OS _ Class Notes.pdf" },
]},
```

### Supported `type` values
| Type | Badge |
|---|---|
| `"Class Notes"` | 📘 |
| `"DPP"` | 📝 |
| `"DPP Discussion"` | 💬 |
| `"GATE-O-PEDIA"` | 📖 |
| `"Lecture Planner"` | 📅 |
| `"Reference"` | 📄 |

---

## How to Add a New Subject

At the top of the `studyData` object in `script.js`, add:

```js
"my-new-subject": {
  name: "My New Subject",
  icon: "📌",
  color: "#f59e0b",        // any CSS color
  description: "Short description of the subject.",
  topics: {
    "topic-one": { name: "Topic One", files: [
      { name: "Topic One — Class Notes 01", type: "Class Notes",
        path: "pdfs/my-new-subject/Topic One 01 _ Class Notes.pdf" },
    ]},
  }
},
```

Then create the folder `pdfs/my-new-subject/` and place PDFs inside.

---

## Progress Tracking

- Progress is stored in your **browser's localStorage** under the key `gate_hub_v1`.
- Marking a PDF complete updates subject and overall progress bars immediately.
- Your last-opened PDF is remembered and shown on the Dashboard under **"Continue Studying"**.
- Progress is per-browser. To transfer progress, export localStorage manually.

### Clear progress (reset)
Open browser DevTools → Console → type:
```js
localStorage.removeItem('gate_hub_v1'); location.reload();
```

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Overall stats, progress ring, continue studying |
| **Subjects** | Cards for all 14 subjects with progress bars |
| **Topics** | Accordion within each subject; grouped by type |
| **PDF Cards** | Open, Download, Mark Complete per file |
| **PDF Viewer** | Full-screen modal with Prev/Next navigation |
| **Search** | Real-time search across all subjects/topics/PDFs |
| **Roadmap** | 5-phase preparation plan with clickable subject chips |
| **GATE-O-PEDIA** | Dedicated section for quick-reference PDFs |
| **Progress** | localStorage-backed, no login needed |
| **Keyboard** | `/` → Search, `Esc` → Close, `←/→` → Navigate PDFs |

---

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages → Source → Deploy from branch → `main` / `root`**.
3. Your site will be live at `https://yourusername.github.io/repo-name/`.

> ✅ PDFs in `pdfs/` are served as static files — no configuration needed.

---

## Deploy to Vercel / Netlify

**Vercel:**
```bash
npx vercel --prod
```

**Netlify:**  
Drag-and-drop the entire `PW/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

Both platforms serve static files including PDFs — no configuration needed.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus Search |
| `Esc` | Close PDF viewer / sidebar |
| `← →` | Navigate PDFs in viewer |

---

*Built as a personal GATE preparation system. All study, no fluff.*
