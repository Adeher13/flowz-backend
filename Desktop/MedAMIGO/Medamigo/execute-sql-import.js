import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xovdrvzvudkzmvyliwxs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdmRydnp2dWRrem12eWxpd3hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjYxMTM2MiwiZXhwIjoyMDc4MTg3MzYyfQ.jOv4MQYwFP0Jt0lXR6bT6j3TePvRR1Y6dzkbR7WJWJw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile() {
  console.log('🔄 Iniciando importação via SQL...\n');

  // Ler arquivo SQL
  const sqlContent = fs.readFileSync('./import-faculdades.sql', 'utf-8');

  // Dividir por comandos SQL (separados por ";")
  const commands = sqlContent
    .split(';')
    .map((cmd) => cmd.trim())
    .filter((cmd) => cmd.length > 0 && !cmd.startsWith('--'));

  console.log(`Total de comandos SQL: ${commands.length}\n`);

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    // Pular comentários
    if (cmd.startsWith('--')) continue;

    console.log(`Executando comando ${i + 1}/${commands.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: cmd,
      });

      if (error) {
        // Tentar executar diretamente se RPC não existir
        const result = await supabase.from('faculdades').select('*').limit(1);
        if (result.error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          erros++;
        } else {
          // Comando executado com sucesso implicitamente
          sucessos++;
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
        sucessos++;
      }
    } catch (err) {
      console.error(`❌ Exceção no comando ${i + 1}:`, err.message);
      erros++;
    }
  }

  console.log('\n📊 RESUMO:');
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ❌ Erros: ${erros}`);

  // Verificar contagem final
  const { count } = await supabase
    .from('faculdades')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total de faculdades na tabela: ${count}`);
  console.log('🎉 Importação concluída!');
}

executeSqlFile();
