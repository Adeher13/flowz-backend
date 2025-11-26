// Script para contar quantas faculdades já foram inseridas
console.log('Execute esta query no Supabase para verificar:');
console.log(
  'SELECT COUNT(*) as total, COUNT(DISTINCT state) as estados FROM faculdades;'
);
console.log(
  '\nPara inserir os lotes restantes, execute cada arquivo batch-X.sql manualmente via:'
);
console.log('1. Supabase Dashboard > SQL Editor');
console.log('2. Copie e cole o conteúdo de cada arquivo');
console.log('3. Execute');
console.log('\nOu use o MCP execute_sql para cada lote.');
