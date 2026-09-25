const fs = require('fs');
const path = require('path');

const rawData = fs.readFileSync('import_abc_ceramica.mjs', 'utf8');
const lines = rawData.split('const rawData = `')[1].split('`;')[0].trim().split('\n');

let md = '# Catálogo ABC Cerâmica - Lista de Produtos\n\n';
md += 'Aqui estão todos os modelos base extraídos do PDF. Cada um deles foi desmembrado no sistema de acordo com as variações de preço (Natural, Verniz, Fulget, etc.).\n\n';
md += '| Nome do Produto | Medidas (Alt / D.S / D.I) | Preços Encontrados |\n';
md += '|---|---|---|\n';

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('.')) continue;

  // Split by R$
  const parts = line.split('R$');
  const nomeEMedidas = parts[0].trim();
  const precos = parts.slice(1).map(p => 'R$ ' + p.trim()).join(' / ');
  
  // Extract Medidas (last numbers before prices)
  const tokens = nomeEMedidas.split(' ');
  const medidas = [];
  while (tokens.length > 0 && /^[0-9,.]+$/.test(tokens[tokens.length - 1])) {
    medidas.unshift(tokens.pop());
  }
  
  const nome = tokens.join(' ');
  const medidasStr = medidas.join(' / ');
  
  md += `| ${nome} | ${medidasStr || '-'} | ${precos || '-'} |\n`;
}

const artifactPath = "C:\\Users\\Lucas\\.gemini\\antigravity-ide\\brain\\ca9c4119-cb4b-4180-96b1-a8f593dc5884\\catalogo_abc_ceramica.md";
fs.writeFileSync(artifactPath, md);
console.log('Artifact created at:', artifactPath);
