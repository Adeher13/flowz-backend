import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileCheck2,
  Zap,
  UserCheck,
  Star,
  School,
  MapPin,
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Award,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RecommendedUniversitiesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const state = location.state || {};
  const analysisResult = state.analysisResult || {
    overallCompatibility: 0,
    projectedPeriod: '-',
    improvementPoints: [],
    recommendations: '',
    riskLevel: 'Indefinido',
  };
  const profileData = state.profileData || {};
  let recommendedUniversities = state.recommendedUniversities || [];
  // Filtro: brasileiros veem todas, estrangeiros só as que aceitam estrangeiros
  if (profileData && typeof profileData.origem === 'string') {
    const origem = profileData.origem.trim().toLowerCase();
    if (
      origem !== 'brasil' &&
      origem !== 'brasileiro' &&
      origem !== 'brasileira'
    ) {
      recommendedUniversities = recommendedUniversities.filter(
        (uni) => uni.aceita_estrangeiro === true || uni.estrangeiro === true
      );
    }
    // Se for Brasil, não filtra nada
  }
  const diagnosticAttempts = state.diagnosticAttempts || null;

  const [retryLoading, setRetryLoading] = useState(false);

  if (!analysisResult || recommendedUniversities.length === 0) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center max-w-md mx-auto p-8'
        >
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            <GraduationCap className='h-16 w-16 mx-auto mb-6 text-gray-400' />
            <h1 className='text-2xl font-bold mb-4 text-gray-800'>
              Dados do Raio-X Não Encontrados
            </h1>
            <p className='text-gray-600 mb-8'>
              Para visualizar as recomendações, por favor, preencha o formulário
              de raio-x acadêmico primeiro.
            </p>
            <Button
              onClick={() => navigate('/analise-perfil')}
              className='bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
            >
              <ArrowLeft className='mr-2 h-4 w-4' /> Voltar para o Raio-X
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'baixo':
        return 'text-emerald-400';
      case 'médio':
        return 'text-amber-400';
      case 'alto':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getCompatibilityColor = (percentage) => {
    if (percentage >= 80) return 'from-emerald-500 to-green-600';
    if (percentage >= 60) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50'>
      <Helmet>
        <title>Relatório de Raio-X Acadêmico e Universidades - AmigoMeD!</title>
        <meta
          name='description'
          content='Confira seu relatório de raio-x acadêmico e a lista de universidades recomendadas.'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header com botão voltar */}
          <div className='mb-8'>
            <Button
              variant='outline'
              onClick={() => navigate('/analise-perfil')}
              className='mb-6 bg-white/70 backdrop-blur-sm border-cyan-200 hover:bg-cyan-50'
            >
              <ArrowLeft className='mr-2 h-4 w-4' /> Voltar e Refazer Raio-X
            </Button>
          </div>

          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Coluna do Relatório - Melhorada */}
            <div className='lg:col-span-1'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='sticky top-8'
              >
                <div className='bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 text-white rounded-3xl shadow-2xl p-8 border border-white/20'>
                  {/* Header do relatório */}
                  <div className='text-center mb-8'>
                    <div className='relative'>
                      <div className='absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-lg opacity-30'></div>
                      <FileCheck2 className='relative h-16 w-16 mx-auto mb-4 text-cyan-200' />
                    </div>
                    <h2 className='text-3xl font-bold mb-2'>
                      Seu Relatório de Raio-X Acadêmico
                    </h2>
                    <p className='text-cyan-200 text-sm'>
                      Gerado por nossa equipe especializada em{' '}
                      {new Date().toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Métricas principais - Melhoradas */}
                  <div className='grid grid-cols-2 gap-6 mb-8'>
                    <div className='text-center bg-white/10 rounded-2xl p-6 backdrop-blur-sm'>
                      <Target className='h-8 w-8 mx-auto mb-3 text-cyan-300' />
                      <p className='text-sm text-cyan-100 mb-2'>
                        Compatibilidade
                      </p>
                      <div className='relative'>
                        <div
                          className={`text-4xl font-bold bg-gradient-to-r ${getCompatibilityColor(
                            analysisResult.overallCompatibility
                          )} bg-clip-text text-transparent`}
                        >
                          {analysisResult.overallCompatibility}%
                        </div>
                        <div className='w-full bg-cyan-800/50 rounded-full h-2 mt-3'>
                          <div
                            className={`bg-gradient-to-r ${getCompatibilityColor(
                              analysisResult.overallCompatibility
                            )} h-2 rounded-full transition-all duration-1000 ease-out`}
                            style={{
                              width: `${analysisResult.overallCompatibility}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className='text-center bg-white/10 rounded-2xl p-6 backdrop-blur-sm'>
                      <Clock className='h-8 w-8 mx-auto mb-3 text-cyan-300' />
                      <p className='text-sm text-cyan-100 mb-2'>
                        Período Projetado
                      </p>
                      <p className='text-3xl font-bold text-cyan-200 mb-2'>
                        {analysisResult.projectedPeriod}
                      </p>
                      <p
                        className={`text-sm font-semibold ${getRiskColor(
                          analysisResult.riskLevel
                        )}`}
                      >
                        Risco: {analysisResult.riskLevel}
                      </p>
                    </div>
                  </div>

                  {/* Pontos de Melhoria - Melhorados */}
                  <div className='mb-8'>
                    <div className='flex items-center mb-6'>
                      <UserCheck className='mr-3 h-6 w-6 text-cyan-300' />
                      <h3 className='text-xl font-bold'>Pontos de Melhoria</h3>
                    </div>
                    <div className='space-y-3'>
                      {analysisResult.improvementPoints
                        ?.slice(0, 3)
                        .map((point, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className='bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 rounded-xl flex items-start border border-cyan-700/30'
                          >
                            <Star className='h-5 w-5 text-amber-400 mr-3 mt-1 flex-shrink-0' />
                            <span className='text-sm text-cyan-100'>
                              {point}
                            </span>
                          </motion.div>
                        ))}
                      {analysisResult.improvementPoints?.length === 0 && (
                        <div className='text-center text-cyan-300 italic'>
                          Parabéns! Seu perfil está muito bem estruturado.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recomendações da IA - Melhoradas */}
                  <div className='mb-8'>
                    <div className='flex items-center mb-4'>
                      <Zap className='mr-3 h-6 w-6 text-cyan-300' />
                      <h3 className='text-xl font-bold'>
                        Recomendações da Nossa Equipe
                      </h3>
                    </div>
                    <div className='bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-6 rounded-xl border border-cyan-700/30'>
                      <p className='text-cyan-100 italic text-sm leading-relaxed'>
                        {analysisResult.recommendations ||
                          'Continue focado nos seus estudos e mantenha o bom trabalho!'}
                      </p>
                    </div>
                  </div>

                  {/* Call to action - Melhorado */}
                  <div className='text-center bg-gradient-to-r from-black/20 to-black/30 p-6 rounded-2xl border border-white/10'>
                    <Award className='h-12 w-12 mx-auto mb-4 text-amber-400' />
                    <h4 className='text-xl font-bold mb-2'>
                      Quer um plano detalhado?
                    </h4>
                    <p className='text-cyan-200 text-sm mb-4 leading-relaxed'>
                      Nossa assessoria completa cria um roadmap personalizado
                      para sua aprovação.
                    </p>
                    <Button
                      size='lg'
                      className='bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shadow-lg transform transition hover:scale-105'
                      onClick={() =>
                        toast({
                          title: '🚧 Em breve!',
                          description:
                            'O serviço de assessoria completa será lançado em breve.',
                        })
                      }
                    >
                      <TrendingUp className='mr-2 h-5 w-5' />
                      Contratar Assessoria
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Coluna das Universidades - Melhorada */}
            <div className='lg:col-span-2'>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className='shadow-2xl bg-white/70 backdrop-blur-sm border-0'>
                  <CardHeader className='bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-t-lg'>
                    <CardTitle className='text-3xl font-bold flex items-center text-gray-800'>
                      <School className='mr-4 h-8 w-8 text-cyan-600' />
                      Universidades Recomendadas
                      <div className='ml-auto flex items-center gap-2'>
                        <div className='bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-2.5 rounded-full text-lg font-bold shadow-lg'>
                          {recommendedUniversities.length}
                        </div>
                        <span className='text-sm text-gray-600 font-normal'>
                          {recommendedUniversities.length === 1
                            ? 'universidade'
                            : 'universidades'}
                        </span>
                      </div>
                    </CardTitle>
                    <CardDescription className='text-gray-600 text-base'>
                      Baseado nos seus critérios, encontramos{' '}
                      <span className='font-semibold text-cyan-600'>
                        {recommendedUniversities.length}{' '}
                        {recommendedUniversities.length === 1
                          ? 'oportunidade perfeita'
                          : 'oportunidades perfeitas'}
                      </span>{' '}
                      para você.
                      {diagnosticAttempts && (
                        <div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                          <div className='text-sm text-blue-800 font-medium mb-2'>
                            📊 Diagnóstico do filtro:
                          </div>
                          <ul className='list-disc ml-5 text-sm text-blue-700'>
                            {diagnosticAttempts.map((a, i) => (
                              <li key={i}>
                                {a.step}:{' '}
                                <span className='font-semibold'>
                                  {a.count} resultado(s)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='p-6'>
                    <div className='space-y-6'>
                      {recommendedUniversities.map((uni, index) => (
                        <motion.div
                          key={uni.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className='group border border-gray-200 bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-cyan-500 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50'
                        >
                          <div className='flex justify-between items-start mb-4'>
                            <div className='flex-1'>
                              <h3 className='text-xl font-bold text-gray-800 group-hover:text-cyan-700 transition-colors'>
                                {uni.name || uni.nome || '—'}
                              </h3>
                              <div className='flex items-center mt-2 text-gray-500'>
                                <MapPin className='h-4 w-4 mr-2 text-cyan-500' />
                                <span className='text-sm'>
                                  {uni.cidade || uni.city || ''},{' '}
                                  {uni.state || uni.estado || ''}
                                  {uni.regiao && ` (${uni.regiao})`}
                                </span>
                              </div>
                            </div>
                            <div className='ml-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                              <div className='w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full'></div>
                            </div>
                          </div>

                          <div className='flex flex-wrap gap-2'>
                            <Badge
                              variant={
                                uni.type === 'Pública' ||
                                uni.administracao === 'Pública'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className={`${
                                uni.type === 'Pública' ||
                                uni.administracao === 'Pública'
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                                  : 'bg-gradient-to-r from-slate-500 to-gray-600 text-white'
                              } px-3 py-1 font-semibold`}
                            >
                              {uni.type || uni.administracao || 'Não informado'}
                            </Badge>

                            <Badge
                              variant='outline'
                              className='border-cyan-300 text-cyan-700 bg-cyan-50'
                            >
                              📋{' '}
                              {uni.entrance_method ||
                                uni.processo ||
                                'Método não informado'}
                            </Badge>

                            {(uni.aceita_fies || uni.fies) && (
                              <Badge className='bg-gradient-to-r from-green-500 to-emerald-600 text-white'>
                                💰 Aceita FIES
                              </Badge>
                            )}

                            {(uni.aceita_estrangeiro || uni.estrangeiro) && (
                              <Badge className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white'>
                                🌍 Aceita Estrangeiros
                              </Badge>
                            )}

                            {(uni.obtem_novo_titulo || uni.novo_titulo) && (
                              <Badge className='bg-gradient-to-r from-purple-500 to-violet-600 text-white'>
                                🎓 Novo Título
                              </Badge>
                            )}
                          </div>

                          {/* Informações adicionais */}
                          {uni.mensalidade && (
                            <div className='mt-3 text-sm text-gray-600'>
                              💵 Mensalidade:{' '}
                              <span className='font-semibold'>
                                {uni.mensalidade}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {recommendedUniversities.length === 0 && (
                        <div className='text-center py-16 px-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200'>
                          <School className='h-16 w-16 mx-auto mb-4 text-gray-400' />
                          <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                            Nenhuma universidade encontrada
                          </h3>
                          <p className='text-gray-500 leading-relaxed'>
                            Não encontramos universidades que correspondam a
                            100% dos seus critérios. Tente ampliar sua busca ou
                            ajustar os filtros na página de raio-x acadêmico.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RecommendedUniversitiesPage;
