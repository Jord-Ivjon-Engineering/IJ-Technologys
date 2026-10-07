# IJ Technology



A marketing site for **IJ Technology** â€” a web studio building websites, online shops and custom digital products.



The single monolithic HTML page was split into a proper **frontend** (static assets) and **backend** (an Express server that serves those assets and handles the contact form).



## Structure



```

.

â”œâ”€â”€ frontend/                 # everything the browser loads

â”‚   â”œâ”€â”€ index.html            # markup only (CMS-hydrated via content.js)

â”‚   â”œâ”€â”€ css/

â”‚   â”‚   â””â”€â”€ styles.css        # all styles

â”‚   â””â”€â”€ js/

â”‚       â”œâ”€â”€ main.js           # UI logic + Three.js scenes

â”‚       â”œâ”€â”€ contact.js        # contact form â†’ POST /api/contact

â”‚       â”œâ”€â”€ content.js        # CMS hydration from GET /api/content/public

â”‚       â””â”€â”€ reviews.js        # review form + feeds the clients marquee

â”‚

â”œâ”€â”€ apps/crm/                 # Vite CRM admin (dist served at /crm)

â”‚   â”œâ”€â”€ src/                  # pages, components, auth, API client

â”‚   â””â”€â”€ dist/                 # production build output

â”‚

â”œâ”€â”€ backend/                  # Node/Express server

â”‚   â”œâ”€â”€ server.js             # app entry: serves frontend + mounts the API

â”‚   â”œâ”€â”€ middleware/

â”‚   â”‚   â””â”€â”€ requireAdmin.js   # Supabase JWT + admin_profiles gate

â”‚   â”œâ”€â”€ routes/

â”‚   â”‚   â”œâ”€â”€ contact.js        # POST /api/contact

â”‚   â”‚   â”œâ”€â”€ reviews.js        # public reviews GET/POST

â”‚   â”‚   â”œâ”€â”€ content.js        # GET /api/content/public

â”‚   â”‚   â””â”€â”€ crm/              # JWT-protected CRM API

â”‚   â”œâ”€â”€ lib/

â”‚   â”‚   â”œâ”€â”€ supabase.js       # service-role client

â”‚   â”‚   â”œâ”€â”€ auth.js           # anon client for JWT verification

â”‚   â”‚   â”œâ”€â”€ store.js          # reviews + contact submissions

â”‚   â”‚   â””â”€â”€ crmStore.js       # CRM + CMS data access

â”‚   â””â”€â”€ db/                   # Supabase SQL migrations

â”‚

â”œâ”€â”€ package.json

â”œâ”€â”€ .env.example

â””â”€â”€ README.md

```



## Frontend



- **Three.js** WebGL scenes â€” drifting particle background, a liquid-metal shader hero card, and a code-core tech globe with orbiting project cards

- Scroll-driven animations and an animated CSS "developer at the desk" illustration

- Bilingual UI (English / Albanian) with a language toggle

- A contact form wired to the backend

- A "Leave a review" form; approved reviews flow into the looping "What clients say" marquee

- Fully responsive, respects `prefers-reduced-motion`



Three.js and the Google Fonts still load from their CDNs.




## CRM frontend

The admin CRM is a Vite app in `apps/crm/` (built with base path `/crm/`).

