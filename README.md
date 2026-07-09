# IJ Technologys

A marketing site for **IJ Technologys** — a web studio building websites, online shops and custom digital products.

The single monolithic HTML page was split into a proper **frontend** (static assets) and **backend** (an Express server that serves those assets and handles the contact form).

## Structure

```
.
├── frontend/                 # everything the browser loads
│   ├── index.html            # markup only
│   ├── css/
│   │   └── styles.css        # all styles
│   └── js/
│       ├── main.js           # UI logic + Three.js scenes
│       └── contact.js        # contact form → POST /api/contact
│
├── backend/                  # Node/Express server
│   ├── server.js             # app entry: serves frontend + mounts the API
│   ├── routes/
│   │   └── contact.js        # POST /api/contact (validate + store)
│   ├── lib/
│   │   └── store.js          # append-only JSON store
│   └── data/                 # submissions.json (git-ignored, created at runtime)
│
├── package.json
├── .env.example
└── README.md
```

## Frontend

- **Three.js** WebGL scenes — drifting particle background, a liquid-metal shader hero card, and a code-core tech globe with orbiting project cards
- Scroll-driven animations and an animated CSS "developer at the desk" illustration
- Bilingual UI (English / Albanian) with a language toggle
- A contact form wired to the backend
- Fully responsive, respects `prefers-reduced-motion`

Three.js and the Google Fonts still load from their CDNs.

## Backend

A small Express server that:

- serves the `frontend/` directory as static files
- exposes `GET /api/health`
- exposes `POST /api/contact` — validates `{ name, email, message }` and appends it to `backend/data/submissions.json`

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start        # or: npm run dev  (auto-restarts on changes)
```

Then open <http://localhost:3000>.

### Contact API

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","message":"I would like a shop."}'
```

Returns `{ "ok": true, "message": "Submission received." }` on success, or
`400` with `{ "ok": false, "fields": ["email"] }` listing invalid fields.

## License

© 2026 IJ Technologys. All rights reserved.
