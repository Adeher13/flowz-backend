import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Target,
  Play,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AlunosSimuladosPage = () => {
  const { user } = useAuth();
  const [simulados, setSimulados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list', 'active', 'results'
  const [selectedSimulado, setSelectedSimulado] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]);
  const [simuladosFinalizados, setSimuladosFinalizados] = useState([]);
  const [selectedHistorySimulado, setSelectedHistorySimulado] = useState(null);
  const [resultsSaved, setResultsSaved] = useState(false);
  const savingInProgress = useRef(false);

  // Buscar simulados do banco de dados ou do estado local
  useEffect(() => {
    fetchSimulados();
    if (user) {
      fetchHistory();
      fetchSimuladosFinalizados();
    }
  }, [user]);

  const fetchSimulados = async () => {
    setLoading(true);

    try {
      // Buscar simulados ativos do Supabase
      const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear dados do Supabase para o formato esperado
      const simuladosFormatados = (data || []).map((s) => ({
        id: s.id,
        nomeFaculdade: s.nome_faculdade,
        totalQuestoes: s.total_questoes,
        duracaoMinutos: s.duracao_minutos,
        ativo: s.ativo,
        criadoEm: s.created_at,
        participantes: 0, // Pode calcular depois com count de quiz_attempts
        disciplinas: s.disciplinas || {},
      }));

      setSimulados(simuladosFormatados);
    } catch (error) {
      console.error('Erro ao buscar simulados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar simulados',
        description: 'Não foi possível carregar os simulados disponíveis.',
      });
      setSimulados([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setQuizHistory(data);
    }
  };

  const fetchSimuladosFinalizados = async () => {
    if (!user) return;

    try {
      // Buscar simulados finalizados do usuário
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false });

      if (error) throw error;

      // Formatar dados
      const finalizadosFormatados = (data || []).map((attempt) => ({
        id: attempt.id,
        simuladoNome: attempt.simulado_nome,
        dataFinalizacao: attempt.finished_at,
        acertos: attempt.questoes_certas,
        total: attempt.total_questoes,
        porcentagem: Math.round(
          (attempt.questoes_certas / attempt.total_questoes) * 100
        ),
        tempoDuracao: `${
          attempt.tempo_gasto_minutos || attempt.duracao_minutos
        } min`,
        disciplinas: attempt.disciplinas_desempenho || {},
        questoesDetalhadas: attempt.questoes_detalhadas || [],
      }));

      setSimuladosFinalizados(finalizadosFormatados);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setSimuladosFinalizados([]);
    }
  };

  const handleDeleteSimulado = async (simuladoId, e) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja excluir este simulado finalizado?')) {
      return;
    }

    try {
      console.log('🗑️ Tentando deletar simulado ID:', simuladoId);
      console.log('👤 User ID:', user.id);

      const { data, error } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('id', simuladoId)
        .eq('user_id', user.id)
        .select();

      console.log('📊 Resultado da deleção:', {
        data,
        error,
        deletados: data?.length,
      });

      if (error) throw error;

      // Atualizar estado local
      setSimuladosFinalizados(
        simuladosFinalizados.filter((sim) => sim.id !== simuladoId)
      );

      toast({
        title: 'Simulado excluído',
        description: 'O simulado foi removido com sucesso.',
      });
    } catch (error) {
      console.error('❌ Erro ao excluir simulado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: `Não foi possível excluir o simulado. ${error.message}`,
      });
    }
  };

  const handleDeleteAllSimulados = async () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir TODOS os ${simuladosFinalizados.length} simulados finalizados? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      console.log('🗑️ Tentando deletar TODOS os simulados');
      console.log('👤 User ID:', user.id);
      console.log(
        '👤 Auth UID:',
        (await supabase.auth.getUser()).data.user?.id
      );
      console.log('📊 Total a deletar:', simuladosFinalizados.length);
      console.log(
        '📄 IDs a deletar:',
        simuladosFinalizados.map((s) => s.id)
      );

      // Primeiro, verificar se conseguimos ver os registros
      const { data: checkData, error: checkError } = await supabase
        .from('quiz_attempts')
        .select('id, user_id')
        .in(
          'id',
          simuladosFinalizados.map((s) => s.id)
        );

      console.log('🔍 Verificação antes de deletar:', {
        encontrados: checkData?.length,
        checkError,
        primeiroRegistro: checkData?.[0],
      });

      // Deletar usando os IDs da lista de finalizados
      const ids = simuladosFinalizados.map((s) => s.id);

      const { data, error, count } = await supabase
        .from('quiz_attempts')
        .delete()
        .in('id', ids)
        .select();

      console.log('📊 Resultado da deleção em massa:', {
        data,
        error,
        count,
        deletados: data?.length,
      });

      if (error) throw error;

      // Limpar estado local
      setSimuladosFinalizados([]);

      toast({
        title: 'Todos os simulados excluídos',
        description: `${
          data?.length || 0
        } simulados foram removidos com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao excluir todos os simulados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: `Não foi possível excluir os simulados. ${error.message}`,
      });
    }
  };

  const startSimulado = async (simulado) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description: 'Você precisa estar logado para iniciar um simulado.',
      });
      return;
    }

    setLoading(true);
    setSelectedSimulado(simulado);

    // Buscar questões de acordo com as disciplinas e quantidades especificadas
    const allQuestions = [];

    for (const [disciplina, quantidade] of Object.entries(
      simulado.disciplinas
    )) {
      const { data, error } = await supabase
        .from('questoes')
        .select('*')
        .eq('disciplina', disciplina)
        .limit(quantidade * 2); // Buscar mais para ter opções

      if (error) {
        console.error(`Erro ao buscar questões de ${disciplina}:`, error);
      }

      if (data && data.length > 0) {
        // Embaralhar e pegar a quantidade necessária
        const questoesSelecionadas = data
          .sort(() => Math.random() - 0.5)
          .slice(0, quantidade);
        allQuestions.push(...questoesSelecionadas);
      }
    }

    if (allQuestions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma questão encontrada',
        description:
          'Não há questões disponíveis para as disciplinas deste simulado.',
      });
      setLoading(false);
      return;
    }

    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setUserAnswers(Array(shuffledQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setTimeLeft(simulado.duracaoMinutos * 60);
    setView('active');
    setLoading(false);
  };

  // Timer
  useEffect(() => {
    if (view !== 'active' || timeLeft <= 0) {
      if (view === 'active' && timeLeft <= 0) {
        setView('results');
      }
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [view, timeLeft]);

  const handleAnswer = (option) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setResultsSaved(false); // Resetar flag antes de mostrar resultados
      savingInProgress.current = false; // Resetar ref também
      setView('results');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateResults = () => {
    let correct = 0;
    const disciplinasDesempenho = {};

    questions.forEach((q, i) => {
      const disciplina = q.disciplina || q.disciplina_normalizada;

      if (!disciplinasDesempenho[disciplina]) {
        disciplinasDesempenho[disciplina] = { acertos: 0, total: 0 };
      }

      disciplinasDesempenho[disciplina].total++;

      if (userAnswers[i] === q.resposta_correta) {
        correct++;
        disciplinasDesempenho[disciplina].acertos++;
      }
    });

    return {
      correct,
      total: questions.length,
      percentage: ((correct / questions.length) * 100).toFixed(1),
      disciplinasDesempenho,
    };
  };

  const saveSimuladoFinalizado = async (results) => {
    if (!user || !selectedSimulado) return;

    // Proteção contra duplicação - verificar se já está salvando
    if (savingInProgress.current) {
      console.log('Salvamento já em progresso, ignorando chamada duplicada');
      return;
    }

    savingInProgress.current = true;

    try {
      const tempoGasto = Math.floor(
        (selectedSimulado.duracaoMinutos * 60 - timeLeft) / 60
      );
      const notaFinal = parseFloat(results.percentage);

      // Criar array com questões, respostas do usuário e respostas corretas
      const questoesDetalhadas = questions.map((q, index) => ({
        questao: q.texto_questao,
        disciplina: q.disciplina,
        opcoes: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e].filter(
          Boolean
        ),
        respostaCorreta: q.resposta_correta,
        respostaUsuario: userAnswers[index] || null,
        acertou: userAnswers[index] === q.resposta_correta,
        explicacao: q.explicacao || null,
      }));

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          simulado_id: selectedSimulado.id,
          simulado_nome: selectedSimulado.nomeFaculdade,
          total_questoes: results.total,
          questoes_certas: results.correct,
          duracao_minutos: selectedSimulado.duracaoMinutos,
          tempo_gasto_minutos: tempoGasto,
          disciplinas_desempenho: results.disciplinasDesempenho,
          questoes_detalhadas: questoesDetalhadas,
          nota_final: notaFinal,
          finished_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      const novoFinalizado = {
        id: data.id,
        simuladoNome: selectedSimulado.nomeFaculdade,
        dataFinalizacao: data.finished_at,
        acertos: results.correct,
        total: results.total,
        porcentagem: notaFinal,
        tempoDuracao: `${tempoGasto} min`,
        disciplinas: results.disciplinasDesempenho,
        questoesDetalhadas: questoesDetalhadas,
      };

      setSimuladosFinalizados([novoFinalizado, ...simuladosFinalizados]);

      toast({
        title: 'Simulado Concluído!',
        description: 'Seu resultado foi salvo com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar simulado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o resultado. Tente novamente.',
      });
    } finally {
      // Resetar flag após salvar (sucesso ou erro)
      setTimeout(() => {
        savingInProgress.current = false;
      }, 2000); // 2 segundos de delay para evitar cliques duplos
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando simulados...</p>
        </div>
      </div>
    );
  }

  // View: Lista de Simulados
  if (view === 'list') {
    return (
      <>
        <Helmet>
          <title>Simulados Disponíveis - AmigoMeD!</title>
          <meta
            name='description'
            content='Realize simulados personalizados e teste seus conhecimentos.'
          />
        </Helmet>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='text-center mb-12'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Target className='h-16 w-16 text-cyan-600 mx-auto mb-4' />
              <h1 className='text-4xl font-bold text-gray-900'>
                Simulados Disponíveis
              </h1>
              <p className='text-xl text-gray-600 mt-2'>
                Escolha um simulado e teste seus conhecimentos
              </p>
            </motion.div>
          </div>

          <Tabs defaultValue='disponiveis' className='space-y-6'>
            <TabsList className='grid w-full max-w-md mx-auto grid-cols-2'>
              <TabsTrigger value='disponiveis'>
                Simulados Disponíveis
              </TabsTrigger>
              <TabsTrigger value='finalizados'>
                Simulados Finalizados
              </TabsTrigger>
            </TabsList>

            <TabsContent value='disponiveis' className='space-y-6'>
              {/* Simulados das Faculdades */}
              <Card className='bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200'>
                <CardHeader>
                  <CardTitle className='flex items-center text-2xl'>
                    <Target className='mr-3 h-7 w-7 text-cyan-600' />
                    Simulados de Faculdades
                  </CardTitle>
                  <CardDescription>
                    Simulados oficiais criados com base nos processos seletivos
                    das instituições
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid md:grid-cols-2 gap-4'>
                  {simulados
                    .filter((s) => s.ativo)
                    .map((simulado) => (
                      <motion.div
                        key={simulado.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all'
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <div>
                            <h3 className='text-xl font-bold text-gray-900 mb-1'>
                              🏫 {simulado.nomeFaculdade}
                            </h3>
                            <Badge
                              variant='outline'
                              className='bg-green-50 text-green-700 border-green-200'
                            >
                              Ativo
                            </Badge>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 mb-4 text-sm'>
                          <div className='flex items-center text-gray-600'>
                            <FileText className='h-4 w-4 mr-2 text-cyan-600' />
                            {simulado.totalQuestoes} questões
                          </div>
                          <div className='flex items-center text-gray-600'>
                            <Clock className='h-4 w-4 mr-2 text-cyan-600' />
                            {simulado.duracaoMinutos} min
                          </div>
                          <div className='flex items-center text-gray-600'>
                            <BookOpen className='h-4 w-4 mr-2 text-cyan-600' />
                            {Object.keys(simulado.disciplinas).length}{' '}
                            disciplinas
                          </div>
                          <div className='flex items-center text-gray-600'>
                            <Users className='h-4 w-4 mr-2 text-cyan-600' />
                            {simulado.participantes} alunos
                          </div>
                        </div>

                        <div className='mb-4'>
                          <p className='text-xs text-gray-500 mb-2 font-medium'>
                            Distribuição:
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {Object.entries(simulado.disciplinas).map(
                              ([disc, qtd]) => (
                                <Badge
                                  key={disc}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {disc}: {qtd}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>

                        <Button
                          className='w-full bg-cyan-600 hover:bg-cyan-700'
                          onClick={() => startSimulado(simulado)}
                          disabled={loading || !user}
                        >
                          <Play className='mr-2 h-4 w-4' />
                          Iniciar Simulado
                        </Button>
                      </motion.div>
                    ))}
                </CardContent>
              </Card>

              {!user && (
                <Alert variant='destructive'>
                  <ShieldAlert className='h-4 w-4' />
                  <AlertTitle>Acesso Negado</AlertTitle>
                  <AlertDescription>
                    Você precisa estar logado para realizar simulados.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value='finalizados' className='space-y-6'>
              <Card>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='flex items-center text-2xl'>
                        <Award className='mr-3 h-7 w-7 text-purple-600' />
                        Simulados Finalizados
                      </CardTitle>
                      <CardDescription>
                        Consulte seus simulados anteriores e revise seu
                        desempenho
                      </CardDescription>
                    </div>
                    {simuladosFinalizados.length > 0 && (
                      <Button
                        variant='outline'
                        className='text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                        onClick={handleDeleteAllSimulados}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Excluir Todos
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {simuladosFinalizados.length === 0 ? (
                    <div className='text-center py-12'>
                      <FileText className='mx-auto h-16 w-16 text-gray-300' />
                      <h3 className='mt-4 text-lg font-medium text-gray-900'>
                        Nenhum simulado finalizado
                      </h3>
                      <p className='mt-2 text-gray-500'>
                        Complete seu primeiro simulado para ver os resultados
                        aqui
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {simuladosFinalizados.map((sim) => (
                        <motion.div
                          key={sim.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer'
                          onClick={() => setSelectedHistorySimulado(sim)}
                        >
                          <div className='flex items-start justify-between mb-4'>
                            <div>
                              <h3 className='text-xl font-bold text-gray-900 mb-1'>
                                🏫 {sim.simuladoNome}
                              </h3>
                              <div className='flex items-center gap-2 text-sm text-gray-500'>
                                <Calendar className='h-4 w-4' />
                                {new Date(
                                  sim.dataFinalizacao
                                ).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            <Badge
                              className={`text-lg px-4 py-2 ${
                                sim.porcentagem >= 70
                                  ? 'bg-green-500'
                                  : sim.porcentagem >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                            >
                              {sim.porcentagem.toFixed(1)}%
                            </Badge>
                          </div>

                          <div className='grid grid-cols-3 gap-4 mb-4'>
                            <div className='text-center bg-white rounded-lg p-3'>
                              <p className='text-sm text-gray-500'>Acertos</p>
                              <p className='text-2xl font-bold text-green-600'>
                                {sim.acertos}
                              </p>
                            </div>
                            <div className='text-center bg-white rounded-lg p-3'>
                              <p className='text-sm text-gray-500'>Erros</p>
                              <p className='text-2xl font-bold text-red-600'>
                                {sim.total - sim.acertos}
                              </p>
                            </div>
                            <div className='text-center bg-white rounded-lg p-3'>
                              <p className='text-sm text-gray-500'>Duração</p>
                              <p className='text-2xl font-bold text-cyan-600'>
                                {sim.tempoDuracao}
                              </p>
                            </div>
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              className='flex-1'
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHistorySimulado(sim);
                                setView('history-detail');
                              }}
                            >
                              Ver Detalhes{' '}
                              <ChevronRight className='ml-2 h-4 w-4' />
                            </Button>
                            <Button
                              variant='outline'
                              className='text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                              onClick={(e) => handleDeleteSimulado(sim.id, e)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </>
    );
  }

  // View: Quiz Ativo
  if (view === 'active' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Processar alternativas - formato com opcao_a, opcao_b, etc
    const alternativasArray = [
      currentQuestion.opcao_a,
      currentQuestion.opcao_b,
      currentQuestion.opcao_c,
      currentQuestion.opcao_d,
      currentQuestion.opcao_e,
    ].filter(Boolean); // Remove null/undefined

    return (
      <>
        <Helmet>
          <title>Simulado {selectedSimulado?.nomeFaculdade} - AmigoMeD!</title>
        </Helmet>

        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
            {/* Header do Quiz - Modernizado */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8'
            >
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center'>
                      <FileText className='h-5 w-5 text-white' />
                    </div>
                    <h1 className='text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent'>
                      {selectedSimulado?.nomeFaculdade}
                    </h1>
                  </div>
                  <p className='text-sm text-gray-500 ml-13'>
                    Questão {currentQuestionIndex + 1} de {questions.length}
                  </p>
                </div>

                <div className='flex items-center gap-6'>
                  <div className='flex items-center gap-3 bg-gradient-to-br from-cyan-50 to-blue-50 px-6 py-3 rounded-xl border border-cyan-200'>
                    <Clock className='h-5 w-5 text-cyan-600' />
                    <div>
                      <p className='text-xs text-gray-500 font-medium'>
                        Tempo restante
                      </p>
                      <p className='text-2xl font-bold text-cyan-600'>
                        {formatTime(timeLeft)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar Modernizada */}
              <div className='mt-6'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>
                    Progresso
                  </span>
                  <span className='text-sm font-bold text-cyan-600'>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className='h-3 bg-gray-100 rounded-full overflow-hidden'>
                  <motion.div
                    className='h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full'
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Card da Questão - Design Moderno */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'
            >
              {/* Header da Questão */}
              <div className='bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <Badge className='bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 text-sm font-medium'>
                    {currentQuestion.disciplina}
                  </Badge>
                  {currentQuestion.difficulty_level && (
                    <Badge
                      variant='outline'
                      className={
                        currentQuestion.difficulty_level === 'Fácil'
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : currentQuestion.difficulty_level === 'Médio'
                          ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                          : 'border-red-300 bg-red-50 text-red-700'
                      }
                    >
                      {currentQuestion.difficulty_level}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enunciado */}
              <div className='p-8'>
                <p className='text-lg leading-relaxed text-gray-800 mb-8'>
                  {currentQuestion.texto_questao}
                </p>

                {/* Alternativas */}
                <div className='space-y-3'>
                  {alternativasArray.map((alternativa, index) => {
                    const letra = String.fromCharCode(65 + index);
                    const isSelected =
                      userAnswers[currentQuestionIndex] === alternativa;

                    return (
                      <motion.button
                        key={letra}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswer(alternativa)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-white border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50 text-gray-800'
                        }`}
                      >
                        <div className='flex items-start gap-4'>
                          <div
                            className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-600 border border-cyan-200'
                            }`}
                          >
                            {letra}
                          </div>
                          <span
                            className={`flex-1 ${
                              isSelected ? 'font-medium' : ''
                            }`}
                          >
                            {alternativa}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Navegação Modernizada */}
            <div className='flex gap-4 mt-8'>
              <Button
                variant='outline'
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className='flex-1 h-14 text-base font-medium border-2 hover:bg-gray-50'
              >
                <ChevronRight className='mr-2 h-5 w-5 rotate-180' />
                Anterior
              </Button>
              <Button
                onClick={handleNext}
                disabled={!userAnswers[currentQuestionIndex]}
                className='flex-1 h-14 text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30'
              >
                {currentQuestionIndex === questions.length - 1
                  ? 'Finalizar'
                  : 'Próxima'}
                <ChevronRight className='ml-2 h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // View: Resultados
  if (view === 'results') {
    const results = calculateResults();

    // Salvar resultados apenas uma vez
    if (!resultsSaved) {
      saveSimuladoFinalizado(results);
      setResultsSaved(true);
    }

    // Identificar disciplinas que precisam de mais atenção
    const disciplinasOrdenadas = Object.entries(results.disciplinasDesempenho)
      .map(([nome, dados]) => ({
        nome,
        ...dados,
        porcentagem: (dados.acertos / dados.total) * 100,
      }))
      .sort((a, b) => a.porcentagem - b.porcentagem);

    const disciplinasAtencao = disciplinasOrdenadas.filter(
      (d) => d.porcentagem < 70
    );

    return (
      <>
        <Helmet>
          <title>Resultado do Simulado - AmigoMeD!</title>
        </Helmet>

        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <Button
            variant='ghost'
            onClick={() => {
              setView('list');
              setQuestions([]);
              setUserAnswers([]);
              setSelectedSimulado(null);
              setResultsSaved(false); // Resetar flag ao voltar
            }}
            className='mb-6'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Voltar para Simulados
          </Button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='space-y-6'
          >
            {/* Card Principal de Resultado */}
            <Card className='bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200'>
              <CardHeader className='text-center'>
                <div className='flex justify-center mb-4'>
                  <Award className='h-16 w-16 text-cyan-600' />
                </div>
                <CardTitle className='text-3xl'>
                  Simulado Concluído! 🎉
                </CardTitle>
                <CardDescription className='text-lg'>
                  {selectedSimulado?.nomeFaculdade}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex justify-center'>
                  <div className='relative'>
                    <svg className='w-48 h-48'>
                      <circle
                        className='text-gray-200'
                        strokeWidth='12'
                        stroke='currentColor'
                        fill='transparent'
                        r='70'
                        cx='96'
                        cy='96'
                      />
                      <circle
                        className={`${
                          results.percentage >= 70
                            ? 'text-green-500'
                            : results.percentage >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                        strokeWidth='12'
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={
                          2 * Math.PI * 70 * (1 - results.percentage / 100)
                        }
                        strokeLinecap='round'
                        stroke='currentColor'
                        fill='transparent'
                        r='70'
                        cx='96'
                        cy='96'
                        transform='rotate(-90 96 96)'
                      />
                    </svg>
                    <div className='absolute inset-0 flex items-center justify-center flex-col'>
                      <span className='text-5xl font-bold text-cyan-600'>
                        {results.percentage}%
                      </span>
                      <span className='text-sm text-gray-500 mt-1'>
                        de aproveitamento
                      </span>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-4 max-w-2xl mx-auto'>
                  <div className='bg-white p-6 rounded-xl shadow-sm text-center'>
                    <CheckCircle className='h-8 w-8 text-green-500 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Acertos</p>
                    <p className='text-3xl font-bold text-green-600'>
                      {results.correct}
                    </p>
                  </div>
                  <div className='bg-white p-6 rounded-xl shadow-sm text-center'>
                    <XCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Erros</p>
                    <p className='text-3xl font-bold text-red-600'>
                      {results.total - results.correct}
                    </p>
                  </div>
                  <div className='bg-white p-6 rounded-xl shadow-sm text-center'>
                    <FileText className='h-8 w-8 text-cyan-500 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Total</p>
                    <p className='text-3xl font-bold text-cyan-600'>
                      {results.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Análise por Disciplina */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-2xl'>
                  <BarChart3 className='mr-3 h-6 w-6 text-purple-600' />
                  Desempenho por Disciplina
                </CardTitle>
                <CardDescription>
                  Veja seu aproveitamento em cada área do conhecimento
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {disciplinasOrdenadas.map((disc, index) => (
                  <motion.div
                    key={disc.nome}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-gray-900'>
                          {disc.nome}
                        </span>
                        <span className='text-sm text-gray-500'>
                          ({disc.acertos}/{disc.total})
                        </span>
                      </div>
                      <Badge
                        className={`${
                          disc.porcentagem >= 70
                            ? 'bg-green-500'
                            : disc.porcentagem >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {disc.porcentagem.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className='relative h-8 bg-gray-100 rounded-full overflow-hidden'>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${disc.porcentagem}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          disc.porcentagem >= 70
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : disc.porcentagem >= 50
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                      />
                      <div className='absolute inset-0 flex items-center justify-center text-sm font-semibold text-white mix-blend-difference'>
                        {disc.porcentagem.toFixed(0)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Áreas de Atenção */}
            {disciplinasAtencao.length > 0 && (
              <Card className='bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'>
                <CardHeader>
                  <CardTitle className='flex items-center text-2xl text-orange-800'>
                    <AlertTriangle className='mr-3 h-6 w-6' />
                    Áreas que Precisam de Mais Atenção
                  </CardTitle>
                  <CardDescription>
                    Foque seus estudos nas disciplinas abaixo para melhorar seu
                    desempenho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid md:grid-cols-2 gap-4'>
                    {disciplinasAtencao.map((disc) => (
                      <div
                        key={disc.nome}
                        className='bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500'
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <h4 className='font-bold text-gray-900'>
                            {disc.nome}
                          </h4>
                          <Badge variant='outline' className='text-orange-600'>
                            {disc.porcentagem.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600'>
                          Você acertou {disc.acertos} de {disc.total} questões.
                          Dedique mais tempo revisando este conteúdo.
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagem Motivacional */}
            <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'>
              <CardContent className='p-6 text-center'>
                <h3 className='text-xl font-bold text-purple-800 mb-2'>
                  {results.percentage >= 70
                    ? '🎯 Excelente trabalho!'
                    : results.percentage >= 50
                    ? '💪 Bom esforço!'
                    : '📚 Continue estudando!'}
                </h3>
                <p className='text-gray-700'>
                  {results.percentage >= 70
                    ? 'Você demonstrou um ótimo domínio do conteúdo. Continue assim!'
                    : results.percentage >= 50
                    ? 'Você está no caminho certo. Revise as áreas de atenção e tente novamente!'
                    : 'Não desanime! Dedique mais tempo aos estudos e você verá progresso.'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  // View: Detalhes do Simulado Finalizado
  if (view === 'history-detail' && selectedHistorySimulado) {
    const sim = selectedHistorySimulado;
    const disciplinasOrdenadas = Object.entries(sim.disciplinas)
      .map(([nome, dados]) => ({
        nome,
        ...dados,
        porcentagem: (dados.acertos / dados.total) * 100,
      }))
      .sort((a, b) => a.porcentagem - b.porcentagem);

    return (
      <>
        <Helmet>
          <title>Detalhes do Simulado - AmigoMeD!</title>
        </Helmet>

        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <Button
            variant='ghost'
            onClick={() => {
              setView('list');
              setSelectedHistorySimulado(null);
            }}
            className='mb-6'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Voltar para Lista
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-6'
          >
            {/* Header */}
            <Card className='bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-3xl mb-2'>
                      🏫 {sim.simuladoNome}
                    </CardTitle>
                    <CardDescription className='flex items-center gap-2 text-base'>
                      <Calendar className='h-4 w-4' />
                      {new Date(sim.dataFinalizacao).toLocaleDateString(
                        'pt-BR',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`text-2xl px-6 py-3 ${
                      sim.porcentagem >= 70
                        ? 'bg-green-500'
                        : sim.porcentagem >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {sim.porcentagem.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='bg-white p-6 rounded-xl text-center'>
                    <CheckCircle className='h-8 w-8 text-green-500 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Acertos</p>
                    <p className='text-3xl font-bold text-green-600'>
                      {sim.acertos}
                    </p>
                  </div>
                  <div className='bg-white p-6 rounded-xl text-center'>
                    <XCircle className='h-8 w-8 text-red-500 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Erros</p>
                    <p className='text-3xl font-bold text-red-600'>
                      {sim.total - sim.acertos}
                    </p>
                  </div>
                  <div className='bg-white p-6 rounded-xl text-center'>
                    <Clock className='h-8 w-8 text-cyan-500 mx-auto mb-2' />
                    <p className='text-sm text-gray-600'>Duração</p>
                    <p className='text-3xl font-bold text-cyan-600'>
                      {sim.tempoDuracao}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desempenho por Disciplina */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-2xl'>
                  <BarChart3 className='mr-3 h-6 w-6 text-purple-600' />
                  Desempenho por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {disciplinasOrdenadas.map((disc, index) => (
                  <motion.div
                    key={disc.nome}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-gray-900'>
                          {disc.nome}
                        </span>
                        <span className='text-sm text-gray-500'>
                          ({disc.acertos}/{disc.total})
                        </span>
                      </div>
                      <Badge
                        className={`${
                          disc.porcentagem >= 70
                            ? 'bg-green-500'
                            : disc.porcentagem >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {disc.porcentagem.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className='relative h-8 bg-gray-100 rounded-full overflow-hidden'>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${disc.porcentagem}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          disc.porcentagem >= 70
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : disc.porcentagem >= 50
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                      />
                      <div className='absolute inset-0 flex items-center justify-center text-sm font-semibold text-white mix-blend-difference'>
                        {disc.porcentagem.toFixed(0)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Questões com Respostas */}
            {sim.questoesDetalhadas && sim.questoesDetalhadas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center text-2xl'>
                    <FileText className='mr-3 h-6 w-6 text-cyan-600' />
                    Revisão das Questões
                  </CardTitle>
                  <CardDescription>
                    Confira cada questão, sua resposta e a resposta correta
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {sim.questoesDetalhadas.map((questao, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-2 rounded-xl p-6 ${
                        questao.acertou
                          ? 'border-green-200 bg-green-50/30'
                          : 'border-red-200 bg-red-50/30'
                      }`}
                    >
                      {/* Header da Questão */}
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                              questao.acertou
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <Badge variant='outline' className='mb-1'>
                              {questao.disciplina}
                            </Badge>
                            <div className='flex items-center gap-2 mt-1'>
                              {questao.acertou ? (
                                <>
                                  <CheckCircle className='h-4 w-4 text-green-600' />
                                  <span className='text-sm font-medium text-green-700'>
                                    Resposta Correta
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className='h-4 w-4 text-red-600' />
                                  <span className='text-sm font-medium text-red-700'>
                                    Resposta Incorreta
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enunciado */}
                      <p className='text-base text-gray-800 mb-4 leading-relaxed'>
                        {questao.questao}
                      </p>

                      {/* Alternativas */}
                      <div className='space-y-2'>
                        {questao.opcoes.map((opcao, opcaoIndex) => {
                          const letra = String.fromCharCode(65 + opcaoIndex);
                          const isRespostaCorreta =
                            opcao === questao.respostaCorreta;
                          const isRespostaUsuario =
                            opcao === questao.respostaUsuario;

                          return (
                            <div
                              key={opcaoIndex}
                              className={`p-4 rounded-lg border-2 ${
                                isRespostaCorreta
                                  ? 'border-green-500 bg-green-50'
                                  : isRespostaUsuario && !questao.acertou
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className='flex items-start gap-3'>
                                <div
                                  className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                    isRespostaCorreta
                                      ? 'bg-green-500 text-white'
                                      : isRespostaUsuario && !questao.acertou
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {letra}
                                </div>
                                <div className='flex-1'>
                                  <p className='text-sm text-gray-800'>
                                    {opcao}
                                  </p>
                                  {isRespostaCorreta && (
                                    <p className='text-xs text-green-700 font-medium mt-1'>
                                      ✓ Resposta Correta
                                    </p>
                                  )}
                                  {isRespostaUsuario && !questao.acertou && (
                                    <p className='text-xs text-red-700 font-medium mt-1'>
                                      ✗ Sua Resposta
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explicação da Resposta */}
                      {questao.explicacao && (
                        <div className='mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg'>
                          <div className='flex items-start gap-3'>
                            <div className='flex-shrink-0'>
                              <div className='h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center'>
                                <FileText className='h-4 w-4 text-white' />
                              </div>
                            </div>
                            <div className='flex-1'>
                              <h4 className='font-semibold text-blue-900 mb-2'>
                                💡 Explicação da Resposta
                              </h4>
                              <p className='text-sm text-blue-800 leading-relaxed'>
                                {questao.explicacao}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </>
    );
  }

  return null;
};

export default AlunosSimuladosPage;
