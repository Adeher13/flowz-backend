import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  User,
  Calendar,
  Trophy,
  Target,
  Eye,
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  Trash2,
  FileText,
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AdminSimuladosAlunosPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [simulados, setSimulados] = useState([]);
  const [selectedSimulado, setSelectedSimulado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscar todos os usuários que fizeram simulados
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('user_id, simulado_nome, nota_final, finished_at')
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false });

      if (error) throw error;

      // Agrupar por usuário
      const usersMap = {};
      data.forEach((attempt) => {
        if (!usersMap[attempt.user_id]) {
          usersMap[attempt.user_id] = {
            id: attempt.user_id,
            nome: null,
            email: null,
            totalSimulados: 0,
            mediaNotas: 0,
            ultimoSimulado: attempt.finished_at,
          };
        }
        usersMap[attempt.user_id].totalSimulados++;
      });

      // Calcular média de notas
      for (const userId in usersMap) {
        const userAttempts = data.filter((a) => a.user_id === userId);
        const somaNotas = userAttempts.reduce(
          (sum, a) => sum + (a.nota_final || 0),
          0
        );
        usersMap[userId].mediaNotas =
          Math.round((somaNotas / userAttempts.length) * 10) / 10;
      }

      // Buscar dados dos usuários do auth
      const userIds = Object.keys(usersMap);

      // Buscar do perfil se existir, senão usar analyses
      for (const userId of userIds) {
        // Tentar buscar da tabela analyses
        const { data: analysisData } = await supabase
          .from('analyses')
          .select('student_name, profile_data_json')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analysisData) {
          usersMap[userId].nome =
            analysisData.student_name ||
            analysisData.profile_data_json?.fullName ||
            'Aluno';
        } else {
          usersMap[userId].nome = 'Aluno';
        }
      }

      const usersList = Object.values(usersMap);

      setUsers(usersList);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os usuários.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSimulados = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false });

      if (error) throw error;

      setSimulados(data || []);
    } catch (error) {
      console.error('Erro ao buscar simulados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar simulados',
        description: 'Não foi possível carregar os simulados do aluno.',
      });
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserSimulados(user.id);
  };

  const handleDeleteSimulado = async (simuladoId, e) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja excluir este simulado?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('id', simuladoId);

      if (error) throw error;

      // Atualizar lista local
      setSimulados(simulados.filter((sim) => sim.id !== simuladoId));

      toast({
        title: 'Simulado excluído',
        description: 'O simulado foi removido com sucesso.',
      });

      // Atualizar estatísticas do usuário
      if (selectedUser) {
        fetchUserSimulados(selectedUser.id);
      }
    } catch (error) {
      console.error('Erro ao excluir simulado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o simulado.',
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando dados...</p>
        </div>
      </div>
    );
  }

  // View: Detalhes do Simulado com Questões
  if (selectedSimulado) {
    const questoesDetalhadas = selectedSimulado.questoes_detalhadas || [];

    return (
      <>
        <Helmet>
          <title>Detalhes do Simulado - Admin</title>
        </Helmet>

        <div className='p-6 max-w-7xl mx-auto'>
          <Button
            variant='ghost'
            onClick={() => setSelectedSimulado(null)}
            className='mb-6'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Voltar para Histórico
          </Button>

          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {selectedSimulado.simulado_nome}
            </h1>
            <div className='flex items-center gap-4 text-gray-600'>
              <span className='flex items-center gap-1'>
                <User className='h-4 w-4' />
                {selectedUser?.nome || 'Aluno'}
              </span>
              <span className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                {new Date(selectedSimulado.finished_at).toLocaleDateString(
                  'pt-BR',
                  {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )}
              </span>
              <Badge
                className={`${
                  selectedSimulado.nota_final >= 70
                    ? 'bg-green-500'
                    : selectedSimulado.nota_final >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              >
                {selectedSimulado.nota_final?.toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Questões com Respostas */}
          {questoesDetalhadas && questoesDetalhadas.length > 0 ? (
            <div className='space-y-6'>
              {questoesDetalhadas.map((questao, index) => (
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
                              <p className='text-sm text-gray-800'>{opcao}</p>
                              {isRespostaCorreta && (
                                <p className='text-xs text-green-700 font-medium mt-1'>
                                  ✓ Resposta Correta
                                </p>
                              )}
                              {isRespostaUsuario && !questao.acertou && (
                                <p className='text-xs text-red-700 font-medium mt-1'>
                                  ✗ Resposta do Aluno
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explicação */}
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
            </div>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <FileText className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-500'>
                  Este simulado não possui questões detalhadas salvas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  }

  if (selectedUser) {
    return (
      <>
        <Helmet>
          <title>Simulados do Aluno - Admin</title>
        </Helmet>

        <div className='p-6 max-w-7xl mx-auto'>
          <Button
            variant='ghost'
            onClick={() => setSelectedUser(null)}
            className='mb-6'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Voltar para Lista de Alunos
          </Button>

          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <User className='h-8 w-8 text-cyan-600' />
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {selectedUser.nome || 'Aluno'}
                </h1>
                <p className='text-sm text-gray-500'>ID: {selectedUser.id}</p>
              </div>
            </div>
          </div>

          {/* Estatísticas do Aluno */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3'>
                  <BookOpen className='h-10 w-10 text-cyan-600' />
                  <div>
                    <p className='text-sm text-gray-500'>Total de Simulados</p>
                    <p className='text-2xl font-bold'>
                      {selectedUser.totalSimulados}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3'>
                  <Trophy className='h-10 w-10 text-yellow-600' />
                  <div>
                    <p className='text-sm text-gray-500'>Média Geral</p>
                    <p className='text-2xl font-bold text-cyan-600'>
                      {selectedUser.mediaNotas}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3'>
                  <Calendar className='h-10 w-10 text-purple-600' />
                  <div>
                    <p className='text-sm text-gray-500'>Último Simulado</p>
                    <p className='text-sm font-medium'>
                      {new Date(selectedUser.ultimoSimulado).toLocaleDateString(
                        'pt-BR'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Simulados */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Simulados</CardTitle>
              <CardDescription>
                Todos os simulados realizados pelo aluno
              </CardDescription>
            </CardHeader>
            <CardContent>
              {simulados.length === 0 ? (
                <div className='text-center py-12'>
                  <BookOpen className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>Nenhum simulado encontrado</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {simulados.map((sim) => (
                    <motion.div
                      key={sim.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {sim.simulado_nome}
                          </h3>
                          <p className='text-sm text-gray-500 flex items-center gap-2 mt-1'>
                            <Calendar className='h-4 w-4' />
                            {new Date(sim.finished_at).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                        <Badge
                          className={`text-lg px-4 py-2 ${
                            sim.nota_final >= 70
                              ? 'bg-green-500'
                              : sim.nota_final >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {sim.nota_final?.toFixed(1)}%
                        </Badge>
                      </div>

                      <div className='grid grid-cols-3 gap-4 mb-3'>
                        <div className='text-center bg-green-50 rounded-lg p-3'>
                          <CheckCircle className='h-5 w-5 text-green-600 mx-auto mb-1' />
                          <p className='text-xs text-gray-600'>Acertos</p>
                          <p className='text-lg font-bold text-green-600'>
                            {sim.questoes_certas}
                          </p>
                        </div>
                        <div className='text-center bg-red-50 rounded-lg p-3'>
                          <XCircle className='h-5 w-5 text-red-600 mx-auto mb-1' />
                          <p className='text-xs text-gray-600'>Erros</p>
                          <p className='text-lg font-bold text-red-600'>
                            {sim.total_questoes - sim.questoes_certas}
                          </p>
                        </div>
                        <div className='text-center bg-cyan-50 rounded-lg p-3'>
                          <Target className='h-5 w-5 text-cyan-600 mx-auto mb-1' />
                          <p className='text-xs text-gray-600'>Total</p>
                          <p className='text-lg font-bold text-cyan-600'>
                            {sim.total_questoes}
                          </p>
                        </div>
                      </div>

                      {/* Desempenho por Disciplina */}
                      {sim.disciplinas_desempenho && (
                        <div className='mt-4 pt-4 border-t'>
                          <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                            <BarChart3 className='h-4 w-4' />
                            Desempenho por Disciplina
                          </h4>
                          <div className='space-y-2'>
                            {Object.entries(sim.disciplinas_desempenho).map(
                              ([disciplina, dados]) => {
                                const porcentagem =
                                  (dados.acertos / dados.total) * 100;
                                return (
                                  <div key={disciplina}>
                                    <div className='flex justify-between text-sm mb-1'>
                                      <span className='font-medium'>
                                        {disciplina}
                                      </span>
                                      <span className='text-gray-600'>
                                        {dados.acertos}/{dados.total} (
                                        {porcentagem.toFixed(0)}%)
                                      </span>
                                    </div>
                                    <Progress value={porcentagem} />
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botões de Ação */}
                      <div className='mt-4 pt-4 border-t flex justify-between gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300'
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSimulado(sim);
                          }}
                        >
                          <FileText className='mr-2 h-4 w-4' />
                          Ver Questões
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                          onClick={(e) => handleDeleteSimulado(sim.id, e)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Excluir
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Simulados por Aluno - Admin</title>
      </Helmet>

      <div className='p-6 max-w-7xl mx-auto'>
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <BookOpen className='h-8 w-8 text-cyan-600' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Simulados por Aluno
            </h1>
          </div>
          <p className='text-gray-600'>
            Visualize o desempenho dos alunos nos simulados realizados
          </p>
        </div>

        {/* Busca */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Buscar por nome ou ID do aluno...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <div className='grid gap-4'>
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <User className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-500'>Nenhum aluno encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className='hover:shadow-lg transition-shadow cursor-pointer'>
                  <CardContent
                    className='p-6'
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div className='h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center'>
                          <User className='h-6 w-6 text-cyan-600' />
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900 text-lg'>
                            {user.nome || 'Aluno'}
                          </p>
                          <p className='text-xs text-gray-400'>
                            ID: {user.id.substring(0, 8)}...
                          </p>
                          <p className='text-sm text-gray-500 mt-1'>
                            {user.totalSimulados} simulados realizados
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-6'>
                        <div className='text-right'>
                          <p className='text-sm text-gray-500'>Média Geral</p>
                          <p className='text-2xl font-bold text-cyan-600'>
                            {user.mediaNotas}%
                          </p>
                        </div>
                        <Button variant='outline'>
                          <Eye className='mr-2 h-4 w-4' />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSimuladosAlunosPage;
