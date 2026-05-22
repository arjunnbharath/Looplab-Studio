# Site navigation component

Reusable header + mega menus live in three files:

| File | Role |
|------|------|
| `css/jcrew-nav.css` | All nav + mega menu styles (smooth hover transitions). |
| `partials/jcrew-nav.html` | Header markup only (no `<html>` / `<body>`). |
| `js/jcrew-nav-loader.js` | Fetches the partial into `#jc-site-nav-mount` on `DOMContentLoaded`. |
| `js/jcrew-nav-mobile.js` | Hamburger + slide-out drawer + accordion megas at **≤1100px** (include whenever the header is on the page). |

## Use on any page

1. In `<head>`:

```html
<link rel="stylesheet" href="css/jcrew-nav.css" />
<script src="js/jcrew-nav-loader.js" defer></script>
<script src="js/jcrew-nav-mobile.js" defer></script>
```

If the header is **inlined** (no loader), still add **`jcrew-nav-mobile.js`** so the menu button works on small screens.

2. After `<body>` (or where the header should appear):

```html
<div id="jc-site-nav-mount" data-nav-partial="partials/jcrew-nav.html"></div>
```

Adjust `data-nav-partial` if your folder layout differs.

## Local preview

`fetch()` does not work from `file://`. From the project folder run:

```bash
npx --yes serve . -p 3000
```

Then open `http://localhost:3000/home.html`.

## Category pages (top nav)

These match the nine primary nav labels and load the same header/footer partials:

`new.html`, `women.html`, `men.html`, `kids.html`, `cashmere.html`, `linen.html`, `swim.html`, `petites.html`, `sale.html`, **`cart.html`** (shopping bag layout; bag icon in the header links here).

Top-level nav links in `partials/jcrew-nav.html` point to those files. **`jcrew-nav-loader.js`** dispatches a **`jcrew-nav-loaded`** event after the header is injected so **`jcrew-nav-mobile.js`** can attach the hamburger behavior on those pages.

## Link URLs

Every item in the mega panels is an `<a href="#">` (including column titles). Replace `#` with your real paths when you wire the site (for example `/women/new-arrivals`).

## Without JavaScript

Copy the entire contents of `partials/jcrew-nav.html` and paste them in place of the empty `#jc-site-nav-mount` div (replace the mount with the pasted `<header class="jc-site-header">…</header>`).

## Site footer

See **[FOOTER.md](./FOOTER.md)** for `partials/footer.html`, `css/jcrew-footer.css`, and `js/jcrew-footer-loader.js`.
