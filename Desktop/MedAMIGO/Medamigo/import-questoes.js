import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://xovdrvzvudkzmvyliwxs.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdmRydnp2dWRrem12eWxpd3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTEzNjIsImV4cCI6MjA3ODE4NzM2Mn0.m5yrIFfHcWazFqdhtui1p3NcuxXSfGjFymgYH7I2Ee8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function importarQuestoes() {
  console.log('🚀 Iniciando importação de questões...\n');

  // Ler arquivo de questões
  const questoesJson = fs.readFileSync(
    './src/data/questoes.sample.json',
    'utf8'
  );
  const questoesOriginais = JSON.parse(questoesJson);

  console.log(
    `📚 Total de questões encontradas: ${questoesOriginais.length}\n`
  );

  // Processar questões em lotes
  const batchSize = 100;
  let importadas = 0;
  let erros = 0;

  for (let i = 0; i < questoesOriginais.length; i += batchSize) {
    const batch = questoesOriginais.slice(i, i + batchSize);

    // Transformar formato
    const questoesFormatadas = batch.map((q) => {
      // Parse das opções (está como string JSON)
      let alternativas = [];
      try {
        const opcoesObj = JSON.parse(q.opcoes);
        alternativas = [
          opcoesObj.a,
          opcoesObj.b,
          opcoesObj.c,
          opcoesObj.d,
        ].filter(Boolean); // Remove undefined/null
      } catch (e) {
        console.error('Erro ao processar opções:', q.opcoes);
        alternativas = [];
      }

      // Obter resposta correta (letra para texto)
      let respostaCorreta = '';
      try {
        const opcoesObj = JSON.parse(q.opcoes);
        const letraResposta = q.resposta_correta.toLowerCase();
        respostaCorreta = opcoesObj[letraResposta] || '';
      } catch (e) {
        console.error('Erro ao processar resposta:', q.resposta_correta);
      }

      return {
        disciplina: q.disciplina || 'Geral',
        texto_questao: q.questao,
        opcao_a: alternativas[0] || '',
        opcao_b: alternativas[1] || '',
        opcao_c: alternativas[2] || '',
        opcao_d: alternativas[3] || '',
        opcao_e: alternativas[4] || null,
        resposta_correta: respostaCorreta,
        explicacao: q.explicacao || null,
        difficulty_level: q.nivel_dificuldade || 'Médio',
        tags: [q.assunto, q.modulo].filter(Boolean),
        source: 'import',
        year: null,
      };
    });

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('questoes')
      .insert(questoesFormatadas);

    if (error) {
      console.error(`❌ Erro no lote ${i / batchSize + 1}:`, error.message);
      erros += batch.length;
    } else {
      importadas += batch.length;
      console.log(
        `✅ Lote ${i / batchSize + 1} importado: ${batch.length} questões`
      );
    }
  }

  console.log('\n📊 Resumo da Importação:');
  console.log(`✅ Importadas com sucesso: ${importadas}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📈 Total processadas: ${questoesOriginais.length}`);
}

importarQuestoes().catch(console.error);
