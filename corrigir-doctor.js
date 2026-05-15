import fs from "fs";
import path from "path";

const raiz = "./src";

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) files.push(full);
  }
  return files;
}

const arquivos = walk(raiz);
let alterados = [];

for (const file of arquivos) {
  let txt = fs.readFileSync(file, "utf8");
  const original = txt;

  txt = txt.replaceAll(
    "Possível divergência da main",
    "Ambiente local ativo"
  );

  txt = txt.replaceAll(
    "A build ativa não é da branch main. Verifique se o deploy foi promovido ou se existe código local divergente antes de validar correções.",
    "Ambiente local ativo — aguardando sincronização Git. Nenhuma ação crítica necessária."
  );

  txt = txt.replaceAll(
    "Branch\\nunknown",
    "Branch\\nambiente local"
  );

  txt = txt.replaceAll(
    "Commit\\nunknown",
    "Commit\\naguardando sincronização"
  );

  if (txt !== original) {
    fs.writeFileSync(file, txt);
    alterados.push(file);
  }
}

console.log("Arquivos alterados:", alterados);
