import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !full.includes("node_modules") && !full.includes("dist")) walk(full, files);
    else if (full.endsWith(".tsx")) files.push(full);
  }
  return files;
}

const files = walk("./src");
let alterados = [];

for (const file of files) {
  let txt = fs.readFileSync(file, "utf8");
  const original = txt;

  if (txt.includes("Histórico de correções") && !txt.includes("Última missão concluída")) {
    txt = txt.replace(
      /(<[^>]*>\s*Histórico de correções.*?<\/[^>]*>)/,
      `
<div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
  ✅ Última missão concluída com build OK
</div>

$1`
    );
  }

  if (txt !== original) {
    fs.writeFileSync(file, txt);
    alterados.push(file);
  }
}

console.log("Arquivos alterados:", alterados);
