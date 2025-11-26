import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Usar service_role key para bypassar RLS
const supabaseUrl = 'https://xovdrvzvudkzmvyliwxs.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdmRydnp2dWRrem12eWxpd3hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjYxMTM2MiwiZXhwIjoyMDc4MTg3MzYyfQ.jOv4MQYwFP0Jt0lXR6bT6j3TePvRR1Y6dzkbR7WJWJw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

async function importAllFaculdades() {
  try {
    console.log('🔄 Iniciando importação de todas as 383 faculdades...\n');

    // Ler JSON
    const jsonData = fs.readFileSync(
      './src/data/faculdades.sample.json',
      'utf-8'
    );
    const faculdades = JSON.parse(jsonData);

    console.log(`📊 Total de faculdades no arquivo: ${faculdades.length}\n`);

    // Mapear dados
    const faculdadesFormatadas = faculdades.map((fac) => ({
      name: fac.nome,
      cidade: fac.cidade,
      state: fac.sigla || fac.estado,
      regiao: fac.regiao,
      type: normalizeType(fac.administracao),
      aceita_estrangeiro: fac.aceitaEstrangeiro || false,
      aceita_fies: fac.aceitaFies || false,
      obtem_novo_titulo: fac.obtemNovoTitulo || false,
      entrance_method: fac.processo || '',
    }));

    // Inserir em lotes de 100
    const batchSize = 100;
    let totalInserido = 0;

    for (let i = 0; i < faculdadesFormatadas.length; i += batchSize) {
      const batch = faculdadesFormatadas.slice(i, i + batchSize);

      console.log(
        `Inserindo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          faculdadesFormatadas.length / batchSize
        )}...`
      );

      const { data, error } = await supabase
        .from('faculdades')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Erro no lote:`, error);
        throw error;
      }

      totalInserido += data.length;
      console.log(
        `✅ ${data.length} faculdades inseridas (total: ${totalInserido})`
      );
    }

    // Verificar total
    const { count } = await supabase
      .from('faculdades')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 RESUMO FINAL:`);
    console.log(`   ✅ Total inserido: ${totalInserido}`);
    console.log(`   ✅ Total na tabela: ${count}`);
    console.log(`\n🎉 Importação concluída com sucesso!`);
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

importAllFaculdades();
