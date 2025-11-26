import fs from 'fs';

// Ler o arquivo SQL completo
const sqlContent = fs.readFileSync('./import-faculdades-final.sql', 'utf8');

// Dividir por lotes (cada lote começa com "-- Lote")
const batches = sqlContent.split(/(?=-- Lote \d+)/);

// Remover o primeiro elemento vazio se houver
const validBatches = batches.filter((batch) => batch.trim().length > 0);

console.log(`Total de lotes encontrados: ${validBatches.length}`);

// Salvar cada lote em um arquivo separado
validBatches.forEach((batch, index) => {
  const batchNumber = index + 1;
  const filename = `./lote-${batchNumber}.sql`;
  fs.writeFileSync(filename, batch.trim());
  console.log(`✅ Lote ${batchNumber} salvo em: ${filename}`);
});

console.log('\n📋 Instruções:');
console.log('Execute cada arquivo no SQL Editor do Supabase na ordem:');
validBatches.forEach((_, index) => {
  console.log(`   ${index + 1}. lote-${index + 1}.sql`);
});
