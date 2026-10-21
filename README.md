# FlyTripVisa Admin

A fully responsive, dark-themed, glassmorphic authentication & admin dashboard
for **FlyTripVisa**. Built with vanilla JavaScript, HTML5, and a shared CSS
design system — no framework dependencies, zero build step.

## 📁 Structure

```
.
├── index.html              # Landing / home (brand style reference)
├── login.html              # Admin login
├── signup.html             # Admin registration
├── dashboard.html          # Protected admin dashboard
├── admin.html              # Alias → dashboard (backward compat)
├── wrangler.toml           # Cloudflare Pages / Workers config
├── _redirects              # Clean URLs (Cloudflare Pages)
├── _headers                # Security headers (Cloudflare Pages)
└── assets/
    ├── css/
    │   └── style.css       # Shared design system
    └── js/
        ├── auth.js         # Registration, login, session, PBKDF2 hashing
        └── dashboard.js    # Sidebar, metrics, tables, filters, charts
```

## 🚀 Deploy to Cloudflare Pages

1. Push this repo to GitHub (replace the existing files).
2. Go to **Cloudflare Dashboard → Pages → Create a project → Connect to Git**.
3. Select the `FlyTripVisa/admin` repository.
4. **Build settings**:
   - Framework preset: `None`
   - Build command: _(leave empty)_
   - Build output directory: `/` (root)
5. Click **Save and Deploy**.

That's it — Cloudflare Pages will serve the static files with the
security headers and redirects defined in `_headers` and `_redirects`.

## 🔐 Authentication (Demo)

Passwords are hashed client-side with **PBKDF2 (SHA-256, 100k iterations)**
via the Web Crypto API. Nothing is stored in plain text.

> **Note:** This is a frontend demo. For production, wire `auth.js` to a
> Cloudflare Worker or D1 database for persistent, server-side user storage.

### Default behavior
- Visit `/login.html` → sign in or register via `/signup.html`.
- On success, you're redirected to `/dashboard.html`.
- The dashboard guards the route — unauthenticated visitors are bounced
  back to `/login.html`.

## 🎨 Design

Matches the FlyTripVisa brand:
- Solid black background with radial green glow
- Glassmorphism cards (`backdrop-filter: blur`)
- Brand color `#07c160` for accents & CTAs
- Fully responsive mobile-first layout
- Font Awesome 6.6 icons

## 🛠 Local Development

Since this is plain HTML/CSS/JS, you can use any static server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# Then open http://localhost:8000
```

## 📝 License

© 2020–2026 Fly Trip Visa. All Rights Reserved.
