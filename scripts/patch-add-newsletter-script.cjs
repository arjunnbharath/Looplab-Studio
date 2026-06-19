const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const files = fs.readdirSync(root).filter((f) => f.endsWith(".html"));

const needle = '<script src="js/page-footer-loader.js" defer></script>';
const insert =
  needle + "\n  <script src=\"js/page-newsletter.js\" defer></script>";

for (const f of files) {
  const fp = path.join(root, f);
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes(needle) || s.includes("page-newsletter.js")) continue;
  fs.writeFileSync(fp, s.replace(needle, insert), "utf8");
  console.log("patched", f);
}
