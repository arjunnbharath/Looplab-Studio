const fs = require("fs");
/**
 * Rebuilds products.html catalog grid from department pages:
 * women, men, kids, linen, cashmere, petites, new (in that order).
 * Run from repo root: node scripts/build-products-all-grid.cjs
 */
const path = require("path");

const root = path.join(__dirname, "..");

function extractArticles(html) {
  const re = /<article class="pd-card"[\s\S]*?<\/article>/g;
  return html.match(re) || [];
}

function fixNewArticle(art, i) {
  let s = art
    .replace(/<h3 class="pd-card-title"/g, '<h2 class="pd-card-title"')
    .replace(/<\/h3>/g, "</h2>");
  if (!/data-product-id=/.test(s)) {
    s = s.replace(
      '<article class="pd-card">',
      `<article class="pd-card" data-product-id="new-${i + 1}">`
    );
  }
  if (!/pd-card-add/.test(s)) {
    s = s.replace(
      "</article>",
      `          <button type="button" class="pd-card-add" data-add-to-bag="">Add to cart</button>\n        </article>`
    );
  }
  return s;
}

const women = extractArticles(fs.readFileSync(path.join(root, "women.html"), "utf8"));
const men = extractArticles(fs.readFileSync(path.join(root, "men.html"), "utf8"));
const kids = extractArticles(fs.readFileSync(path.join(root, "kids.html"), "utf8"));
const linen = extractArticles(fs.readFileSync(path.join(root, "linen.html"), "utf8"));
const cashmere = extractArticles(
  fs.readFileSync(path.join(root, "cashmere.html"), "utf8")
);
const petites = extractArticles(fs.readFileSync(path.join(root, "petites.html"), "utf8"));

const newHtml = fs.readFileSync(path.join(root, "new.html"), "utf8");
const newRaw = extractArticles(newHtml);
const newFixed = newRaw.map(fixNewArticle);

const all = [
  ...women,
  ...men,
  ...kids,
  ...linen,
  ...cashmere,
  ...petites,
  ...newFixed,
];

const productsPath = path.join(root, "products.html");
let products = fs.readFileSync(productsPath, "utf8");

const startMarker = '<div class="pd-grid">';
const endMarker = '</div>\n    </div>\n\n    <nav class="pd-pagination"';
const sIdx = products.indexOf(startMarker);
const eIdx = products.indexOf(endMarker);
if (sIdx < 0 || eIdx < 0) {
  console.error("Could not find grid markers in products.html", sIdx, eIdx);
  process.exit(1);
}
const innerStart = sIdx + startMarker.length;
const gridInner = "\n" + all.map((a) => "        " + a.trim()).join("\n") + "\n      ";

products =
  products.slice(0, innerStart) + gridInner + products.slice(eIdx);

const count = all.length;
products = products.replace(
  /<span class="pd-hero-count">[^<]*<\/span>/,
  `<span class="pd-hero-count">${count} styles · all shops</span>`
);
products = products.replace(
  /Names and prices are demo placeholders until you wire PDPs\./,
  "Women, men, kids, linen, cashmere, petites, and new arrivals—combined from each shop page."
);

const chipsNeedle = `<ul class="pd-chips">
          <li><a href="products.html" aria-current="true">All</a></li>
          <li><a href="new.html">New</a></li>
          <li><a href="women.html">Women</a></li>
          <li><a href="men.html">Men</a></li>
          <li><a href="kids.html">Kids</a></li>
          <li><a href="sale.html">Sale</a></li>
        </ul>`;
const chipsReplace = `<ul class="pd-chips">
          <li><a href="products.html" aria-current="true">All</a></li>
          <li><a href="new.html">New</a></li>
          <li><a href="women.html">Women</a></li>
          <li><a href="men.html">Men</a></li>
          <li><a href="kids.html">Kids</a></li>
          <li><a href="linen.html">Linen</a></li>
          <li><a href="cashmere.html">Cashmere</a></li>
          <li><a href="petites.html">Petites</a></li>
          <li><a href="sale.html">Sale</a></li>
        </ul>`;
if (products.includes(chipsNeedle)) {
  products = products.replace(chipsNeedle, chipsReplace);
} else if (!products.includes('href="linen.html"')) {
  console.warn("Chip block pattern not found; skipping toolbar update");
}

fs.writeFileSync(productsPath, products);
console.log(
  "products.html:",
  count,
  "cards (women",
  women.length,
  "men",
  men.length,
  "kids",
  kids.length,
  "linen",
  linen.length,
  "cashmere",
  cashmere.length,
  "petites",
  petites.length,
  "new",
  newFixed.length,
  ")"
);
console.log(
  "Tip: run node scripts/build-products-catalog.cjs to refresh data/products.json for product.html."
);
