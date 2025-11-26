import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  GraduationCap,
  Target,
  Award,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  Star,
  Play,
  User,
  Settings,
  BarChart3,
  BookMarked,
  Stethoscope,
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [realStats, setRealStats] = useState({
    hasRaioX: false,
    chancesPercentage: null,
    simuladosCount: 0,
    faculdadesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Etapas da jornada de transferência
  const transferSteps = [
    {
      id: 0,
      title: 'Canal de Dúvidas',
      description: 'Tire suas dúvidas antes de começar sua jornada',
      icon: <Lightbulb className='h-6 w-6' />,
      action: () =>
        window.open('https://chat.whatsapp.com/seu-link-aqui', '_blank'),
      actionText: 'Entrar no Canal',
      estimatedTime: '24/7',
      difficulty: 'Fácil',
      importance: 'Recomendado',
    },
    {
      id: 1,
      title: 'Raio-X Acadêmico',
      description: 'Faça um raio-x completo do seu perfil acadêmico',
      icon: <User className='h-6 w-6' />,
      action: () => navigate('/analise-perfil'),
      actionText: 'Iniciar Raio-X',
      estimatedTime: '15 min',
      difficulty: 'Fácil',
      importance: 'Alta',
    },
    {
      id: 2,
      title: 'Estudar com Simulados',
      description: 'Pratique com simulados personalizados',
      icon: <BookMarked className='h-6 w-6' />,
      action: () => navigate('/simulados-disponiveis'),
      actionText: 'Fazer Simulados',
      estimatedTime: '2-4h',
      difficulty: 'Médio',
      importance: 'Crítica',
    },
    {
      id: 3,
      title: 'Preparar Documentos',
      description: 'Organize toda documentação necessária',
      icon: <FileText className='h-6 w-6' />,
      action: () => navigate('/preparar-documentos'),
      actionText: 'Ver Checklist',
      estimatedTime: '1-2 semanas',
      difficulty: 'Médio',
      importance: 'Alta',
    },
    {
      id: 4,
      title: 'Acompanhar Editais',
      description: 'Monitore os editais das universidades',
      icon: <Calendar className='h-6 w-6' />,
      action: () => {},
      actionText: 'Ver Editais',
      estimatedTime: 'Contínuo',
      difficulty: 'Fácil',
      importance: 'Crítica',
    },
  ];

  // Buscar dados reais do Supabase
  useEffect(() => {
    const fetchRealData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar último Raio-X
        const { data: raioXData, error: raioXError } = await supabase
          .from('analyses')
          .select('id, compatibility_percentage, profile_data_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let hasRaioX = false;
        let chancesPercentage = null;
        let faculdadesCount = 0;

        if (!raioXError && raioXData) {
          hasRaioX = true;

          // Buscar faculdades recomendadas do banco de dados
          const profileData = raioXData.profile_data_json || {};

          // Calcular compatibilidade média baseada na mesma lógica do VerRaioXPage
          const isExterior =
            profileData.studentLocation === 'Exterior' ||
            profileData.aceita_estrangeiro === true;
          const maxCompatibilidade = isExterior ? 89 : 92;
          if (
            profileData.statesOfInterest &&
            profileData.statesOfInterest.length > 0
          ) {
            const siglas = profileData.statesOfInterest.map((state) => {
              const stateMap = {
                Acre: 'AC',
                Alagoas: 'AL',
                Amapá: 'AP',
                Amazonas: 'AM',
                Bahia: 'BA',
                Ceará: 'CE',
                'Distrito Federal': 'DF',
                'Espírito Santo': 'ES',
                Goiás: 'GO',
                Maranhão: 'MA',
                'Mato Grosso': 'MT',
                'Mato Grosso do Sul': 'MS',
                'Minas Gerais': 'MG',
                Pará: 'PA',
                Paraíba: 'PB',
                Paraná: 'PR',
                Pernambuco: 'PE',
                Piauí: 'PI',
                'Rio de Janeiro': 'RJ',
                'Rio Grande do Norte': 'RN',
                'Rio Grande do Sul': 'RS',
                Rondônia: 'RO',
                Roraima: 'RR',
                'Santa Catarina': 'SC',
                'São Paulo': 'SP',
                Sergipe: 'SE',
                Tocantins: 'TO',
              };
              return stateMap[state] || state;
            });

            let query = supabase
              .from('faculdades')
              .select('id', { count: 'exact', head: true });

            if (siglas.length > 0) {
              query = query.in('sigla', siglas);
            }

            if (
              profileData.institutionType &&
              profileData.institutionType !== 'Ambas'
            ) {
              query = query.eq('administracao', profileData.institutionType);
            }

            // Filtrar por método de seleção
            if (profileData.selectionMethod) {
              query = query.ilike(
                'processo',
                `%${profileData.selectionMethod}%`
              );
            }

            if (profileData.aceita_estrangeiro === true) {
              query = query.eq('aceita_estrangeiro', true);
            } else if (profileData.aceita_estrangeiro === false) {
              query = query.eq('aceita_estrangeiro', false);
            }

            if (profileData.aceita_fies === true) {
              query = query.eq('aceita_fies', true);
            }

            const { count } = await query;
            faculdadesCount = count || 0;

            // Calcular compatibilidade média usando a mesma fórmula do VerRaioXPage
            // Consideramos que as faculdades retornadas são as mais compatíveis
            // Pegamos a média entre a primeira (maxCompatibilidade) e a última faculdade
            if (faculdadesCount > 0) {
              const minCompatibilidade = 75;
              const primeiraFacCompatibilidade = maxCompatibilidade;
              const ultimaFacCompatibilidade = Math.max(
                minCompatibilidade,
                maxCompatibilidade - (faculdadesCount - 1) * 2
              );
              chancesPercentage = Math.round(
                (primeiraFacCompatibilidade + ultimaFacCompatibilidade) / 2
              );
            } else {
              // Se não há faculdades, usar compatibilidade média genérica
              chancesPercentage = Math.round((maxCompatibilidade + 75) / 2);
            }
          }
        }

        // Buscar simulados realizados
        const { count: simuladosCount, error: simuladosError } = await supabase
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        console.log('📊 Dashboard - Simulados encontrados:', simuladosCount);
        console.log('📊 Dashboard - Erro ao buscar simulados:', simuladosError);
        console.log('📊 Dashboard - User ID:', user.id);

        setRealStats({
          hasRaioX,
          chancesPercentage,
          simuladosCount: simuladosCount || 0,
          faculdadesCount,
        });

        // Atualizar progresso baseado nos dados reais
        const newCompletedSteps = [];
        if (hasRaioX) newCompletedSteps.push(1);
        if (simuladosCount > 0) newCompletedSteps.push(2);
        setCompletedSteps(newCompletedSteps);

        // Determinar o próximo passo
        if (!hasRaioX) {
          setCurrentStep(1);
        } else if (simuladosCount === 0) {
          setCurrentStep(2);
        } else {
          setCurrentStep(3);
        }
      } catch (error) {
        console.error('Erro ao buscar dados reais:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [user]);

  const updateProgress = (stepId) => {
    const newCompletedSteps = [...completedSteps];
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId);
      setCompletedSteps(newCompletedSteps);
    }

    const nextStep = stepId + 1;
    if (nextStep <= transferSteps.length && nextStep > currentStep) {
      setCurrentStep(nextStep);
    }

    localStorage.setItem(
      'dashboard_progress',
      JSON.stringify({
        currentStep: nextStep <= transferSteps.length ? nextStep : currentStep,
        completedSteps: newCompletedSteps,
      })
    );
  };

  const getProgressPercentage = () => {
    return (completedSteps.length / transferSteps.length) * 100;
  };

  const getStepStatus = (stepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800';
      case 'Médio':
        return 'bg-yellow-100 text-yellow-800';
      case 'Difícil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'Alta':
        return 'bg-blue-100 text-blue-800';
      case 'Crítica':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Dicas rápidas
  const quickTips = [
    {
      icon: <Lightbulb className='h-5 w-5 text-yellow-500' />,
      text: 'Mantenha suas notas sempre atualizadas no perfil',
      category: 'Perfil',
    },
    {
      icon: <Target className='h-5 w-5 text-blue-500' />,
      text: 'Foque nas universidades com maior compatibilidade',
      category: 'Estratégia',
    },
    {
      icon: <BookOpen className='h-5 w-5 text-green-500' />,
      text: 'Pratique simulados regularmente para melhorar',
      category: 'Estudos',
    },
    {
      icon: <Clock className='h-5 w-5 text-purple-500' />,
      text: 'Fique atento aos prazos dos editais',
      category: 'Prazos',
    },
  ];

  // Estatísticas rápidas baseadas em dados reais
  const quickStats = [
    realStats.hasRaioX && realStats.chancesPercentage !== null
      ? {
          icon: <TrendingUp className='h-8 w-8 text-green-600' />,
          value: `${realStats.chancesPercentage}%`,
          label: 'Chance Média',
          description: 'Baseado no seu perfil atual',
        }
      : null,
    {
      icon: <Award className='h-8 w-8 text-blue-600' />,
      value: realStats.simuladosCount,
      label: 'Simulados Feitos',
      description:
        realStats.simuladosCount > 0
          ? 'Continue praticando!'
          : 'Comece a praticar',
    },
    realStats.hasRaioX && realStats.faculdadesCount > 0
      ? {
          icon: <GraduationCap className='h-8 w-8 text-purple-600' />,
          value: realStats.faculdadesCount,
          label: 'Universidades',
          description: 'Recomendadas para você',
        }
      : null,
    {
      icon: <CheckCircle2 className='h-8 w-8 text-cyan-600' />,
      value: `${completedSteps.length}/${transferSteps.length}`,
      label: 'Etapas Concluídas',
      description: 'Do seu plano de transferência',
    },
  ].filter(Boolean);

  return (
    <>
      <Helmet>
        <title>Comece por Aqui - Dashboard | AmigoMeD!</title>
        <meta
          name='description'
          content='Seu painel de controle para transferência médica. Acompanhe seu progresso e siga as etapas rumo à sua transferência.'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Header Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-8'
          >
            <div className='bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl p-8 shadow-2xl'>
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='text-3xl md:text-4xl font-bold mb-2'>
                    Bem-vindo ao AmigoMeD! 👋
                  </h1>
                  <p className='text-cyan-100 text-lg'>
                    Sua jornada rumo à transferência médica começa aqui. Siga as
                    etapas abaixo para maximizar suas chances.
                  </p>
                </div>
                <Stethoscope className='h-16 w-16 text-cyan-200 hidden md:block' />
              </div>

              {/* Barra de progresso geral */}
              <div className='mt-6'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-cyan-200'>Progresso Geral</span>
                  <span className='text-sm text-cyan-200 font-semibold'>
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <Progress
                  value={getProgressPercentage()}
                  className='h-3 bg-cyan-800/50'
                />
              </div>
            </div>
          </motion.div>

          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Coluna Principal - Etapas */}
            <div className='lg:col-span-2'>
              {/* Roadmap de Etapas */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='mb-8'
              >
                <Card className='shadow-xl bg-white/70 backdrop-blur-sm'>
                  <CardHeader>
                    <CardTitle className='text-2xl flex items-center'>
                      <Target className='h-6 w-6 mr-3 text-blue-600' />
                      Seu Plano de Transferência
                    </CardTitle>
                    <CardDescription>
                      Siga estas etapas em ordem para maximizar suas chances de
                      sucesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-6'>
                      {transferSteps.map((step, index) => {
                        const status = getStepStatus(step.id);
                        const isCompleted = status === 'completed';
                        const isCurrent = status === 'current';

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className={`relative ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                : isCurrent
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            } border rounded-2xl p-6 transition-all hover:shadow-md`}
                          >
                            {/* Número da etapa */}
                            <div className='flex items-start space-x-4'>
                              <div
                                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isCurrent
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-300 text-gray-600'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className='h-6 w-6' />
                                ) : (
                                  step.icon
                                )}
                              </div>

                              <div className='flex-1'>
                                <div className='flex items-center justify-between mb-2'>
                                  <h3
                                    className={`text-xl font-bold ${
                                      isCompleted
                                        ? 'text-green-800'
                                        : isCurrent
                                        ? 'text-blue-800'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    {step.title}
                                  </h3>
                                  <div className='flex space-x-2'>
                                    <Badge
                                      className={getDifficultyColor(
                                        step.difficulty
                                      )}
                                    >
                                      {step.difficulty}
                                    </Badge>
                                    <Badge
                                      className={getImportanceColor(
                                        step.importance
                                      )}
                                    >
                                      {step.importance}
                                    </Badge>
                                  </div>
                                </div>

                                <p className='text-gray-600 mb-3'>
                                  {step.description}
                                </p>

                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center space-x-4 text-sm text-gray-500'>
                                    <span className='flex items-center'>
                                      <Clock className='h-4 w-4 mr-1' />
                                      {step.estimatedTime}
                                    </span>
                                  </div>

                                  {!isCompleted && isCurrent && (
                                    <div className='flex gap-2'>
                                      <Button
                                        onClick={() => {
                                          step.action();
                                        }}
                                        className='bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
                                      >
                                        {step.actionText}
                                        <ArrowRight className='h-4 w-4 ml-2' />
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          updateProgress(step.id);
                                        }}
                                        variant='outline'
                                        className='border-gray-300 text-gray-600 hover:bg-gray-100'
                                      >
                                        Pular
                                      </Button>
                                    </div>
                                  )}

                                  {!isCompleted && !isCurrent && (
                                    <Button
                                      className='bg-gray-400 hover:bg-gray-500 text-white'
                                      disabled={true}
                                    >
                                      {step.actionText}
                                      <ArrowRight className='h-4 w-4 ml-2' />
                                    </Button>
                                  )}

                                  {isCompleted && (
                                    <Badge className='bg-green-100 text-green-800'>
                                      ✓ Concluído
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Linha conectora */}
                            {index < transferSteps.length - 1 && (
                              <div className='absolute left-8 top-20 w-px h-6 bg-gray-300'></div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Dicas Rápidas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center'>
                      <Lightbulb className='h-5 w-5 mr-2 text-yellow-500' />
                      Dicas Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid md:grid-cols-2 gap-4'>
                      {quickTips.map((tip, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className='flex items-start space-x-3 p-3 bg-gray-50 rounded-lg'
                        >
                          {tip.icon}
                          <div>
                            <p className='text-sm text-gray-700'>{tip.text}</p>
                            <Badge variant='outline' className='text-xs mt-1'>
                              {tip.category}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar - Estatísticas e Links Rápidos */}
            <div className='space-y-6'>
              {/* Estatísticas Rápidas */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='text-lg'>Resumo Rápido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {quickStats.map((stat, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className='flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg'
                        >
                          {stat.icon}
                          <div>
                            <div className='text-2xl font-bold text-gray-800'>
                              {stat.value}
                            </div>
                            <div className='text-sm font-medium text-gray-600'>
                              {stat.label}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {stat.description}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Motivação */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className='shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white'>
                  <CardContent className='p-6'>
                    <div className='text-center'>
                      <Award className='h-12 w-12 mx-auto mb-4 text-yellow-300' />
                      <h3 className='text-xl font-bold mb-2'>
                        Continue Firme!
                      </h3>
                      <p className='text-purple-100 text-sm mb-4'>
                        Cada etapa completada te aproxima do seu sonho de
                        transferência.
                      </p>
                      <div className='text-2xl font-bold text-yellow-300'>
                        🎯 Meta: 100%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
