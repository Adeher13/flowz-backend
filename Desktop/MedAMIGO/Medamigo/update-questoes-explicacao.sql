-- Script para atualizar explicações das questões existentes
-- Este script busca do arquivo JSON e atualiza no banco

-- Como o Supabase não permite ler arquivos JSON diretamente,
-- você precisa deletar as questões antigas e reimportar

-- 1. Primeiro, delete todas as questões atuais (CUIDADO!)
DELETE FROM questoes;

-- 2. Depois, execute o script de importação novamente:
-- node import-questoes.js
