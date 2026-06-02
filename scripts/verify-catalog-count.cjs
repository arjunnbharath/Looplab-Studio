const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function extractArticles(html) {
  const re = /<article class="pd-card"[\s\S]*?<\/article>/g;
  return html.match(re) || [];
}

const sourceFiles = [
  "swim.html",
  "sale.html",
  "women.html",
  "men.html",
  "kids.html",
  "linen.html",
  "cashmere.html",
  "petites.html",
  "new.html",
  "bags.html",
  "products.html",
];

const map = new Map();
let newCounter = 0;

for (const file of sourceFiles) {
  const fp = path.join(root, file);
  if (!fs.existsSync(fp)) continue;
  const html = fs.readFileSync(fp, "utf8");
  for (const art of extractArticles(html)) {
    let forcedId = null;
    if (file === "new.html" && !/data-product-id=/.test(art)) {
      newCounter += 1;
      forcedId = "new-" + newCounter;
    }
    const idM = art.match(/data-product-id="([^"]*)"/);
    const id = forcedId || (idM && idM[1]);
    if (id) map.set(id, file);
  }
}

const j = JSON.parse(fs.readFileSync(path.join(root, "data", "products.json"), "utf8"));
const jsonIds = new Set(j.products.map((p) => p.id));

console.log("Source pages scanned:", sourceFiles.join(", "));
console.log("Unique product ids (merge order, last wins):", map.size);
console.log("products.json products.length:", j.products.length);
console.log("byDepartment keys:", Object.keys(j.byDepartment || {}).join(", "));

const onlyMap = [...map.keys()].filter((id) => !jsonIds.has(id));
const onlyJson = [...jsonIds].filter((id) => !map.has(id));
console.log("Ids in merged HTML but missing from JSON:", onlyMap.length, onlyMap.slice(0, 8));
console.log("Ids in JSON but missing from merged HTML:", onlyJson.length, onlyJson.slice(0, 8));
