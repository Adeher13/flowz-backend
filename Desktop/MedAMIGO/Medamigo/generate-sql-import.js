import fs from 'fs';

// Ler arquivo JSON
const jsonData = fs.readFileSync('./src/data/faculdades.sample.json', 'utf-8');
const faculdades = JSON.parse(jsonData);

console.log(`Total de faculdades: ${faculdades.length}`);

// Função para escapar aspas simples
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Normalizar tipo de administração
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

// Gerar valores SQL
const values = faculdades.map((fac) => {
  const name = escapeSql(fac.nome);
  const cidade = escapeSql(fac.cidade);
  const state = escapeSql(fac.sigla || fac.estado);
  const regiao = escapeSql(fac.regiao);
  const type = normalizeType(fac.administracao);
  const aceitaEstrangeiro = fac.aceitaEstrangeiro ? 'true' : 'false';
  const aceitaFies = fac.aceitaFies ? 'true' : 'false';
  const obtemNovoTitulo = fac.obtemNovoTitulo ? 'true' : 'false';
  const processo = escapeSql(fac.processo);

  return `('${name}', '${cidade}', '${state}', '${regiao}', '${type}', ${aceitaEstrangeiro}, ${aceitaFies}, ${obtemNovoTitulo}, '${processo}')`;
});

// Criar arquivo SQL em lotes de 50
const batchSize = 50;
let sqlContent = '-- Importação de Faculdades\n\n';
sqlContent += 'DELETE FROM faculdades WHERE id IS NOT NULL;\n\n';

for (let i = 0; i < values.length; i += batchSize) {
  const batch = values.slice(i, i + batchSize);
  sqlContent += `-- Lote ${Math.floor(i / batchSize) + 1}\n`;
  sqlContent += `INSERT INTO faculdades (name, cidade, state, regiao, type, aceita_estrangeiro, aceita_fies, obtem_novo_titulo, entrance_method)\nVALUES\n`;
  sqlContent += batch.join(',\n');
  sqlContent += ';\n\n';
}

// Salvar arquivo
fs.writeFileSync('./import-faculdades.sql', sqlContent, 'utf-8');

console.log('✅ Arquivo SQL gerado: import-faculdades.sql');
console.log(`Total de lotes: ${Math.ceil(values.length / batchSize)}`);
