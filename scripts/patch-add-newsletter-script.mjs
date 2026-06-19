import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const files = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".html"))
  .map((f) => path.join(root, f));

const needle = '<script src="js/page-footer-loader.js" defer></script>';
const insert =
  needle + "\n  <script src=\"js/page-newsletter.js\" defer></script>";

for (const fp of files) {
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes(needle) || s.includes("page-newsletter.js")) continue;
  fs.writeFileSync(fp, s.replace(needle, insert), "utf8");
  console.log("patched", path.basename(fp));
}
