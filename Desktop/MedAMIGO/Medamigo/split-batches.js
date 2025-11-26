import fs from 'fs';

// Ler o arquivo SQL
const sqlContent = fs.readFileSync('./insert-all-batches.sql', 'utf-8');

// Dividir por "-- Lote" e pegar cada INSERT
const batches = [];
const lines = sqlContent.split('\n');
let currentBatch = [];
let insideBatch = false;

for (const line of lines) {
  if (line.startsWith('-- Lote')) {
    if (currentBatch.length > 0) {
      batches.push(currentBatch.join('\n'));
      currentBatch = [];
    }
    insideBatch = true;
  } else if (insideBatch && line.trim().length > 0 && !line.startsWith('--')) {
    currentBatch.push(line);
  }
}

// Adicionar o último lote
if (currentBatch.length > 0) {
  batches.push(currentBatch.join('\n'));
}

console.log(`Total de lotes encontrados: ${batches.length}`);
console.log(
  `\nPara executar, copie e cole cada comando abaixo no Supabase SQL Editor:\n`
);

// Salvar cada lote em arquivo separado
batches.forEach((batch, index) => {
  const filename = `./batch-${index + 1}.sql`;
  fs.writeFileSync(filename, batch, 'utf-8');
  console.log(`✅ Lote ${index + 1} salvo em: batch-${index + 1}.sql`);
});

console.log(
  `\n📋 Execute os arquivos na ordem: batch-1.sql, batch-2.sql, ... batch-${batches.length}.sql`
);
console.log(`Ou execute o comando abaixo no PowerShell:\n`);
console.log(
  `for ($i=1; $i -le ${batches.length}; $i++) { Write-Host "Executando lote $i..."; Get-Content "batch-$i.sql" }`
);
