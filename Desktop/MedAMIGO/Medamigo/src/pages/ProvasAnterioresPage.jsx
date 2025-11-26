import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlusCircle,
  Loader2,
  Search,
  Trash2,
  Edit,
  BookOpen,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Play,
  Upload,
  Clock,
  ArrowLeft,
  ArrowRight,
  Flag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ProvasAnterioresPage = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [provas, setProvas] = useState([]);
  const [filteredProvas, setFilteredProvas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    faculdade: 'all',
    ano: 'all',
    search: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProva, setCurrentProva] = useState(null);

  // Estados para modo de prova
  const [modoProva, setModoProva] = useState(false);
  const [provaAtual, setProvaAtual] = useState(null);
  const [questoesProva, setQuestoesProva] = useState([]);
  const [questaoAtualIndex, setQuestaoAtualIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [tempoInicio, setTempoInicio] = useState(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [provaFinalizada, setProvaFinalizada] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Estados para CSV
  const [csvFile, setCsvFile] = useState(null);
  const [csvProcessing, setCsvProcessing] = useState(false);

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const fetchProvas = useCallback(async () => {
    setLoading(true);
    let allProvas = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('provas_anteriores')
        .select('*')
        .order('ano', { ascending: false })
        .order('nome_faculdade', { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('Erro ao buscar provas:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar provas anteriores.',
          description: error.message,
        });
        break;
      }

      if (data && data.length > 0) {
        allProvas = [...allProvas, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ ${allProvas.length} provas carregadas do Supabase`);
    setProvas(allProvas);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProvas();
  }, [fetchProvas]);

  useEffect(() => {
    let tempFiltered = provas;
    if (filters.faculdade !== 'all')
      tempFiltered = tempFiltered.filter(
        (p) => p.nome_faculdade === filters.faculdade
      );
    if (filters.ano !== 'all')
      tempFiltered = tempFiltered.filter(
        (p) => p.ano === parseInt(filters.ano)
      );
    if (filters.search) {
      const searchText = filters.search.toLowerCase();
      tempFiltered = tempFiltered.filter(
        (p) =>
          (p.enunciado || '').toLowerCase().includes(searchText) ||
          (p.disciplina || '').toLowerCase().includes(searchText)
      );
    }
    setFilteredProvas(tempFiltered);
  }, [filters, provas]);

  useEffect(() => {
    if (modoProva && !provaFinalizada && tempoInicio) {
      const interval = setInterval(() => {
        setTempoDecorrido(Math.floor((Date.now() - tempoInicio) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [modoProva, provaFinalizada, tempoInicio]);

  const faculdadesUnicas = [
    ...new Set(provas.map((p) => p.nome_faculdade)),
  ].sort();
  const anosUnicos = [...new Set(provas.map((p) => p.ano))].sort(
    (a, b) => b - a
  );

  const handleOpenModal = (prova = null) => {
    setIsEditing(!!prova);
    if (prova) {
      setCurrentProva({ ...prova });
    } else {
      setCurrentProva({
        nome_faculdade: '',
        ano: currentYear,
        enunciado: '',
        imagem_enunciado: '',
        opcao_a: '',
        opcao_b: '',
        opcao_c: '',
        opcao_d: '',
        opcao_e: '',
        resposta_correta: 'A',
        comentario: '',
        disciplina: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveProva = async () => {
    if (!currentProva.nome_faculdade?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome da faculdade é obrigatório.',
      });
      return;
    }
    if (
      !currentProva.ano ||
      currentProva.ano < 1900 ||
      currentProva.ano > currentYear
    ) {
      toast({ variant: 'destructive', title: 'Ano inválido.' });
      return;
    }
    if (!currentProva.enunciado?.trim()) {
      toast({ variant: 'destructive', title: 'Enunciado é obrigatório.' });
      return;
    }
    if (
      !currentProva.opcao_a ||
      !currentProva.opcao_b ||
      !currentProva.opcao_c ||
      !currentProva.opcao_d
    ) {
      toast({
        variant: 'destructive',
        title: 'As alternativas A, B, C e D são obrigatórias.',
      });
      return;
    }
    if (!currentProva.resposta_correta) {
      toast({
        variant: 'destructive',
        title: 'Resposta correta é obrigatória.',
      });
      return;
    }

    setLoading(true);
    const provaData = { ...currentProva, updated_at: new Date().toISOString() };
    const { error } = isEditing
      ? await supabase
          .from('provas_anteriores')
          .update(provaData)
          .eq('id', currentProva.id)
      : await supabase
          .from('provas_anteriores')
          .insert({ ...provaData, created_at: new Date().toISOString() });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar prova.',
        description: error.message,
      });
    } else {
      toast({ title: isEditing ? 'Prova atualizada!' : 'Prova criada!' });
      setModalOpen(false);
      fetchProvas();
    }
    setLoading(false);
  };

  const handleDeleteProva = async (provaId) => {
    if (!confirm('Tem certeza que deseja deletar esta prova?')) return;
    setLoading(true);
    const { error } = await supabase
      .from('provas_anteriores')
      .delete()
      .eq('id', provaId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar prova.',
        description: error.message,
      });
    } else {
      toast({ title: 'Prova deletada com sucesso!' });
      fetchProvas();
    }
    setLoading(false);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast({
        variant: 'destructive',
        title: 'Selecione um arquivo CSV primeiro.',
      });
      return;
    }

    setCsvProcessing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        console.log('📄 Conteúdo CSV lido:', text.substring(0, 200));

        // Detectar delimitador (vírgula ou ponto-e-vírgula)
        const detectDelimiter = (csvText) => {
          const firstLine = csvText.split('\n')[0];
          const semicolonCount = (firstLine.match(/;/g) || []).length;
          const commaCount = (firstLine.match(/,/g) || []).length;
          const delimiter = semicolonCount > commaCount ? ';' : ',';
          console.log(
            `🔍 Delimitador detectado: "${delimiter}" (${
              delimiter === ';' ? 'ponto-e-vírgula' : 'vírgula'
            })`
          );
          return delimiter;
        };

        const delimiter = detectDelimiter(text);

        // Parser robusto de CSV que respeita aspas e quebras de linha dentro de células
        const parseCSV = (csvText, delim) => {
          const rows = [];
          let currentRow = [];
          let currentCell = '';
          let inQuotes = false;

          for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Aspas duplas escapadas
                currentCell += '"';
                i++;
              } else {
                // Toggle estado de aspas
                inQuotes = !inQuotes;
              }
            } else if (char === delim && !inQuotes) {
              // Fim de célula
              currentRow.push(currentCell.trim());
              currentCell = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
              // Fim de linha (ignorar \r se seguido de \n)
              if (char === '\r' && nextChar === '\n') {
                i++;
              }
              if (currentCell.trim() || currentRow.length > 0) {
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
              }
            } else {
              // Caractere normal
              currentCell += char;
            }
          }

          // Última célula/linha
          if (currentCell.trim() || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
          }

          return rows.filter((row) => row.some((cell) => cell.length > 0));
        };

        const lines = parseCSV(text, delimiter);
        console.log(`📊 Total de linhas: ${lines.length}`);

        if (lines.length === 0) {
          toast({
            variant: 'destructive',
            title: 'CSV vazio ou inválido',
          });
          setCsvProcessing(false);
          return;
        }

        const headers = lines[0];
        console.log('📋 Headers encontrados:', headers);
        const requiredHeaders = [
          'nome_faculdade',
          'ano',
          'enunciado',
          'opcao_a',
          'opcao_b',
          'opcao_c',
          'opcao_d',
          'resposta_correta',
        ];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          console.error('❌ Colunas faltando:', missingHeaders);
          toast({
            variant: 'destructive',
            title: 'CSV inválido',
            description: `Colunas faltando: ${missingHeaders.join(', ')}`,
          });
          setCsvProcessing(false);
          return;
        }

        const provasToInsert = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i];

          if (values.length < requiredHeaders.length) {
            console.warn(
              `⚠️ Linha ${i + 1} ignorada - valores insuficientes (${
                values.length
              } de ${requiredHeaders.length})`
            );
            continue;
          }

          const prova = {};
          headers.forEach((header, index) => {
            let value = values[index] || null;
            // Remover aspas extras e limpar whitespace
            if (value && typeof value === 'string') {
              value = value.replace(/^"+|"+$/g, '').trim();
            }
            prova[header] = value;
          });

          prova.ano = parseInt(prova.ano);

          // Validação básica
          if (
            !prova.nome_faculdade ||
            !prova.ano ||
            !prova.enunciado ||
            !prova.resposta_correta
          ) {
            console.warn(
              `⚠️ Linha ${i + 1} ignorada - dados obrigatórios faltando`
            );
            continue;
          }

          provasToInsert.push(prova);
        }

        console.log(
          `✅ ${provasToInsert.length} provas processadas para inserção`
        );
        console.log('📦 Primeira prova:', provasToInsert[0]);

        if (provasToInsert.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Nenhuma prova válida encontrada no CSV.',
          });
          setCsvProcessing(false);
          return;
        }

        const batchSize = 100;
        let inserted = 0;
        let errors = [];

        for (let i = 0; i < provasToInsert.length; i += batchSize) {
          const batch = provasToInsert.slice(i, i + batchSize);
          console.log(
            `📤 Inserindo lote ${Math.floor(i / batchSize) + 1}: ${
              batch.length
            } questões`
          );

          const { data, error } = await supabase
            .from('provas_anteriores')
            .insert(batch)
            .select();

          if (error) {
            console.error(
              `❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`,
              error
            );
            errors.push(error);
          } else {
            inserted += batch.length;
            console.log(
              `✅ Lote ${Math.floor(i / batchSize) + 1} inserido com sucesso:`,
              data?.length || batch.length,
              'registros'
            );
          }
        }

        if (errors.length > 0) {
          console.error('❌ Erros durante importação:', errors);
          toast({
            variant: 'destructive',
            title: 'Erro ao importar algumas provas',
            description: `${inserted} provas importadas, ${errors.length} erros. Verifique o console.`,
          });
        } else {
          console.log(`✅ SUCESSO! ${inserted} provas importadas no total`);
          toast({ title: `✅ ${inserted} provas importadas com sucesso!` });
        }

        setCsvModalOpen(false);
        setCsvFile(null);

        // Aguardar 1 segundo antes de recarregar para dar tempo do banco processar
        setTimeout(() => {
          console.log('🔄 Recarregando lista de provas...');
          fetchProvas();
        }, 1000);
      } catch (error) {
        console.error('❌ Erro crítico ao processar CSV:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao processar CSV',
          description: error.message,
        });
      }
      setCsvProcessing(false);
    };

    reader.readAsText(csvFile);
  };

  const handleIniciarProva = (faculdade, ano) => {
    const questoesFiltradas = provas.filter(
      (p) => p.nome_faculdade === faculdade && p.ano === ano
    );
    if (questoesFiltradas.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma questão encontrada para esta prova.',
      });
      return;
    }

    setQuestoesProva(questoesFiltradas);
    setQuestaoAtualIndex(0);
    setRespostas({});
    setTempoInicio(Date.now());
    setTempoDecorrido(0);
    setProvaFinalizada(false);
    setResultado(null);
    setProvaAtual({ faculdade, ano });
    setModoProva(true);
  };

  const handleResponder = (resposta) => {
    setRespostas((prev) => ({ ...prev, [questaoAtualIndex]: resposta }));
  };

  const handleProximaQuestao = () => {
    if (questaoAtualIndex < questoesProva.length - 1) {
      setQuestaoAtualIndex(questaoAtualIndex + 1);
    }
  };

  const handleQuestaoAnterior = () => {
    if (questaoAtualIndex > 0) {
      setQuestaoAtualIndex(questaoAtualIndex - 1);
    }
  };

  const handleFinalizarProva = () => {
    const totalQuestoes = questoesProva.length;
    const questoesRespondidas = Object.keys(respostas).length;

    if (questoesRespondidas < totalQuestoes) {
      const confirmacao = confirm(
        `Você respondeu ${questoesRespondidas} de ${totalQuestoes} questões. Deseja finalizar mesmo assim?`
      );
      if (!confirmacao) return;
    }

    let acertos = 0;
    questoesProva.forEach((questao, index) => {
      if (respostas[index] === questao.resposta_correta) {
        acertos++;
      }
    });

    const percentual = Math.round((acertos / totalQuestoes) * 100);
    setResultado({
      totalQuestoes,
      acertos,
      erros: totalQuestoes - acertos,
      percentual,
      tempo: tempoDecorrido,
    });
    setProvaFinalizada(true);
  };

  const handleVoltarLista = () => {
    setModoProva(false);
    setProvaAtual(null);
    setQuestoesProva([]);
    setQuestaoAtualIndex(0);
    setRespostas({});
    setProvaFinalizada(false);
    setResultado(null);
  };

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos
      .toString()
      .padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  if (modoProva) {
    if (provaFinalizada && resultado) {
      return (
        <>
          <Helmet>
            <title>Resultado da Prova - AmigoMeD!</title>
          </Helmet>
          <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='max-w-4xl mx-auto'
            >
              <Card className='shadow-2xl'>
                <CardHeader className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
                  <CardTitle className='text-3xl text-center'>
                    🎉 Prova Finalizada!
                  </CardTitle>
                  <p className='text-center text-blue-100 mt-2'>
                    {provaAtual.faculdade} - {provaAtual.ano}
                  </p>
                </CardHeader>
                <CardContent className='p-8 space-y-6'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <Card className='border-l-4 border-l-blue-500'>
                      <CardContent className='pt-6'>
                        <div className='text-center'>
                          <BookOpen className='h-8 w-8 text-blue-500 mx-auto mb-2' />
                          <div className='text-2xl font-bold text-blue-600'>
                            {resultado.totalQuestoes}
                          </div>
                          <p className='text-xs text-gray-500'>Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className='border-l-4 border-l-green-500'>
                      <CardContent className='pt-6'>
                        <div className='text-center'>
                          <CheckCircle2 className='h-8 w-8 text-green-500 mx-auto mb-2' />
                          <div className='text-2xl font-bold text-green-600'>
                            {resultado.acertos}
                          </div>
                          <p className='text-xs text-gray-500'>Acertos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className='border-l-4 border-l-red-500'>
                      <CardContent className='pt-6'>
                        <div className='text-center'>
                          <XCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
                          <div className='text-2xl font-bold text-red-600'>
                            {resultado.erros}
                          </div>
                          <p className='text-xs text-gray-500'>Erros</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className='border-l-4 border-l-purple-500'>
                      <CardContent className='pt-6'>
                        <div className='text-center'>
                          <Clock className='h-8 w-8 text-purple-500 mx-auto mb-2' />
                          <div className='text-2xl font-bold text-purple-600'>
                            {formatarTempo(resultado.tempo)}
                          </div>
                          <p className='text-xs text-gray-500'>Tempo</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className='text-center'>
                    <div className='text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
                      {resultado.percentual}%
                    </div>
                    <p className='text-gray-600 text-lg'>Aproveitamento</p>
                    <Progress
                      value={resultado.percentual}
                      className='h-3 mt-4'
                    />
                  </div>

                  <div className='flex gap-4 justify-center'>
                    <Button
                      onClick={handleVoltarLista}
                      variant='outline'
                      size='lg'
                    >
                      <ArrowLeft className='mr-2 h-4 w-4' />
                      Voltar para Lista
                    </Button>
                    <Button
                      onClick={() =>
                        handleIniciarProva(provaAtual.faculdade, provaAtual.ano)
                      }
                      size='lg'
                      className='bg-gradient-to-r from-blue-600 to-purple-600'
                    >
                      <Play className='mr-2 h-4 w-4' />
                      Refazer Prova
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Revisão detalhada das questões */}
              <div className='mt-8 space-y-6'>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                  Revisão das Questões
                </h2>
                {questoesProva.map((questao, index) => {
                  const respostaAluno = respostas[index];
                  const acertou =
                    respostaAluno === questao.resposta_correta.toUpperCase();
                  return (
                    <motion.div
                      key={questao.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`border-l-4 ${
                          acertou
                            ? 'border-l-green-500 bg-green-50/50'
                            : 'border-l-red-500 bg-red-50/50'
                        }`}
                      >
                        <CardContent className='p-6'>
                          <div className='flex items-start gap-4'>
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                acertou
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {acertou ? (
                                <CheckCircle2 className='h-6 w-6' />
                              ) : (
                                <XCircle className='h-6 w-6' />
                              )}
                            </div>
                            <div className='flex-1 space-y-4'>
                              <div>
                                <div className='flex items-center gap-2 mb-2'>
                                  <Badge
                                    variant='outline'
                                    className={
                                      acertou
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }
                                  >
                                    Questão {index + 1}
                                  </Badge>
                                  {questao.disciplina && (
                                    <Badge
                                      variant='outline'
                                      className='bg-blue-50 text-blue-700'
                                    >
                                      {questao.disciplina}
                                    </Badge>
                                  )}
                                </div>
                                <p className='text-gray-800 font-medium mb-4'>
                                  {questao.enunciado}
                                </p>
                                {questao.imagem_enunciado && (
                                  <div className='mt-3 border rounded-lg p-3 bg-white'>
                                    <img
                                      src={questao.imagem_enunciado}
                                      alt='Imagem da questão'
                                      className='max-w-full max-h-96 mx-auto rounded'
                                    />
                                  </div>
                                )}
                              </div>

                              <div className='space-y-2'>
                                {['a', 'b', 'c', 'd', 'e']
                                  .filter((letra) => questao[`opcao_${letra}`])
                                  .map((letra) => {
                                    const letraUpper = letra.toUpperCase();
                                    const isCorreta =
                                      letraUpper ===
                                      questao.resposta_correta.toUpperCase();
                                    const isRespostaAluno =
                                      letraUpper === respostaAluno;

                                    return (
                                      <div
                                        key={letra}
                                        className={`p-3 rounded-lg border-2 ${
                                          isCorreta
                                            ? 'border-green-500 bg-green-50'
                                            : isRespostaAluno && !acertou
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-200 bg-white'
                                        }`}
                                      >
                                        <div className='flex items-start gap-3'>
                                          <span
                                            className={`font-bold ${
                                              isCorreta
                                                ? 'text-green-700'
                                                : isRespostaAluno && !acertou
                                                ? 'text-red-700'
                                                : 'text-gray-700'
                                            }`}
                                          >
                                            {letraUpper})
                                          </span>
                                          <span
                                            className={
                                              isCorreta
                                                ? 'text-green-700'
                                                : isRespostaAluno && !acertou
                                                ? 'text-red-700'
                                                : 'text-gray-700'
                                            }
                                          >
                                            {questao[`opcao_${letra}`]}
                                          </span>
                                          {isCorreta && (
                                            <Badge className='ml-auto bg-green-500'>
                                              Correta
                                            </Badge>
                                          )}
                                          {isRespostaAluno && !acertou && (
                                            <Badge className='ml-auto bg-red-500'>
                                              Sua resposta
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>

                              {!respostaAluno && (
                                <div className='bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded'>
                                  <p className='text-yellow-800 text-sm font-medium'>
                                    ⚠️ Você não respondeu esta questão
                                  </p>
                                </div>
                              )}

                              {questao.comentario && (
                                <div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4'>
                                  <h4 className='font-bold text-blue-900 mb-2 flex items-center gap-2'>
                                    <BookOpen className='h-4 w-4' />
                                    Comentário e Explicação
                                  </h4>
                                  <p className='text-blue-800 text-sm leading-relaxed'>
                                    {questao.comentario}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      );
    }

    const questaoAtual = questoesProva[questaoAtualIndex];
    const respostaAtual = respostas[questaoAtualIndex];

    return (
      <>
        <Helmet>
          <title>Prova em Andamento - AmigoMeD!</title>
        </Helmet>
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6'>
          <div className='max-w-5xl mx-auto space-y-4'>
            <Card className='shadow-lg'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <div>
                    <h2 className='text-xl font-bold text-gray-800'>
                      {provaAtual.faculdade} - {provaAtual.ano}
                    </h2>
                    <p className='text-sm text-gray-600'>
                      Questão {questaoAtualIndex + 1} de {questoesProva.length}
                    </p>
                  </div>
                  <div className='flex items-center gap-6'>
                    <div className='text-center'>
                      <Clock className='h-5 w-5 text-blue-600 mx-auto' />
                      <p className='text-sm font-mono font-bold text-blue-600'>
                        {formatarTempo(tempoDecorrido)}
                      </p>
                    </div>
                    <div className='text-center'>
                      <Flag className='h-5 w-5 text-purple-600 mx-auto' />
                      <p className='text-sm font-bold text-purple-600'>
                        {Object.keys(respostas).length}/{questoesProva.length}
                      </p>
                    </div>
                  </div>
                </div>
                <Progress
                  value={
                    (Object.keys(respostas).length / questoesProva.length) * 100
                  }
                  className='mt-3'
                />
              </CardContent>
            </Card>

            <Card className='shadow-lg'>
              <CardContent className='p-6 space-y-6'>
                <div>
                  <p className='text-lg font-medium text-gray-900 leading-relaxed'>
                    {questaoAtual.enunciado}
                  </p>
                  {questaoAtual.imagem_enunciado && (
                    <div className='mt-4 border rounded-lg p-3 bg-gray-50'>
                      <img
                        src={questaoAtual.imagem_enunciado}
                        alt='Imagem da questão'
                        className='max-w-full max-h-96 mx-auto rounded'
                      />
                    </div>
                  )}
                </div>

                <div className='space-y-3'>
                  {['A', 'B', 'C', 'D', 'E'].map((letra) => {
                    const opcao = questaoAtual[`opcao_${letra.toLowerCase()}`];
                    if (!opcao) return null;

                    const selecionada = respostaAtual === letra;

                    return (
                      <button
                        key={letra}
                        onClick={() => handleResponder(letra)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selecionada
                            ? 'bg-blue-50 border-blue-500 shadow-md'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <span className='font-bold text-blue-600'>
                          {letra})
                        </span>{' '}
                        <span
                          className={
                            selecionada
                              ? 'text-blue-900 font-medium'
                              : 'text-gray-700'
                          }
                        >
                          {opcao}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className='shadow-lg'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <Button
                    onClick={handleQuestaoAnterior}
                    disabled={questaoAtualIndex === 0}
                    variant='outline'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Anterior
                  </Button>
                  <div className='flex gap-2'>
                    <Button onClick={handleVoltarLista} variant='outline'>
                      Sair
                    </Button>
                    <Button
                      onClick={handleFinalizarProva}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <Flag className='mr-2 h-4 w-4' />
                      Finalizar Prova
                    </Button>
                  </div>
                  <Button
                    onClick={handleProximaQuestao}
                    disabled={questaoAtualIndex === questoesProva.length - 1}
                  >
                    Próxima
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isAdmin ? 'Admin: ' : ''}Provas Anteriores - AmigoMeD!</title>
      </Helmet>

      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='border-l-4 border-l-blue-500'>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <BookOpen className='h-8 w-8 text-blue-500' />
                <div>
                  <div className='text-2xl font-bold text-blue-600'>
                    {provas.length}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Total de Questões
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-green-500'>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Building2 className='h-8 w-8 text-green-500' />
                <div>
                  <div className='text-2xl font-bold text-green-600'>
                    {faculdadesUnicas.length}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Faculdades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-purple-500'>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Calendar className='h-8 w-8 text-purple-500' />
                <div>
                  <div className='text-2xl font-bold text-purple-600'>
                    {anosUnicos.length}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Anos Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-amber-500'>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Play className='h-8 w-8 text-amber-500' />
                <div>
                  <div className='text-2xl font-bold text-amber-600'>
                    {faculdadesUnicas.length * anosUnicos.length}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Provas Disponíveis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
              <div>
                <CardTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                  Provas Anteriores
                </CardTitle>
                <CardDescription className='mt-2'>
                  {isAdmin
                    ? 'Gerencie questões e importe provas via CSV'
                    : 'Selecione uma prova para começar a estudar'}
                </CardDescription>
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={fetchProvas}
                  variant='outline'
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Search className='mr-2 h-4 w-4' />
                  )}
                  Recarregar
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      onClick={() => setCsvModalOpen(true)}
                      variant='outline'
                    >
                      <Upload className='mr-2 h-4 w-4' />
                      Importar CSV
                    </Button>
                    <Button
                      onClick={() => handleOpenModal()}
                      className='bg-gradient-to-r from-blue-600 to-purple-600'
                    >
                      <PlusCircle className='mr-2 h-4 w-4' />
                      Adicionar Questão
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
              <Input
                placeholder='Buscar por texto...'
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
              <Select
                value={filters.faculdade}
                onValueChange={(v) => setFilters({ ...filters, faculdade: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Todas Faculdades' />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value='all'>Todas Faculdades</SelectItem>
                  {faculdadesUnicas.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.ano}
                onValueChange={(v) => setFilters({ ...filters, ano: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Todos os Anos' />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value='all'>Todos os Anos</SelectItem>
                  {anosUnicos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <Loader2 className='h-12 w-12 animate-spin text-blue-600 mb-4' />
                <p className='text-gray-500'>Carregando provas...</p>
              </div>
            ) : (
              <div className='space-y-6'>
                {faculdadesUnicas.map((faculdade) => {
                  const anosDaFaculdade = [
                    ...new Set(
                      filteredProvas
                        .filter((p) => p.nome_faculdade === faculdade)
                        .map((p) => p.ano)
                    ),
                  ].sort((a, b) => b - a);
                  if (anosDaFaculdade.length === 0) return null;

                  return (
                    <div key={faculdade} className='space-y-3'>
                      <h3 className='text-lg font-bold text-gray-800 flex items-center gap-2'>
                        <Building2 className='h-5 w-5 text-blue-600' />
                        {faculdade}
                      </h3>
                      <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {anosDaFaculdade.map((ano) => {
                          const questoesDaProva = filteredProvas.filter(
                            (p) =>
                              p.nome_faculdade === faculdade && p.ano === ano
                          );
                          return (
                            <motion.div
                              key={`${faculdade}-${ano}`}
                              whileHover={{ scale: 1.02 }}
                            >
                              <Card className='border-2 hover:border-blue-400 hover:shadow-lg transition-all'>
                                <CardContent className='p-6'>
                                  <div className='space-y-4'>
                                    <div className='flex items-start justify-between'>
                                      <div>
                                        <Badge className='bg-purple-100 text-purple-800 mb-2'>
                                          <Calendar className='h-3 w-3 mr-1' />
                                          {ano}
                                        </Badge>
                                        <p className='text-2xl font-bold text-gray-800'>
                                          {questoesDaProva.length}
                                        </p>
                                        <p className='text-sm text-gray-600'>
                                          questões
                                        </p>
                                      </div>
                                    </div>
                                    <div className='space-y-2'>
                                      <Button
                                        onClick={() =>
                                          handleIniciarProva(faculdade, ano)
                                        }
                                        className='w-full bg-gradient-to-r from-blue-600 to-purple-600'
                                      >
                                        <Play className='mr-2 h-4 w-4' />
                                        Iniciar Prova
                                      </Button>
                                      {isAdmin && (
                                        <Button
                                          onClick={() => {
                                            setFilters({
                                              ...filters,
                                              faculdade: faculdade,
                                              ano: ano.toString(),
                                              search: '',
                                            });
                                            window.scrollTo({
                                              top: document.body.scrollHeight,
                                              behavior: 'smooth',
                                            });
                                          }}
                                          variant='outline'
                                          className='w-full'
                                        >
                                          <Edit className='mr-2 h-4 w-4' />
                                          Ver Questões
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {faculdadesUnicas.length === 0 && (
                  <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
                    <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500 mb-2'>
                      Nenhuma prova encontrada
                    </p>
                  </div>
                )}

                {isAdmin &&
                  (filters.search ||
                    filters.faculdade !== 'all' ||
                    filters.ano !== 'all') && (
                    <div className='mt-8 space-y-4'>
                      <div className='flex justify-between items-center'>
                        <h3 className='text-lg font-bold text-gray-800'>
                          Questões Filtradas ({filteredProvas.length})
                        </h3>
                        {(filters.faculdade !== 'all' ||
                          filters.ano !== 'all') && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              setFilters({
                                faculdade: 'all',
                                ano: 'all',
                                search: '',
                              })
                            }
                          >
                            Limpar Filtros
                          </Button>
                        )}
                      </div>
                      {filteredProvas.slice(0, 50).map((prova) => (
                        <Card key={prova.id} className='border-gray-200'>
                          <CardContent className='p-4'>
                            <div className='flex justify-between items-start gap-4'>
                              <div className='flex-1 space-y-2'>
                                <div className='flex gap-2'>
                                  <Badge
                                    variant='outline'
                                    className='bg-blue-50 text-blue-700'
                                  >
                                    {prova.nome_faculdade}
                                  </Badge>
                                  <Badge
                                    variant='outline'
                                    className='bg-purple-50 text-purple-700'
                                  >
                                    {prova.ano}
                                  </Badge>
                                  {prova.disciplina && (
                                    <Badge
                                      variant='outline'
                                      className='bg-green-50 text-green-700'
                                    >
                                      {prova.disciplina}
                                    </Badge>
                                  )}
                                </div>
                                <p className='text-sm text-gray-700'>
                                  {prova.enunciado.substring(0, 150)}...
                                </p>
                              </div>
                              <div className='flex gap-2'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => handleOpenModal(prova)}
                                >
                                  <Edit className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => handleDeleteProva(prova.id)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredProvas.length > 50 && (
                        <p className='text-center text-gray-500 text-sm'>
                          Mostrando apenas as primeiras 50 questões. Use os
                          filtros para refinar sua busca.
                        </p>
                      )}
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Importar Provas via CSV</DialogTitle>
              <DialogDescription>
                <div className='space-y-2'>
                  <p>
                    O arquivo CSV deve conter as seguintes colunas (na ordem):
                  </p>
                  <div className='bg-gray-100 p-2 rounded text-xs font-mono'>
                    nome_faculdade,ano,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,comentario,disciplina
                  </div>
                  <p className='text-xs text-amber-600'>
                    <strong>⚠️ Importante:</strong> Textos com vírgulas devem
                    estar entre aspas duplas ("texto com, vírgula")
                  </p>
                  <p className='text-xs text-blue-600'>
                    📄 Use o arquivo <strong>exemplo-provas-correto.csv</strong>{' '}
                    como modelo
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='csv-file'>Arquivo CSV</Label>
                <Input
                  id='csv-file'
                  type='file'
                  accept='.csv'
                  onChange={(e) => setCsvFile(e.target.files[0])}
                />
              </div>
              {csvFile && (
                <div className='bg-blue-50 border border-blue-200 rounded p-3'>
                  <p className='text-sm text-blue-800'>
                    <strong>Arquivo:</strong> {csvFile.name}
                  </p>
                  <p className='text-sm text-blue-600'>
                    Tamanho: {(csvFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className='bg-amber-50 border border-amber-200 rounded p-3'>
                <p className='text-xs text-amber-800 mb-2'>
                  <strong>⚠️ Debug:</strong> Abra o Console (F12) para ver logs
                  detalhados
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={async () => {
                    console.log('🔍 Testando conexão com Supabase...');
                    const { data, error, count } = await supabase
                      .from('provas_anteriores')
                      .select('*', { count: 'exact', head: true });

                    if (error) {
                      console.error('❌ Erro ao conectar:', error);
                      toast({
                        variant: 'destructive',
                        title: 'Erro de conexão',
                        description: error.message,
                      });
                    } else {
                      console.log('✅ Conexão OK! Total de registros:', count);
                      toast({
                        title: `✅ Conexão OK! ${count || 0} questões no banco`,
                      });
                    }
                  }}
                >
                  Testar Conexão
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setCsvModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCsvUpload}
                disabled={!csvFile || csvProcessing}
                className='bg-gradient-to-r from-blue-600 to-purple-600'
              >
                {csvProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className='mr-2 h-4 w-4' />
                    Importar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isAdmin && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className='sm:max-w-[900px] max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                  {isEditing ? 'Editar' : 'Adicionar'} Questão
                </DialogTitle>
              </DialogHeader>
              {currentProva && (
                <div className='grid gap-4 py-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Faculdade *</Label>
                      <Input
                        value={currentProva.nome_faculdade || ''}
                        onChange={(e) =>
                          setCurrentProva({
                            ...currentProva,
                            nome_faculdade: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Ano *</Label>
                      <Select
                        value={
                          currentProva.ano?.toString() || currentYear.toString()
                        }
                        onValueChange={(v) =>
                          setCurrentProva({ ...currentProva, ano: parseInt(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                          {anos.map((ano) => (
                            <SelectItem key={ano} value={ano.toString()}>
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>Disciplina</Label>
                    <Input
                      value={currentProva.disciplina || ''}
                      onChange={(e) =>
                        setCurrentProva({
                          ...currentProva,
                          disciplina: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Enunciado *</Label>
                    <Textarea
                      value={currentProva.enunciado || ''}
                      onChange={(e) =>
                        setCurrentProva({
                          ...currentProva,
                          enunciado: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>URL da Imagem (opcional)</Label>
                    <Input
                      type='url'
                      placeholder='https://exemplo.com/imagem.jpg'
                      value={currentProva.imagem_enunciado || ''}
                      onChange={(e) =>
                        setCurrentProva({
                          ...currentProva,
                          imagem_enunciado: e.target.value,
                        })
                      }
                    />
                    {currentProva.imagem_enunciado && (
                      <div className='mt-2 border rounded-lg p-2 bg-gray-50'>
                        <img
                          src={currentProva.imagem_enunciado}
                          alt='Preview'
                          className='max-h-48 mx-auto rounded'
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <p
                          className='text-sm text-red-500 text-center mt-2'
                          style={{ display: 'none' }}
                        >
                          ⚠️ URL da imagem inválida ou inacessível
                        </p>
                      </div>
                    )}
                  </div>
                  {['a', 'b', 'c', 'd', 'e'].map((letra) => (
                    <div key={letra} className='space-y-2'>
                      <Label>
                        Opção {letra.toUpperCase()}{' '}
                        {letra === 'e' ? '(Opcional)' : '*'}
                      </Label>
                      <Input
                        value={currentProva[`opcao_${letra}`] || ''}
                        onChange={(e) =>
                          setCurrentProva({
                            ...currentProva,
                            [`opcao_${letra}`]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                  <div className='space-y-2'>
                    <Label>Resposta Correta *</Label>
                    <Select
                      value={currentProva.resposta_correta || 'A'}
                      onValueChange={(v) =>
                        setCurrentProva({
                          ...currentProva,
                          resposta_correta: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        {['A', 'B', 'C', 'D', 'E'].map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Comentário</Label>
                    <Textarea
                      value={currentProva.comentario || ''}
                      onChange={(e) =>
                        setCurrentProva({
                          ...currentProva,
                          comentario: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant='outline' onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProva}
                  disabled={loading}
                  className='bg-gradient-to-r from-blue-600 to-purple-600'
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Salvando...
                    </>
                  ) : (
                    <>{isEditing ? 'Atualizar' : 'Adicionar'}</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default ProvasAnterioresPage;
