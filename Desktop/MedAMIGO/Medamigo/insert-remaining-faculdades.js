import fs from 'fs';

// Ler o JSON completo
const jsonData = fs.readFileSync('./src/data/faculdades.sample.json', 'utf-8');
const faculdades = JSON.parse(jsonData);

console.log(`Total de faculdades no arquivo: ${faculdades.length}`);

// Função para escapar strings SQL
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Normalizar tipo
function normalizeType(adm) {
  if (!adm) return 'Privada';
  const lower = adm.toLowerCase();
  if (lower.includes('priv') || lower.includes('partic')) return 'Privada';
  if (
    lower.includes('pub') ||
    lower.includes('federal') ||
    lower.includes('estadual') ||
    lower.includes('municipal')
  )
    return 'Pública';
  return adm;
}

// Gerar todos os VALUES
const allValues = faculdades.map((fac) => {
  const name = escapeSql(fac.nome);
  const cidade = escapeSql(fac.cidade);
  const state = escapeSql(fac.sigla || fac.estado);
  const regiao = escapeSql(fac.regiao);
  const type = normalizeType(fac.administracao);
  const aceitaEstrangeiro = fac.aceitaEstrangeiro ? 'true' : 'false';
  const aceitaFies = fac.aceitaFies ? 'true' : 'false';
  const obtemNovoTitulo = fac.obtemNovoTitulo ? 'true' : 'false';
  const processo = escapeSql(fac.processo || '');

  return `  ('${name}', '${cidade}', '${state}', '${regiao}', '${type}', ${aceitaEstrangeiro}, ${aceitaFies}, ${obtemNovoTitulo}, '${processo}')`;
});

// Dividir em chunks de 50 para múltiplos INSERTs
const chunkSize = 50;
const chunks = [];

for (let i = 0; i < allValues.length; i += chunkSize) {
  chunks.push(allValues.slice(i, i + chunkSize));
}

console.log(`Total de chunks: ${chunks.length}`);

// Criar arquivo com múltiplos INSERTs
let sqlContent = `-- Inserção completa de todas as ${faculdades.length} faculdades em ${chunks.length} lotes\n\n`;

chunks.forEach((chunk, index) => {
  sqlContent += `-- Lote ${index + 1}/${chunks.length}\n`;
  sqlContent += `INSERT INTO faculdades (name, cidade, state, regiao, type, aceita_estrangeiro, aceita_fies, obtem_novo_titulo, entrance_method)\nVALUES\n`;
  sqlContent += chunk.join(',\n');
  sqlContent += ';\n\n';
});

fs.writeFileSync('./insert-all-batches.sql', sqlContent, 'utf-8');

console.log('✅ Arquivo gerado: insert-all-batches.sql');
console.log(
  `Pronto para inserir ${faculdades.length} faculdades em ${chunks.length} lotes`
);
