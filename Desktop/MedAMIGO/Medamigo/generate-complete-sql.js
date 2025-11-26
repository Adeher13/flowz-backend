import fs from 'fs';

// Ler o arquivo JSON
const jsonData = fs.readFileSync('./src/data/faculdades.sample.json', 'utf-8');
const faculdades = JSON.parse(jsonData);

console.log(`Total de faculdades: ${faculdades.length}`);

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

// Criar um único INSERT com todos os valores
let sql = `-- Inserção de todas as ${faculdades.length} faculdades\n\n`;
sql += `INSERT INTO faculdades (name, cidade, state, regiao, type, aceita_estrangeiro, aceita_fies, obtem_novo_titulo, entrance_method)\nVALUES\n`;
sql += allValues.join(',\n');
sql += ';\n';

// Salvar
fs.writeFileSync('./import-faculdades-completo.sql', sql, 'utf-8');

console.log('✅ Arquivo SQL completo gerado: import-faculdades-completo.sql');
console.log(`Total de registros: ${faculdades.length}`);
