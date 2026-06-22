# Site navigation component

Reusable header + mega menus live in three files:

| File | Role |
|------|------|
| `css/page-nav.css` | All nav + mega menu styles (smooth hover transitions). |
| `partials/page-nav.html` | Header markup only (no `<html>` / `<body>`). |
| `js/page-nav-loader.js` | Fetches the partial into `#jc-site-nav-mount` on `DOMContentLoaded`. If `fetch` fails, uses `window.__PAGE_NAV_FALLBACK__` from **`js/page-nav-html-bundled.js`** (or a `<template id="jc-nav-inline">`). |
| `js/page-nav-html-bundled.js` | Optional: embeds the same markup as `partials/page-nav.html` as a string so **`file://`** pages still get the nav. Regenerate after editing the partial (see below). |
| `js/page-nav-mobile.js` | Hamburger + slide-out drawer + accordion megas at **≤1100px**; collapsible search; loyalty chip; **Log In** modal (reads **`data/customer.txt`**, merges browser-registered users from `localStorage`, `sessionStorage` session, header **Sign out**). |

## Customers & loyalty (no database)

There is **no server database**. The site approximates one this way:

1. **`data/customer.txt`** — seed accounts (JSON Lines: one JSON object per line; lines starting with `#` are comments). Each row includes `email`, `password`, `name`, `mobile`, `loyaltyPoints`. Served over **HTTP** (e.g. `npx serve`) so `fetch('data/customer.txt')` can load it.
2. **`localStorage`** key `looplab-studio-customers-local` — every successful **Register** appends a row here. At runtime it is **merged** with the file list (same email in local storage overrides the file row).
3. **Sign in** checks the merged list: email + password must match. **Passwords are stored in plain text** (demo only — not for production).

Guests show **0** loyalty pts. After sign-in, the chip uses each account’s `loyaltyPoints` (seed file or **0** for newly registered users). The main nav shows **“Hi, …”** with the signed-in name (from the session, or the part before `@` if no name).

**Cart redemption:** On `cart.html`, signed-in shoppers can redeem points in blocks of **100** for **₹50** off per block; the discount is merged into the USD cart total using a fixed demo INR→USD rate (see `js/page-cart-page.js`). `js/page-nav-mobile.js` exposes **`window.LoopLabCustomerSession`** (`isSignedIn`, `getLoyaltyPoints`) for the cart script. Use the **slider**, **number field + Apply**, or **Enter** in the field; redemption is stored in **`sessionStorage`** key `looplab_cart_loyalty_redeem_pts_v1` (demo only — points are not deducted from the account balance).

**Default seed** (also used if the file is empty or `fetch` fails, e.g. `file://`): `arjun@gmail.com` / `elrin@gmail.com` / `mike@gmail.com` with password **`123`** and the loyalty values above.

You **cannot** append to `customer.txt` from the browser without a small backend; use the file for staff-edited seeds and **Register** for “new customers” stored in the browser on that device only.

## Use on any page

1. In `<head>`:

```html
<link rel="stylesheet" href="css/page-nav.css" />
```

Before `</body>` (with the mount div above these scripts):

```html
<script src="js/page-nav-html-bundled.js" defer></script>
<script src="js/page-nav-loader.js" defer></script>
<script src="js/page-nav-mobile.js" defer></script>
```

The bundled script must run **before** the loader so `window.__PAGE_NAV_FALLBACK__` exists when `fetch` fails (e.g. opening HTML from disk). Over HTTP, the loader still fetches the partial so you only maintain **`partials/page-nav.html`**; regenerate the bundle when that file changes.

**Regenerate `js/page-nav-html-bundled.js`** (from the project folder, requires Node):

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('partials/page-nav.html','utf8');fs.writeFileSync('js/page-nav-html-bundled.js','(function(){window.__PAGE_NAV_FALLBACK__='+JSON.stringify(h)+';})();');"
```

2. After `<body>` (or where the header should appear):

```html
<div id="jc-site-nav-mount" data-nav-partial="partials/page-nav.html"></div>
```

Adjust `data-nav-partial` if your folder layout differs.

If the header is **inlined** (no loader) on a one-off page, skip the bundled + loader scripts; still add **`page-nav-mobile.js`** so the menu button works on small screens. **`index.html`** uses the same mount + loader + bundle pattern as the category pages so nav edits stay in **`partials/page-nav.html`** only.

## Local preview

`fetch()` does not load other files from `file://` unless the browser allows it. You can either:

1. **Serve over HTTP** (recommended while developing). From the project folder:

```bash
npx --yes serve . -p 3000
```

Then open `http://localhost:3000/men.html` (or any page).

2. **Open HTML from disk** — include **`js/page-nav-html-bundled.js`** before **`js/page-nav-loader.js`** (category pages, **`index.html`**, and cart in this repo already do). Regenerate the bundle after editing **`partials/page-nav.html`** (command in **Use on any page** above).

## Category pages (top nav)

These match the nine primary nav labels and load the same header/footer partials:

`new.html`, `women.html`, `men.html`, `kids.html`, `cashmere.html`, **`linen-landing.html`** (linen campaign story; links to `linen.html` shop), `linen.html`, `swim.html`, `petites.html`, `sale.html`, **`index.html`** (home; loads the same partial via `#jc-site-nav-mount`), **`lookbook.html`** (editorial), **`journal.html`** (studio notes), **`products.html`** (catalog), **`product.html`** (product detail; uses `data/products.json`), **`cart.html`** (shopping bag layout; bag icon in the header links here).

Top-level nav links in `partials/page-nav.html` point to those files. **`page-nav-loader.js`** dispatches a **`page-nav-loaded`** event after the header is injected so **`page-nav-mobile.js`** can attach the hamburger behavior on those pages.

## Link URLs

Every item in the mega panels is an `<a href="#">` (including column titles). Replace `#` with your real paths when you wire the site (for example `/women/new-arrivals`).

## Without JavaScript

Copy the entire contents of `partials/page-nav.html` and paste them in place of the empty `#jc-site-nav-mount` div (replace the mount with the pasted `<header class="jc-site-header">…</header>`).

## Single-file home (`cloud.html`)

`cloud.html` is a **generated** copy of **`index.html`** with **inlined** `css/page-home.css`, `css/page-nav.css`, `css/page-footer.css`, the full **`partials/page-nav.html`** (header + sign-in modal), and the same bottom-of-page scripts **except** `page-nav-loader.js` / `page-nav-html-bundled.js` (nav is already in the document). Regenerate after changing styles, nav, or home scripts:

```bash
node scripts/build-cloud-html.mjs
```

Keep **`cloud.html` at the repo root** so `image/…`, `data/customer.txt`, and links like `new.html` still resolve. Other catalog pages are **not** merged into that file; they remain normal `.html` siblings.

## Site footer

See **[FOOTER.md](./FOOTER.md)** for `partials/footer.html`, `css/page-footer.css`, and `js/page-footer-loader.js`.
