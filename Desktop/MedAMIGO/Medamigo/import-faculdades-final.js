import fs from 'fs';

// Ler o JSON
const faculdades = JSON.parse(
  fs.readFileSync('./src/data/faculdades.sample.json', 'utf8')
);

console.log(`Total de faculdades: ${faculdades.length}`);

// Mapeamento de estados para siglas
const estadoParaSigla = {
  Acre: 'AC',
  Alagoas: 'AL',
  Amapá: 'AP',
  Amazonas: 'AM',
  Bahia: 'BA',
  Ceará: 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  Goiás: 'GO',
  Maranhão: 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  Pará: 'PA',
  Paraíba: 'PB',
  Paraná: 'PR',
  Pernambuco: 'PE',
  Piauí: 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  Rondônia: 'RO',
  Roraima: 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  Sergipe: 'SE',
  Tocantins: 'TO',
  'Rio De Janeiro': 'RJ',
  'Rio Grande Do Norte': 'RN',
  'Rio Grande Do Sul': 'RS',
  'Mato Grosso Do Sul': 'MS',
};

// Preencher siglas ausentes com base no estado
faculdades.forEach((fac) => {
  if (!fac.sigla && fac.estado) {
    fac.sigla = estadoParaSigla[fac.estado] || 'XX';
    console.log(
      `⚠️  Sigla preenchida para ${fac.nome}: ${fac.estado} → ${fac.sigla}`
    );
  }
  // Preencher processo ausente
  if (!fac.processo) {
    fac.processo = 'Não informado';
    console.log(`⚠️  Processo preenchido para ${fac.nome}: Não informado`);
  }
  // Normalizar administração: apenas "Privada" ou "Pública"
  if (fac.administracao) {
    const adm = fac.administracao.toLowerCase();
    if (
      adm === 'federal' ||
      adm === 'estadual' ||
      adm === 'municipal' ||
      adm === 'pública'
    ) {
      fac.administracao = 'Pública';
    } else if (adm === 'particular' || adm === 'privada') {
      fac.administracao = 'Privada';
    }
  }
});

// Função para escapar strings SQL
function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Gerar INSERT statements em lotes de 50
const batchSize = 50;
let sql = '';

for (let i = 0; i < faculdades.length; i += batchSize) {
  const batch = faculdades.slice(i, i + batchSize);

  sql += `-- Lote ${Math.floor(i / batchSize) + 1} (${
    batch.length
  } faculdades)\n`;
  sql += `INSERT INTO faculdades (sigla, nome, regiao, estado, cidade, administracao, obtem_novo_titulo, aceita_estrangeiro, processo, aceita_fies)\nVALUES\n`;

  const values = batch.map((fac) => {
    return `  (${escapeSql(fac.sigla)}, ${escapeSql(fac.nome)}, ${escapeSql(
      fac.regiao
    )}, ${escapeSql(fac.estado)}, ${escapeSql(fac.cidade)}, ${escapeSql(
      fac.administracao
    )}, ${fac.obtemNovoTitulo}, ${fac.aceitaEstrangeiro}, ${escapeSql(
      fac.processo
    )}, ${fac.aceitaFies})`;
  });

  sql += values.join(',\n');
  sql += ';\n\n';
}

// Salvar arquivo
fs.writeFileSync('./import-faculdades-final.sql', sql);
console.log('✅ Arquivo gerado: import-faculdades-final.sql');
console.log(`Total de lotes: ${Math.ceil(faculdades.length / batchSize)}`);
