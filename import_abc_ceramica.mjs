import * as fs from 'fs';


const rawData = `
ALGUIDAR 1 5 18 9 R$ 8,40
ALGUIDAR 2 6 22 10,5 R$ 9,10
ALGUIDAR 3 6 26 15 R$ 10,90
ALGUIDAR 4 7 31 17 R$ 14,10
ALGUIDAR 5 10 35 18 R$ 16,20
ALGUIDAR 6 11 40 21,5 R$ 23,50
AMERICANO 0 11 15 9 R$ 5,70 R$ 7,60 R$ 9,30
AMERICANO 1 16 21 12,5 R$ 9,10 R$ 12,00 R$ 14,60
AMERICANO 2 20,5 25 14,5 R$ 16,20 R$ 21,40 R$ 26,20
AMERICANO 3 23 29 17 R$ 24,00 R$ 31,60 R$ 38,70
AQUÁRIO 1 7 11 5 R$ 4,70 R$ 6,30 R$ 7,70
AQUÁRIO 2 11 15 6,5 R$ 5,70 R$ 7,60 R$ 9,30
AQUÁRIO 3 13 20 9 R$ 6,80 R$ 9,10 R$ 11,10
AQUÁRIO 4 17 22 12 R$ 13,20 R$ 17,40 R$ 21,30
AQUÁRIO 5 21 28 16 R$ 20,00 R$ 26,30 R$ 32,30
AQUÁRIO 6 26 32 18 R$ 30,30 R$ 39,90 R$ 48,90
AQUÁRIO 7 32 36 25 R$ 51,40 R$ 67,70 R$ 82,90
AREKA 0 25 41 24,5 R$ 37,50 R$ 49,40 R$ 60,50
AREKA 1 35 49 28,5 R$ 75,50 R$ 99,40 R$ 121,80
BACIA AÉREA 17,5 28 15 R$ 20,80 R$ 27,50 R$ 33,70
BACIA RENDA 1 17,5 28 15 R$ 22,50 R$ 29,70 R$ 36,40
BACIA RENDA 2 21 36 22,5 R$ 29,80 R$ 39,30 R$ 48,10
BACIA JAPONESA 0 7,5 27 15,5 R$ 18,20 R$ 24,00 R$ 29,50
BACIA JAPONESA 1 10 36 21,5 R$ 25,80 R$ 34,00 R$ 41,70
BACIA JAPONESA 2 12 42 26 R$ 35,70 R$ 47,10 R$ 57,60
BACIA JAPONESA 3 13 47 30,5 R$ 46,30 R$ 60,90 R$ 74,70
BACIA JAPONESA 4 20 60 40 R$ 76,10 R$ 100,20 R$ 122,80
BACIA ADENIUM 1 10 22 18 R$ 18,20 R$ 24,00 R$ 29,50
BACIA ADENIUM 2 14 29,5 23 R$ 25,80 R$ 34,00 R$ 41,70
BACIA ADENIUM 3 17 38 31 R$ 35,70 R$ 47,10 R$ 57,60
BALLY 1 52 34 30 R$ 59,30 R$ 78,00 R$ 95,70
BALLY 2 62 36 30 R$ 82,90 R$ 109,20 R$ 133,80
BALLY 3 69 40 33 R$ 104,60 R$ 137,70 R$ 166,80
BALLY 4 84 38 35 R$ 156,00 R$ 205,30 R$ 251,70
BALLY 5 94 43 35 R$ 221,10 R$ 290,90 R$ 356,60
BAÚ LISO 1 26 26 17,5 R$ 33,10 R$ 43,60 R$ 53,40
BAÚ LISO 2 32 32 24,5 R$ 55,70 R$ 73,40 R$ 89,40
BEGÔNIA 0 12 18 16 R$ 11,80 R$ 15,60 R$ 19,10
BEGÔNIA 1 22 25 20,5 R$ 18,10 R$ 23,90 R$ 29,30
BEGÔNIA 2 25 29 23,5 R$ 25,70 R$ 33,90 R$ 41,50
BEGÔNIA 3 29 36 30 R$ 31,20 R$ 41,10 R$ 50,30
BEGÔNIA 4 37 44 35,5 R$ 55,50 R$ 73,10 R$ 89,50
BELGA 1 35 39 25 R$ 76,10 R$ 100,20 R$ 122,80
BELGA 2 49 49 32,5 R$ 117,10 R$ 154,10 R$ 188,80
BOLA ESTRELA 1 18 71 R$ 40,90 R$ 53,90
BOLA ESTRELA 2 23 84 R$ 53,90 R$ 70,90
BOLA ESTRELA 3 30 96 R$ 78,40 R$ 103,30
CACHEPOT BALLY 15,5 18 16 R$ 11,80 R$ 15,60
CACHEPOT ESFERA 1 11 12,5 9 R$ 7,20 R$ 9,50
CACHEPOT ESFERA 2 15 17 13,5 R$ 11,90 R$ 15,70
CACHEPOT ESFERA 3 21 24 17 R$ 20,00 R$ 26,30
CALDEIRÃO 29 28 30 R$ 33,40 R$ 44,00
CILINDRO ALTO 0 18 14 14 R$ 11,30 R$ 14,30 R$ 18,20
CILINDRO ALTO 1 24 18 17 R$ 16,00 R$ 21,10 R$ 25,90
CILINDRO ALTO 2 29 24 22 R$ 23,90 R$ 31,50 R$ 38,60
CILINDRO ALTO 3 40 33 27 R$ 35,20 R$ 46,30 R$ 56,70
CILINDRO BAIXO 1 17 27 24,5 R$ 16,70 R$ 22,10 R$ 27,10
CILINDRO BAIXO 2 22 30 30 R$ 22,10 R$ 29,20 R$ 35,70
CILINDRO BAIXO 3 27 38 37 R$ 34,00 R$ 44,70 R$ 54,80
COMUM 01 9 11 6 R$ 3,90 R$ 5,20 R$ 6,30
COMUM 02 11 13 7,5 R$ 5,10 R$ 6,70 R$ 8,20
COMUM 03 14 17 9 R$ 5,30 R$ 6,90 R$ 8,50
COMUM 05 17 20 12 R$ 7,10 R$ 9,40 R$ 11,50
COMUM 06 20 23 13,5 R$ 9,20 R$ 12,10 R$ 14,80
COMUM 07 23 26 13,5 R$ 13,60 R$ 17,90 R$ 22,00
COMUM 08 25 28 15,5 R$ 16,10 R$ 21,30 R$ 26,00
COMUM 10 30 32 19 R$ 21,60 R$ 28,40 R$ 34,80
COMUM 12 37 38 23,5 R$ 34,70 R$ 45,80 R$ 56,10
COMUM 14 46 41 26,5 R$ 63,10 R$ 83,10 R$ 101,80
COMUM 15 54 58 32 R$ 119,40 R$ 157,20 R$ 192,60
COMUM 17 64 62 34 R$ 156,70 R$ 206,30 R$ 252,80
COPA 0 30 35 20,5 R$ 31,10 R$ 40,90 R$ 50,10
COPA 1 36 38 24 R$ 43,60 R$ 57,40 R$ 70,30
COPA 2 42 45 27 R$ 60,60 R$ 79,80 R$ 97,70
COCO 0 15 16 9 R$ 14,70 R$ 19,50 R$ 23,80
COCO 1 21 21 15 R$ 26,50 R$ 34,90 R$ 42,80
COCO 2 30 26 21,5 R$ 40,40 R$ 53,30 R$ 65,30
EGITO 60 42 26 R$ 205,90 R$ 270,90 R$ 332,10
FARAÓ 1 33 50 20 R$ 32,20 R$ 42,40 R$ 52,00
FARAÓ 2 45 45 27 R$ 73,20 R$ 96,30 R$ 118,00
FARAÓ 3 60 51 30 R$ 99,50 R$ 130,90 R$ 160,50
ITALIA 1 38 42 25 R$ 61,60 R$ 81,10 R$ 99,40
ITALIA 2 46 48 30 R$ 88,90 R$ 117,10 R$ 143,50
ITALIA 3 54 56 35,5 R$ 154,20 R$ 202,90 R$ 248,70
ITALIA 4 62 60 38 R$ 205,90 R$ 270,90 R$ 332,10
CITY GARDEN 001 50 25 25 R$ 83,40 R$ 109,80
INDIANO 1 25 30 18 R$ 33,10 R$ 43,60
INDIANO 2 30 33 20 R$ 33,10 R$ 43,60
JARRA C/ ALÇA 1 47 19 16 R$ 81,90 R$ 107,80
JARRA C/ ALÇA 2 58 24 19 R$ 143,90 R$ 189,40
JARRA C/ ALÇA INCLINADA 1 47 19 16 R$ 83,60 R$ 110,00
JARRA C/ ALÇA INCLINADA 2 58 24 19 R$ 149,20 R$ 196,30
JARRA PALMA 1 26 14 17 R$ 17,10 R$ 22,50
JARRA PALMA 2 33 17 19 R$ 22,60 R$ 29,80
PAREDE BABADO 0 11 14 7 R$ 8,70 R$ 11,60 R$ 14,10
PAREDE BABADO 1 14 17 9 R$ 9,80 R$ 12,90 R$ 15,80
PAREDE BABADO 2 17 20 12 R$ 11,60 R$ 15,30 R$ 18,70
PAREDE BABADO 3 20 23 13,5 R$ 13,20 R$ 17,40 R$ 21,30
PAREDE LISO 0 11 14 7 R$ 8,10 R$ 10,70 R$ 13,20
PAREDE LISO 1 14 17 9 R$ 8,90 R$ 11,80 R$ 14,50
PAREDE LISO 2 17 20 12 R$ 11,20 R$ 14,70 R$ 18,00
PAREDE LISO 3 20 23 13,5 R$ 12,50 R$ 16,50 R$ 20,20
JARDINEIRA 1 9 12 7 R$ 6,90 R$ 9,20 R$ 11,30
JARDINEIRA 2 10 14 9,5 R$ 8,90 R$ 11,80 R$ 14,50
JARDINEIRA 3 11 16 12,5 R$ 11,80 R$ 15,60 R$ 19,10
JARDINEIRA CUIA 1 14 26 22 R$ 25,80 R$ 34,00 R$ 41,70
JARDINEIRA CUIA 2 21,5 31 26 R$ 35,70 R$ 47,10 R$ 57,60
POSEIDON 63,5 40 24 R$ 150,30 R$ 197,80 R$ 242,50
LISBOA 1 50 30 22,5 R$ 114,20 R$ 150,30 R$ 184,20
LISBOA 2 60 35 25 R$ 143,10 R$ 188,30 R$ 230,70
LISBOA 3 70 44 28,5 R$ 175,50 R$ 230,90 R$ 283,10
MARIA EUGENIA 0 28 35 19 R$ 31,10 R$ 40,90 R$ 50,10
MARIA EUGENIA 1 43 47 27,5 R$ 63,70 R$ 83,90 R$ 102,70
MARIA EUGENIA 2 57 51 31 R$ 80,90 R$ 106,50 R$ 130,60
MONTREAL 1 50 37 22 R$ 77,40 R$ 101,90 R$ 124,80
MONTREAL 2 65 40 27 R$ 109,10 R$ 143,60 R$ 175,90
MONTREAL 3 80 46 29 R$ 134,70 R$ 177,40 R$ 217,40
MONTREAL 4 100 52 31 R$ 236,60 R$ 311,40 R$ 381,70
ORQUÍDEA PÉTALA 16 21 12,5 R$ 17,40
ORQUÍDEA 0 8 15 12 R$ 6,60
ORQUÍDEA 1 9 18 16 R$ 7,10
ORQUÍDEA 2 11 21 21 R$ 9,90
ORQUÍDEA 3 13 26 25,5 R$ 12,80
ORQUÍDEA ALTA 1 14 17 9,5 R$ 10,20
ORQUÍDEA ALTA 2 17 20 11,5 R$ 12,30
PAREDE ORQUÍDEA 1 B/L 14 17 9 R$ 12,20
PAREDE ORQUÍDEA 2 B/L 17 20 12 R$ 14,30
PAREDE ORQUÍDEA 3 B/L 20 23 13,5 R$ 15,60
PEZINHO R$ 2,00 R$ 2,60 R$ 3,30
PRATO 01 0,2 10 7 R$ 3,10 R$ 4,10 R$ 4,90
PRATO 02 0,2 12 8,5 R$ 3,40 R$ 4,50 R$ 5,50
PRATO 03 0,2 14 10,5 R$ 3,60 R$ 4,70 R$ 5,80
PRATO 05 0,2 16 12 R$ 4,10 R$ 5,50 R$ 6,60
PRATO 06 0,2 18 15 R$ 5,90 R$ 7,80 R$ 9,60
PRATO 07 0,2 20 16,5 R$ 7,40 R$ 9,80 R$ 11,90
PRATO 08 0,2 23 18,5 R$ 12,30 R$ 16,20 R$ 19,90
PRATO 10 0,3 26 21,5 R$ 14,80 R$ 18,60 R$ 22,80
PRATO 11 0,3 28 23,5 R$ 16,00 R$ 21,10 R$ 25,90
PRATO 13 0,4 34 30 R$ 19,90 R$ 26,60 R$ 32,10
PRATO 14 0,4 38 32 R$ 22,80 R$ 30,10 R$ 36,80
PRATO 15 0,5 43 37 R$ 30,10 R$ 39,70 R$ 48,60
PRATO 17 0,5 46 41 R$ 39,50 R$ 52,00 R$ 63,70
QUARTETO DECORATIVO R$ 32,80
REAL 1 49 37 22 R$ 97,60 R$ 128,40 R$ 157,50
REAL 2 62 43 25,5 R$ 125,20 R$ 164,70 R$ 201,90
REAL 3 80 53 29,5 R$ 175,50 R$ 230,90 R$ 283,10
REAL 4 90 50 32 R$ 236,30 R$ 310,90 R$ 381,20
REDENTOR TORTO LISO 1 25 30 R$ 38,40 R$ 50,60 R$ 62,00
REDENTOR TORTO LISO 2 33 38 R$ 64,10 R$ 84,40 R$ 103,50
REDENTOR TORTO RÚST. 1 25 30 R$ 41,50 R$ 54,60 R$ 66,90
REDENTOR TORTO RÚST. 2 33 38 R$ 66,60 R$ 87,70 R$ 107,50
REX SIMPLES 22 27 19,5 R$ 28,30 R$ 37,30 R$ 45,70
SÃO PAULO 0 25 30 18 R$ 31,20 R$ 41,10 R$ 50,30
SÃO PAULO 1 37 38 22 R$ 55,80 R$ 73,50 R$ 90,00
SÃO PAULO 2 43 43 24,5 R$ 73,30 R$ 96,40 R$ 118,20
TINA 1 24 36 23,5 R$ 31,10 R$ 40,90 R$ 50,10
TINA 2 26 32 29,5 R$ 38,60 R$ 50,80 R$ 62,30
TOSCANO 80 45 31 R$ 229,30 R$ 301,70 R$ 369,80
TRONCO P/ ORQUIDEA 25 6,5 14 R$ 16,40
TRIVIAL 1 18 20 11,5 R$ 7,10 R$ 9,40 R$ 11,50
TRIVIAL 2 21 22,5 14 R$ 8,90 R$ 11,80 R$ 14,40
VIOLETA 8 15 12 R$ 5,90 R$ 7,70 R$ 9,40
VIETNAM 1 25 25 14 R$ 22,30 R$ 29,40 R$ 36,00
VIETNAM 2 31 30 18 R$ 29,20 R$ 38,40 R$ 47,10
VIETNAM 3 40 35 22 R$ 42,80 R$ 56,40 R$ 69,20
BEBEDOR PASSARO 1 4,5 9 9,5 R$ 3,00 R$ 3,90
BEBEDOR PASSARO 2 6 11 10,5 R$ 3,40 R$ 4,50
CASA DE PÁSSARO 20 18 R$ 35,20 R$ 46,40
CASA JOÃO DE BARRO 18 20 R$ 26,20 R$ 34,40
COMEDOR DE CÃO 0 8 18 15 R$ 6,40 R$ 8,30
COMEDOR DE CÃO 1 9 22 20 R$ 8,30 R$ 10,90
COMEDOR DE CÃO 2 11 25 22 R$ 10,40 R$ 13,60
MINI BEGÔNIA 1 - Pacote com 07 peças 5,5 5,5 R$ 16,40
MINI BEGÔNIA 2 - Pacote com 05 peças 6,7 8 R$ 14,70
MINI BEGÔNIA 3 - Pacote com 05 peças 8 10 R$ 26,30
MINI DEDAL - Pacote com 50 peças 2,5 3 R$ 61,70
MINI COPO - Pacote com 05 peças 8 7,1 R$ 17,60
MINI COMUM - Pacote com 50 peças 3,8 4 R$ 78,50
MINI COMUM 4.0 - Pacote com 12 peças 5,1 4,5 R$ 22,40
MINI COMUM 3.0 - Pacote com 12 peças 5 6 R$ 28,20
MINI COMUM 2.0 Pacote com 10 peças 6,2 7,6 R$ 30,40
MINI COMUM 0.0 Pacote com 08 peças 8 9,8 R$ 31,10
MINI ITALIA - Pacote com 05 peças 6,5 7 R$ 14,70
MINI PAREDE 3.0 - Pacote com 08 peças 5 6 R$ 34,60
MINI PAREDE 2.0 - Pacote com 07 peças 6,7 8 R$ 39,60
MINI PAREDE 0.0 - Pacote com 05 peças 8 9,8 R$ 40,00
MINI SUCULENTA 1 - Pacote com 10 peças 3,5 8,5 R$ 29,30
MINI SUCULENTA 2 - Pacote com 07 peças 5,5 13,7 R$ 45,10
MINI TIGELA - Pacote com 13 peças 3,6 5,6 R$ 26,30
ARGILA EXPANDIDA R$ 50,30
CASCA DE PINUS POLIDA R$ 34,00
FONTE MINI ATLANTA R$ 189,50
FONTE MINI TUNES R$ 200,00
FONTE ART. 004 - OFURO R$ 327,60
LIMITADOR DE GRAMA (mini borda) R$ 128,50
MANTA GEOTEXTIL R$ 492,00
MUSGO VERDE NATURAL R$ 129,20
PEDRISCO COLORIDO (cores variadas) R$ 81,90
SUBSTRATO PARA ORQUIDEA R$ 83,80
TERRA VEGETAL R$ 10,80
`;

