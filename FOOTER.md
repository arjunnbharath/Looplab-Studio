# Site footer component

Black footer markup lives in **`partials/footer.html`**. Styles are in **`css/jcrew-footer.css`**. **`js/jcrew-footer-loader.js`** injects the partial into the mount point (same pattern as the nav).

## Use on any page

1. In `<head>` (paths relative to the page):

```html
<link rel="stylesheet" href="css/jcrew-footer.css" />
<script src="js/jcrew-footer-loader.js" defer></script>
```

2. Immediately **after** `</main>` (or at the end of `<body>` before scripts):

```html
<div id="jc-site-footer-mount" data-footer-partial="partials/footer.html"></div>
```

Change `data-footer-partial` if your file lives elsewhere.

## Local preview

`fetch()` does not run on `file://`. From the project folder:

```bash
npx --yes serve . -p 3000
```

Then open e.g. `http://localhost:3000/home.html`.

## Without JavaScript

Copy the full contents of **`partials/footer.html`** and replace the empty `#jc-site-footer-mount` div with that markup (so the `<footer class="jc-site-footer">…</footer>` is in the page directly).

## Newsletter form

The email field is a static demo (`action="#"`). Wire it to your service or backend when ready.
