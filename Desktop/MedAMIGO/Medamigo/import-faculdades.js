import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar cliente Supabase
const supabaseUrl = 'https://xovdrvzvudkzmvyliwxs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdmRydnp2dWRrem12eWxpd3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTEzNjIsImV4cCI6MjA3ODE4NzM2Mn0.m5yrIFfHcWazFqdhtui1p3NcuxXSfGjFymgYH7I2Ee8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importFaculdades() {
  try {
    console.log('🔄 Iniciando importação de faculdades...\n');

    // 1. Ler arquivo JSON
    const jsonPath = join(__dirname, 'src', 'data', 'faculdades.sample.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const faculdades = JSON.parse(jsonData);

    console.log(`📊 Total de faculdades no arquivo: ${faculdades.length}\n`);

    // 2. Limpar tabela existente
    console.log('🗑️  Removendo dados antigos...');
    const { error: deleteError } = await supabase
      .from('faculdades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros

    if (deleteError) {
      console.error('❌ Erro ao limpar tabela:', deleteError);
      throw deleteError;
    }
    console.log('✅ Tabela limpa com sucesso!\n');

    // 3. Mapear dados do JSON para o formato do banco
    const faculdadesFormatadas = faculdades.map((fac) => ({
      name: fac.nome,
      cidade: fac.cidade,
      state: fac.sigla || fac.estado, // Usar sigla prioritariamente
      regiao: fac.regiao,
      type:
        fac.administracao === 'Particular' || fac.administracao === 'Privada'
          ? 'Privada'
          : fac.administracao === 'Publica' ||
            fac.administracao === 'Estadual' ||
            fac.administracao === 'Federal' ||
            fac.administracao === 'Municipal'
          ? 'Pública'
          : fac.administracao,
      aceita_estrangeiro: fac.aceitaEstrangeiro,
      aceita_fies: fac.aceitaFies,
      obtem_novo_titulo: fac.obtemNovoTitulo,
      entrance_method: fac.processo,
      observacoes: null,
    }));

    // 4. Inserir em lotes de 100 registros
    const batchSize = 100;
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < faculdadesFormatadas.length; i += batchSize) {
      const batch = faculdadesFormatadas.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('faculdades')
        .insert(batch)
        .select();

      if (error) {
        console.error(
          `❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`,
          error
        );
        erros += batch.length;
      } else {
        sucessos += data.length;
        console.log(
          `✅ Lote ${Math.floor(i / batchSize) + 1} inserido: ${
            data.length
          } faculdades`
        );
      }
    }

    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`   ✅ Sucessos: ${sucessos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📈 Total: ${faculdades.length}\n`);

    // 5. Verificar resultado final
    const { count, error: countError } = await supabase
      .from('faculdades')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
    } else {
      console.log(`✅ Total de faculdades na tabela: ${count}\n`);
    }

    console.log('🎉 Importação concluída!');
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

// Executar importação
importFaculdades();
