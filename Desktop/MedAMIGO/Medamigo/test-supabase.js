// Script para testar conexão e tabelas do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xovdrvzvudkzmvyliwxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdmRydnp2dWRrem12eWxpd3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTEzNjIsImV4cCI6MjA3ODE4NzM2Mn0.m5yrIFfHcWazFqdhtui1p3NcuxXSfGjFymgYH7I2Ee8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🧪 Testando conexão com Supabase...\n');

  // Testar tabela simulados
  console.log('1️⃣ Verificando tabela "simulados"...');
  const { data: simulados, error: errorSimulados } = await supabase
    .from('simulados')
    .select('*')
    .limit(1);
  
  if (errorSimulados) {
    console.log('❌ Erro na tabela simulados:', errorSimulados.message);
  } else {
    console.log('✅ Tabela simulados OK! Total:', simulados?.length || 0);
  }

  // Testar tabela questoes
  console.log('\n2️⃣ Verificando tabela "questoes"...');
  const { data: questoes, error: errorQuestoes } = await supabase
    .from('questoes')
    .select('*')
    .limit(1);
  
  if (errorQuestoes) {
    console.log('❌ Erro na tabela questoes:', errorQuestoes.message);
  } else {
    console.log('✅ Tabela questoes OK! Total:', questoes?.length || 0);
  }

  // Testar tabela analyses
  console.log('\n3️⃣ Verificando tabela "analyses"...');
  const { data: analyses, error: errorAnalyses } = await supabase
    .from('analyses')
    .select('*')
    .limit(1);
  
  if (errorAnalyses) {
    console.log('❌ Erro na tabela analyses:', errorAnalyses.message);
  } else {
    console.log('✅ Tabela analyses OK! Total:', analyses?.length || 0);
  }

  // Testar tabela quiz_attempts
  console.log('\n4️⃣ Verificando tabela "quiz_attempts"...');
  const { data: attempts, error: errorAttempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .limit(1);
  
  if (errorAttempts) {
    console.log('❌ Erro na tabela quiz_attempts:', errorAttempts.message);
  } else {
    console.log('✅ Tabela quiz_attempts OK! Total:', attempts?.length || 0);
  }

  console.log('\n✅ Teste concluído!');
}

testConnection();
