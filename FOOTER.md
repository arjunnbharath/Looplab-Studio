# Site footer component

Black footer markup lives in **`partials/footer.html`**. Styles are in **`css/page-footer.css`**. **`js/page-footer-loader.js`** injects the partial into the mount point. Include **`js/page-footer-html-bundled.js` before** the loader so the footer still appears when `fetch` fails (for example opening pages from disk with **`file://`**).

## Use on any page

1. In `<head>` (paths relative to the page):

```html
<link rel="stylesheet" href="css/page-footer.css" />
```

2. Immediately **after** `</main>` (or at the end of `<body>` with your other scripts):

```html
<div id="jc-site-footer-mount" data-footer-partial="partials/footer.html"></div>
<script src="js/page-footer-html-bundled.js" defer></script>
<script src="js/page-footer-loader.js" defer></script>
```

The bundled script must run **before** the loader so `window.__PAGE_FOOTER_FALLBACK__` exists when `fetch` fails. Over HTTP, the loader still fetches **`partials/footer.html`** so you only maintain that file; **regenerate the bundle** when the partial changes:

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('partials/footer.html','utf8');fs.writeFileSync('js/page-footer-html-bundled.js','(function(){window.__PAGE_FOOTER_FALLBACK__='+JSON.stringify(h)+';})();');"
```

Change `data-footer-partial` if your file lives elsewhere.

## Local preview

**HTTP (recommended):** from the project folder:

```bash
npx --yes serve . -p 3000
```

Then open e.g. `http://localhost:3000/men.html`.

**`file://`:** keep **`page-footer-html-bundled.js`** before **`page-footer-loader.js`** (category pages and cart in this repo do). Regenerate the bundle after editing **`partials/footer.html`** (command above).

## Without JavaScript

Copy the full contents of **`partials/footer.html`** and replace the empty `#jc-site-footer-mount` div with that markup (so the `<footer class="jc-site-footer">…</footer>` is in the page directly).

## Newsletter form

The email field is a static demo (`action="#"`). Wire it to your service or backend when ready.
