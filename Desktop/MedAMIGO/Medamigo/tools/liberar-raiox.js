#!/usr/bin/env node

// Script para liberar um Raio-X específico usando o cliente Supabase do projeto.
// Uso: node tools/liberar-raiox.js <analysisId>

import { supabase } from '../src/lib/customSupabaseClient.js';

const [, , analysisIdArg] = process.argv;
const analysisId = analysisIdArg || 'f0ef7137-ed68-49c7-8095-fbb093b98707';

if (!analysisId) {
  console.error('Por favor, passe o ID da análise como argumento.');
  process.exit(1);
}

console.log(`Tentando liberar Raio-X para analysisId=${analysisId}...`);

try {
  const res = await supabase
    .from('analyses')
    .update({ status: 'liberada' })
    .eq('id', analysisId)
    .select();

  console.log('Resposta do Supabase (update):');
  console.log(JSON.stringify(res, null, 2));

  if (res.error) {
    console.error('Erro ao executar update:', res.error);
    process.exit(2);
  }

  console.log('Update realizado com sucesso.');
  process.exit(0);
} catch (err) {
  console.error('Exceção ao tentar liberar Raio-X:', err);
  process.exit(3);
}