async function main() {
  const lines = rawData.trim().split('\n').filter(l => l.includes('R$'));
  
  let productsToInsert = [];
  
  for (let line of lines) {
    line = line.trim();
    // find all R$
    const pricesMatches = [...line.matchAll(/R\$\s*([\d,\.]+)/g)];
    const prices = pricesMatches.map(m => parseFloat(m[1].replace('.','').replace(',','.')));
    
    // Everything before the first R$
    let beforePrices = line.substring(0, line.indexOf('R$')).trim();
    
    let name = beforePrices;
    let sizes = "";
    let match = beforePrices.match(/^(.*?)\s+([\d,\.]+)\s+([\d,\.]+)\s+([\d,\.]+)$/);
    if (match) {
        name = match[1];
        sizes = `Alt: ${match[2]}cm, D.S: ${match[3]}cm, D.I: ${match[4]}cm`;
    } else {
        let match2 = beforePrices.match(/^(.*?)\s+([\d,\.]+)\s+([\d,\.]+)$/);
        if (match2) {
            name = match2[1];
            sizes = `Medidas: ${match2[2]} x ${match2[3]}`;
        }
    }
    
    const types = ["Natural", "Verniz ou Vecchio", "Fulget"];
    
    for (let i = 0; i < prices.length; i++) {
        // Just a little cleanup for the name
        let cleanName = name.replace(" - Pacote com", " (Pct").replace("peças", "pçs)");
        if (cleanName.includes("(Pct") && !cleanName.includes(")")) cleanName += ")";

        const prodName = prices.length > 1 ? `${cleanName} - ${types[i]}` : cleanName;
        productsToInsert.push({
            nome: prodName,
            representante: "ABC CERÂMICA",
            categoria: "Vasos de Cerâmica", // default category for these
            dimensao: sizes,
            valor: prices[i],
            status: "Ativo",
            estoque: 0,
            unidade_medida: name.toLowerCase().includes("pacote") ? "Pct" : "Un",
            multiplos_venda: 1
        });
    }
  }

  console.log(`Ready to generate SQL for ${productsToInsert.length} products...`);

  let sql = 'INSERT INTO produtos (nome, representante, categoria, dimensao, valor, status, estoque, unidade_medida, multiplos_venda) VALUES\n';
  
  const values = productsToInsert.map(p => {
      const nome = p.nome.replace(/'/g, "''");
      const rep = p.representante;
      const cat = p.categoria;
      const dim = p.dimensao;
      return `('${nome}', '${rep}', '${cat}', '${dim}', ${p.valor}, '${p.status}', ${p.estoque}, '${p.unidade_medida}', ${p.multiplos_venda})`;
  });

  sql += values.join(',\n') + ';\n';

  fs.writeFileSync('import_abc_ceramica.sql', sql);
  console.log(`Done! SQL file written to import_abc_ceramica.sql`);
}
main();