```bash
cd apps/crm
npm install
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the repo root `.env`. Vite loads env from the repo root via `apps/crm/vite.config.js`.

From the repo root:

```bash
npm run dev:crm
npm run build:crm
```

- **Dev:** open http://localhost:5173/crm/ and run the Express backend (`npm start` or `npm run dev`) so `/api/crm/*` is proxied to port 4000.
- **Production:** run `npm run build:crm`, then serve `apps/crm/dist` at `/crm` from the backend (static files + SPA fallback).
## Backend



A small Express server that:



- serves the `frontend/` directory as static files

- exposes `GET /api/health`

- exposes `POST /api/contact` â€” validates `{ name, email, message, package? }` and stores in Supabase

- exposes the public reviews API (see below)

- exposes `GET /api/content/public` â€” aggregated published CMS content (single DB query)

- exposes `/api/crm/*` â€” admin CRM API (Supabase Auth JWT required)



## Run locally



Requires Node.js 18+.



```bash

npm install

cp .env.example .env

# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

npm start        # or: npm run dev  (auto-restarts on changes)

```



Apply database migrations from `backend/db/migrations/` in the Supabase SQL editor — see `backend/db/migrations/README.md` for the file order (start with `backend/db/reviews.sql`, then `0001` through `0010`; run `0011`/`0012` optionally to seed CMS content).



Create an Auth user in Supabase Dashboard, then add them to `admin_profiles`:



```sql

insert into admin_profiles (user_id, display_name)

values ('<auth-user-uuid>', 'Your Name');

```



Then open <http://localhost:4000>.

### CRM admin (`/crm`)

The CRM is a Vite app in `apps/crm/`. It uses Supabase Auth and talks to `/api/crm/*`.

```bash
npm install
cp .env.example .env
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the root `.env`.

```bash
npm run build:crm
npm start
```

Open <http://localhost:4000/crm/#/dashboard>.

For CRM-only development with API proxy:

```bash
npm run dev:crm
```

Vite serves the CRM at <http://localhost:5173/crm/> and proxies `/api` to port 4000 (run `npm run dev` in another terminal for the backend).

### Environment



| Variable | Purpose |

|---|---|

| `SUPABASE_URL` | Supabase project URL (server) |

| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; bypasses RLS for API operations |

| `SUPABASE_ANON_KEY` | Verifies CRM JWTs in `requireAdmin` middleware |

| `VITE_SUPABASE_URL` | CRM frontend build (anon key only) |

| `VITE_SUPABASE_ANON_KEY` | CRM frontend build |



### Contact API



```bash

curl -X POST http://localhost:4000/api/contact \

  -H "Content-Type: application/json" \

  -d '{"name":"Jane","email":"jane@example.com","message":"I would like a shop.","package":"Pro"}'

```



Returns `{ "ok": true, "message": "Submission received." }` on success, or

`400` with `{ "ok": false, "fields": ["email"] }` listing invalid fields.



### Public content API



```bash

curl http://localhost:4000/api/content/public

```



Returns bilingual hero, stats, showcase projects, pricing plans, and section blocks in one payload.



### Reviews API (public)



Visitors submit reviews with `{ name, role, rating, text }`. Ratings below 4â˜… are held for moderation.



- `GET  /api/reviews` â€” approved reviews (4â˜…+), newest first

- `POST /api/reviews` â€” submit a review



### CRM API (admin JWT)



Send `Authorization: Bearer <supabase_access_token>` from a user listed in `admin_profiles`.



| Method | Path | Purpose |

|---|---|---|

| GET | `/api/crm/dashboard` | KPIs (single aggregate query) |

| GET/POST/PATCH/DELETE | `/api/crm/clients` | Client CRUD |

| GET/POST/PATCH/DELETE | `/api/crm/projects` | Project CRUD (`?include=costs`) |

| GET/PATCH | `/api/crm/submissions` | Inbox; `POST /:id/convert` creates client |

| GET/PATCH/DELETE | `/api/crm/reviews` | Moderation (`?status=pending`) |

| GET/POST/PATCH/DELETE | `/api/crm/costs` | Project cost line items |

| GET | `/api/crm/finance/summary` | Revenue vs cost aggregates |

| GET/PUT | `/api/crm/content/settings` | Site settings |

| CRUD | `/api/crm/content/showcase` | Portfolio CMS |

| CRUD | `/api/crm/content/pricing` | Pricing CMS |

| CRUD | `/api/crm/content/sections` | Section blocks |

| POST | `/api/crm/media/upload` | Signed upload URL for `site-media` bucket |

| GET | `/api/crm/team` | List admin profiles |



Review moderation previously used `ADMIN_TOKEN` on `/api/reviews/pending` â€” that flow is deprecated in favour of `/api/crm/reviews`.



## License



Â© 2026 IJ Technology. All rights reserved.

