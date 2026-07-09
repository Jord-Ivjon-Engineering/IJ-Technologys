# IJ Technologys

A marketing site for **IJ Technologys** — a web studio building websites, online shops and custom digital products.

The single monolithic HTML page was split into a proper **frontend** (static assets) and **backend** (an Express server that serves those assets and handles the contact form).

## Structure

```
.
├── frontend/                 # everything the browser loads
│   ├── index.html            # markup only
│   ├── admin.html            # review moderation page (token-gated)
│   ├── css/
│   │   └── styles.css        # all styles
│   └── js/
│       ├── main.js           # UI logic + Three.js scenes
│       ├── contact.js        # contact form → POST /api/contact
│       └── reviews.js        # review form + feeds the clients marquee
│
├── backend/                  # Node/Express server
│   ├── server.js             # app entry: serves frontend + mounts the API
│   ├── routes/
│   │   ├── contact.js        # POST /api/contact (validate + store)
│   │   └── reviews.js        # reviews API + moderation (approve/reject)
│   ├── lib/
│   │   └── store.js          # append-only JSON stores
│   └── data/                 # submissions.json + reviews.json (git-ignored)
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
- A "Leave a review" form; approved reviews flow into the looping "What clients say" marquee
- Fully responsive, respects `prefers-reduced-motion`

Three.js and the Google Fonts still load from their CDNs.

## Backend

A small Express server that:

- serves the `frontend/` directory as static files
- exposes `GET /api/health`
- exposes `POST /api/contact` — validates `{ name, email, message }` and appends it to `backend/data/submissions.json`
- exposes the reviews API (see below)

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start        # or: npm run dev  (auto-restarts on changes)
```

Then open <http://localhost:4000>.

### Contact API

```bash
curl -X POST http://localhost:4000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","message":"I would like a shop."}'
```

Returns `{ "ok": true, "message": "Submission received." }` on success, or
`400` with `{ "ok": false, "fields": ["email"] }` listing invalid fields.

### Reviews API & moderation

Visitors submit reviews with `{ name, role, rating, text }`. Submissions are
stored as **pending** and only appear in the clients marquee once approved.

Public:

- `GET  /api/reviews` — approved reviews, newest first
- `POST /api/reviews` — submit a review (stored pending)

Owner-only (send `Authorization: Bearer <ADMIN_TOKEN>` or `?token=<ADMIN_TOKEN>`):

- `GET    /api/reviews/pending` — reviews awaiting approval
- `POST   /api/reviews/:id/approve` — publish a review
- `DELETE /api/reviews/:id` — reject/remove a review

Moderate from the browser at **`/admin.html`** — enter your admin token, then
approve or reject pending reviews.

`ADMIN_TOKEN` is read from the environment (see `.env.example`); it falls back to
an insecure dev token if unset, so **set a strong value in production**, e.g.:

```bash
ADMIN_TOKEN=$(openssl rand -hex 24) PORT=4000 npm start
```

## License

© 2026 IJ Technologys. All rights reserved.
