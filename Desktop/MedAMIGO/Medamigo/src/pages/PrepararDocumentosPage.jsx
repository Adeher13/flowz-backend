import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Circle,
  Globe,
  MapPin,
  Info,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const PrepararDocumentosPage = () => {
  const { user } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(false);

  // Carregar dados salvos ao montar o componente
  useEffect(() => {
    const loadSavedData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('document_checklists')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar checklist:', error);
          return;
        }

        if (data) {
          setSelectedLocation(data.location);
          setCheckedItems(data.checked_items || {});
          setShowLocationDialog(false);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };

    loadSavedData();
  }, [user]);

  // Salvar dados automaticamente quando houver alterações
  useEffect(() => {
    const saveData = async () => {
      if (!user?.id || !selectedLocation) return;

      try {
        const { error } = await supabase.from('document_checklists').upsert(
          {
            user_id: user.id,
            location: selectedLocation,
            checked_items: checkedItems,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.error('Erro ao salvar checklist:', error);
        }
      } catch (err) {
        console.error('Erro ao salvar dados:', err);
      }
    };

    // Debounce para não salvar a cada clique
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [checkedItems, selectedLocation, user]);

  const documentosExterior = [
    {
      id: 1,
      titulo: 'Histórico da IES (Instituição de Ensino Superior)',
      descricao:
        'É um documento que consta o ano de ingresso do candidato, carga horária por disciplina/unidade de aprendizagem, semestre, ano, notas ou conceitos de aprovação, cronologia integral da vinculação do acadêmico à Instituição de origem até o último período concluído. Normalmente vem com o nome de CERTIFICADO DE ESTUDOS ou HISTORIAL ACADEMICO.',
    },
    {
      id: 2,
      titulo: 'Plano de ensino ou Programas das disciplinas ou Ementas',
      descricao:
        'É o documento detalhado de cada disciplina e o que ela abrange (conteúdo, carga horária, bibliografia). Normalmente vem com o nome de PROGRAMA ANALÍTICO ou PROGRAMA DE ESTUDOS.',
    },
    {
      id: 3,
      titulo: 'Declaração de vínculo',
      descricao:
        'É o documento que comprova que o aluno tem um vínculo ativo com a faculdade. Pode ser comprovante de matrícula ou comprovante de trancamento. Normalmente vem com o nome de CONSTANCIA OU CERTIFICADO DE ALUNO REGULAR ou CONSTANCIA DE MATRICULA ou CONSTANCIA DE ESTUDO.',
    },
    {
      id: 4,
      titulo: 'Ato de reconhecimento ou autorização do curso de origem',
      descricao:
        'Documento que regulamenta, autoriza e reconhece a oferta do curso e a faculdade pelo órgão equivalente. Normalmente vem a data da fundação da faculdade, data de início do curso... Normalmente vem com o nome de Constancia Lei de Criação ou Resolucion Ministerial, Constancia de legalidad, habilitación o acreditación de la carrera y universidad.',
    },
    {
      id: 5,
      titulo: 'Critérios de avaliação do curso',
      descricao:
        'Declaração informando como a faculdade avalia o aluno, se é por conceito A, B, C, D...Por nota 1, 2, 3....Qual o mínimo para aprovação. É um demonstrativo do formato que é realizado a aprovação do aluno, especificando como é feito o cálculo e constando a escala de equivalência e/ou conversão das notas. Normalmente vem com o nome de CONSTANCIA DE SISTEMA DE AVALIAÇÃO ou METODOLOGIA DE EVALUACION ou ESCALA DE QUALIFICAÇÕES.',
    },
    {
      id: 6,
      titulo: 'Grade/Matriz Curricular',
      descricao:
        'Normal chamado de Malha Curricular. É um documento que apresenta o curso de Medicina, informando o que contém todos os períodos/anos. Vem o nome de todas as matérias e carga horária que o aluno irá cursar do início ao fim do curso.',
    },
  ];

  const documentosBrasil = [
    {
      id: 1,
      titulo: 'Histórico da IES (Instituição de Ensino Superior)',
      descricao:
        'É um documento que consta o ano de ingresso do candidato, carga horária por disciplina/unidade de aprendizagem, semestre, ano, notas ou conceitos de aprovação, cronologia integral da vinculação do acadêmico à Instituição de origem até o último período concluído.',
    },
    {
      id: 2,
      titulo: 'Plano de ensino ou Programas das disciplinas ou Ementas',
      descricao:
        'É o documento detalhado de cada disciplina e o que ela abrange (conteúdo, carga horária, bibliografia).',
    },
    {
      id: 3,
      titulo: 'Declaração de vínculo',
      descricao:
        'É o documento que comprova que o aluno tem um vínculo ativo com a faculdade. Pode ser comprovante de matrícula ou comprovante de trancamento.',
    },
    {
      id: 4,
      titulo: 'Ato de reconhecimento ou autorização do curso de origem',
      descricao:
        'Documento que regulamenta, autoriza e reconhece a oferta do curso e a faculdade pelo órgão equivalente. Normalmente vem a data da fundação da faculdade, data de início do curso…',
    },
    {
      id: 5,
      titulo: 'Critérios de avaliação do curso',
      descricao:
        'Declaração informando como a faculdade avalia o aluno, se é por conceito A, B, C, D...Por nota 1, 2, 3....Qual o mínimo para aprovação. É um demonstrativo do formato que é realizado a aprovação do aluno, especificando como é feito o cálculo e constando a escala de equivalência e/ou conversão das notas.',
    },
    {
      id: 6,
      titulo: 'Grade/Matriz Curricular',
      descricao:
        'Normal chamado de Malha Curricular. É um documento que apresenta o curso de Medicina, informando o que contém todos os períodos/anos. Vem o nome de todas as matérias e carga horária que o aluno irá cursar do início ao fim do curso.',
    },
    {
      id: 7,
      titulo: 'ENADE',
      descricao:
        'Exame Nacional de Desempenho dos Estudantes. É uma avaliação aplicada pelo MEC aos estudantes concluintes dos cursos de graduação. O documento comprova a participação ou dispensa do aluno no ENADE, sendo obrigatório para a colação de grau. Algumas instituições podem solicitar o comprovante de participação ou dispensa como parte da documentação de transferência.',
    },
  ];

  const documentos =
    selectedLocation === 'exterior' ? documentosExterior : documentosBrasil;

  const handleSelectLocation = async (location) => {
    setSelectedLocation(location);
    setShowLocationDialog(false);
    setCheckedItems({}); // Resetar checklist ao mudar localização

    // Salvar nova localização
    if (user?.id) {
      try {
        await supabase.from('document_checklists').upsert(
          {
            user_id: user.id,
            location: location,
            checked_items: {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.error('Erro ao salvar localização:', err);
      }
    }
  };

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const progress = Object.keys(checkedItems).filter(
    (key) => checkedItems[key]
  ).length;
  const total = documentos.length;
  const percentage = Math.round((progress / total) * 100);

  return (
    <>
      <Helmet>
        <title>Preparar Documentos - AmigoMeD!</title>
        <meta
          name='description'
          content='Checklist completo de documentos necessários para transferência de curso.'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-8'
          >
            <div className='bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl p-8 shadow-2xl'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <h1 className='text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3'>
                    <FileText className='h-10 w-10' />
                    Preparar Documentos
                  </h1>
                  <p className='text-cyan-100 text-lg'>
                    Organize toda documentação necessária para sua transferência
                  </p>
                </div>
                {selectedLocation && (
                  <Button
                    onClick={() => setShowLocationDialog(true)}
                    variant='outline'
                    className='bg-white/20 border-white/30 text-white hover:bg-white/30'
                  >
                    {selectedLocation === 'exterior' ? (
                      <>
                        <Globe className='mr-2 h-4 w-4' />
                        Exterior
                      </>
                    ) : (
                      <>
                        <MapPin className='mr-2 h-4 w-4' />
                        Brasil
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {selectedLocation && (
                <div className='mt-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-cyan-200'>
                      Progresso dos Documentos
                    </span>
                    <span className='text-sm text-cyan-200 font-semibold'>
                      {progress}/{total} ({percentage}%)
                    </span>
                  </div>
                  <div className='h-3 bg-cyan-800/50 rounded-full overflow-hidden'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className='h-full bg-gradient-to-r from-green-400 to-emerald-500'
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Checklist */}
          {selectedLocation && (
            <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
              {/* Coluna Principal - Checklist */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={
                  selectedLocation === 'exterior'
                    ? 'lg:col-span-3'
                    : 'lg:col-span-5'
                }
              >
                <Card className='shadow-xl bg-white/90 backdrop-blur-sm'>
                  <CardHeader>
                    <CardTitle className='text-2xl flex items-center gap-2'>
                      <FileText className='h-6 w-6 text-cyan-600' />
                      Documentos Necessários
                      <Badge className='ml-auto bg-cyan-500'>
                        {selectedLocation === 'exterior'
                          ? 'Estudante do Exterior'
                          : 'Estudante do Brasil'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div className='space-y-2'>
                        <p>
                          Marque os documentos conforme você for providenciando
                        </p>
                        <p className='text-amber-600 font-semibold bg-amber-50 p-3 rounded-lg border border-amber-200 mt-3'>
                          ⚠️ A documentação é tão importante quanto a prova. Se
                          você tirar nota total na prova e não estiver com os
                          documentos ajustados, você será indeferido.
                        </p>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {documentos.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={`border rounded-xl p-5 transition-all cursor-pointer hover:shadow-md ${
                            checkedItems[doc.id]
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                              : 'bg-white border-gray-200 hover:border-cyan-300'
                          }`}
                          onClick={() => toggleCheck(doc.id)}
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex-shrink-0 mt-1'>
                              {checkedItems[doc.id] ? (
                                <CheckCircle2 className='h-6 w-6 text-green-600' />
                              ) : (
                                <Circle className='h-6 w-6 text-gray-400' />
                              )}
                            </div>
                            <div className='flex-1'>
                              <h3
                                className={`text-lg font-semibold mb-2 ${
                                  checkedItems[doc.id]
                                    ? 'text-green-800'
                                    : 'text-gray-800'
                                }`}
                              >
                                {doc.titulo}
                              </h3>
                              <p className='text-gray-600 text-sm leading-relaxed'>
                                {doc.descricao}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Informação Adicional */}
                    <div className='mt-8 p-5 bg-blue-50 border border-blue-200 rounded-xl'>
                      <div className='flex items-start gap-3'>
                        <Info className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <h4 className='font-semibold text-blue-900 mb-2'>
                            Importante
                          </h4>
                          <p className='text-sm text-blue-800'>
                            Certifique-se de que todos os documentos estejam
                            atualizados e autenticados conforme exigido pela
                            instituição de destino. Em caso de dúvidas, entre em
                            contato com nossa equipe de suporte.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Box Lateral - Informações do Exterior */}
              {selectedLocation === 'exterior' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className='lg:col-span-2'
                >
                  <Card className='shadow-xl bg-gradient-to-br from-red-50 to-orange-50 border-red-200 sticky top-6'>
                    <CardHeader>
                      <CardTitle className='text-xl flex items-center gap-2 text-red-700'>
                        <Globe className='h-5 w-5' />
                        Informações Importantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {/* Legalização */}
                      <div className='bg-white p-4 rounded-lg border border-red-200'>
                        <h4 className='font-bold text-red-700 mb-3 flex items-center gap-2'>
                          <FileText className='h-4 w-4' />
                          Legalização de Documentos
                        </h4>
                        <div className='text-sm text-gray-700 space-y-3'>
                          <p>
                            É preciso <strong>validar</strong> seus documentos
                            para que sejam aceitos no Brasil. Essa validação é
                            feita no país de origem da faculdade.
                          </p>
                          <div className='bg-red-50 p-3 rounded-md border-l-4 border-red-400'>
                            <p className='font-semibold text-red-700 mb-2'>
                              Processo:
                            </p>
                            <ol className='list-decimal list-inside space-y-1 text-xs'>
                              <li>
                                Levar ao <strong>MEC</strong> para
                                reconhecimento das assinaturas
                              </li>
                              <li>
                                Levar ao{' '}
                                <strong>
                                  Ministério das Relações Exteriores
                                </strong>{' '}
                                para Apostilamento de Haia
                              </li>
                            </ol>
                          </div>
                          <p className='text-xs'>
                            <strong>⏱️ Prazo:</strong> 3 a 10 dias úteis
                            <br />
                            <strong>💰 Custo:</strong> Varia por país (pode ser
                            cobrado por ato ou por página)
                          </p>
                        </div>
                      </div>

                      {/* Tradução Juramentada */}
                      <div className='bg-white p-4 rounded-lg border border-red-200'>
                        <h4 className='font-bold text-red-700 mb-3 flex items-center gap-2'>
                          <Info className='h-4 w-4' />
                          Tradução Juramentada
                        </h4>
                        <div className='text-sm text-gray-700 space-y-2'>
                          <p>
                            Documentos em idioma estrangeiro precisam ser
                            traduzidos por tradutor juramentado.
                          </p>
                          <div className='bg-amber-50 p-3 rounded-md border border-amber-300'>
                            <p className='text-xs text-amber-800'>
                              <strong>⚠️ Atenção:</strong> Algumas instituições
                              exigem tradução juramentada e outras não.{' '}
                              <strong>
                                Verifique no edital da instituição
                              </strong>{' '}
                              para a qual você está se candidatando.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Seleção de Localização */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-center mb-2'>
              Onde você estuda atualmente?
            </DialogTitle>
            <DialogDescription className='text-center text-base'>
              Selecione sua localização para ver o checklist adequado de
              documentos
            </DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-6 mt-8 mb-4'>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleSelectLocation('brasil')}
                className='w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
              >
                <MapPin className='h-5 w-5' />
                <span className='text-base font-bold'>Brasil</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleSelectLocation('exterior')}
                className='w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg'
              >
                <Globe className='h-5 w-5' />
                <span className='text-base font-bold'>Exterior</span>
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrepararDocumentosPage;
