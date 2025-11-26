import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useSimulations } from '@/contexts/SimulationsContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  Loader2,
  Search,
  Trash2,
  Edit,
  X,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminQuestoesLocalPage = () => {
  const { toast } = useToast();
  const { subjects } = useSimulations();

  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject: 'all',
    difficulty: 'all',
    search: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const difficultyLevels = ['Fácil', 'Médio', 'Difícil'];
  const examTypes = ['ENEM', 'Prova de Transferência', 'Outro'];

  const fetchQuestions = useCallback(async () => {
    setLoading(true);

    // Buscar em lotes para contornar o limite de 1000 registros
    let allQuestions = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('questoes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('Erro ao buscar questões:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar questões.',
          description: error.message,
        });
        break;
      }

      if (data && data.length > 0) {
        allQuestions = [...allQuestions, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ ${allQuestions.length} questões carregadas do Supabase`);
    if (allQuestions.length > 0) {
      console.log('Primeira questão (estrutura):', allQuestions[0]);
      console.log('Campos disponíveis:', Object.keys(allQuestions[0]));
    }
    setQuestions(allQuestions);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    let tempFiltered = questions;
    if (filters.subject !== 'all') {
      tempFiltered = tempFiltered.filter(
        (q) =>
          q.disciplina &&
          q.disciplina.toUpperCase() === filters.subject.toUpperCase()
      );
    }
    if (filters.difficulty !== 'all') {
      tempFiltered = tempFiltered.filter(
        (q) => q.difficulty_level === filters.difficulty
      );
    }
    if (filters.search) {
      tempFiltered = tempFiltered.filter((q) => {
        const searchText = filters.search.toLowerCase();
        const questionText = (q.texto_questao || '').toLowerCase();
        return questionText.includes(searchText);
      });
    }
    setFilteredQuestions(tempFiltered);
  }, [filters, questions]);

  const handleOpenModal = (question = null) => {
    setIsEditing(!!question);
    if (question) {
      // Se vier do banco com campos individuais, converte para array
      let options = [];
      if (
        question.options_json &&
        Array.isArray(question.options_json) &&
        question.options_json.length > 0
      ) {
        options = question.options_json;
      } else {
        options = [
          {
            text: question.opcao_a || '',
            isCorrect: question.resposta_correta === (question.opcao_a || ''),
          },
          {
            text: question.opcao_b || '',
            isCorrect: question.resposta_correta === (question.opcao_b || ''),
          },
          {
            text: question.opcao_c || '',
            isCorrect: question.resposta_correta === (question.opcao_c || ''),
          },
          {
            text: question.opcao_d || '',
            isCorrect: question.resposta_correta === (question.opcao_d || ''),
          },
          {
            text: question.opcao_e || '',
            isCorrect: question.resposta_correta === (question.opcao_e || ''),
          },
        ];
      }
      setCurrentQuestion({
        ...question,
        options_json: options,
        disciplina: question.disciplina || '',
      });
    } else {
      setCurrentQuestion({
        texto_questao: '',
        options_json: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        resposta_correta: '',
        explicacao: '',
        disciplina: '',
        difficulty_level: 'Médio',
        exam_type: 'Prova de Transferência',
        subject: '',
        modulo: '',
        objeto_aprendizagem: '',
      });
    }
    setModalOpen(true);
  };

  const handleUpdateOption = (index, field, value) => {
    const newOptions = [...currentQuestion.options_json];
    newOptions[index] = { ...newOptions[index], [field]: value };

    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setCurrentQuestion({ ...currentQuestion, options_json: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [
      ...currentQuestion.options_json,
      { text: '', isCorrect: false },
    ];
    setCurrentQuestion({ ...currentQuestion, options_json: newOptions });
  };

  const handleRemoveOption = (index) => {
    if (currentQuestion.options_json.length <= 2) {
      toast({
        variant: 'destructive',
        title: 'Mínimo de 2 opções necessárias.',
      });
      return;
    }
    const newOptions = currentQuestion.options_json.filter(
      (_, i) => i !== index
    );
    setCurrentQuestion({ ...currentQuestion, options_json: newOptions });
  };

  const handleSaveQuestion = async () => {
    if (
      !currentQuestion.texto_questao ||
      !currentQuestion.texto_questao.trim()
    ) {
      toast({
        variant: 'destructive',
        title: 'Texto da questão é obrigatório.',
      });
      return;
    }

    if (!currentQuestion.disciplina) {
      toast({ variant: 'destructive', title: 'Disciplina é obrigatória.' });
      return;
    }

    let opcao_a = '',
      opcao_b = '',
      opcao_c = '',
      opcao_d = '',
      opcao_e = '';
    if (
      currentQuestion.options_json &&
      currentQuestion.options_json.length > 0
    ) {
      const hasEmptyOption = currentQuestion.options_json.some(
        (opt) => !opt.text || !opt.text.trim()
      );
      if (hasEmptyOption) {
        toast({
          variant: 'destructive',
          title: 'Todas as opções devem ter texto.',
        });
        return;
      }

      const hasCorrectAnswer = currentQuestion.options_json.some(
        (opt) => opt.isCorrect
      );
      if (!hasCorrectAnswer) {
        toast({
          variant: 'destructive',
          title: 'Marque pelo menos uma resposta correta.',
        });
        return;
      }

      const correctOption = currentQuestion.options_json.find(
        (opt) => opt.isCorrect
      );
      currentQuestion.resposta_correta = correctOption.text;

      // Preenche campos individuais
      opcao_a = currentQuestion.options_json[0]?.text || '';
      opcao_b = currentQuestion.options_json[1]?.text || '';
      opcao_c = currentQuestion.options_json[2]?.text || '';
      opcao_d = currentQuestion.options_json[3]?.text || '';
      opcao_e = currentQuestion.options_json[4]?.text || '';
    } else if (
      !currentQuestion.resposta_correta ||
      !currentQuestion.resposta_correta.trim()
    ) {
      toast({
        variant: 'destructive',
        title: 'Resposta correta é obrigatória.',
      });
      return;
    }

    setLoading(true);
    console.log('Salvando questão:', {
      isEditing,
      id: currentQuestion.id,
      questionData,
    });
    let result;
    if (isEditing) {
      result = await supabase
        .from('questoes')
        .update(questionData)
        .eq('id', currentQuestion.id);
      console.log('Resultado update:', result);
    } else {
      result = await supabase.from('questoes').insert({
        ...questionData,
        id: undefined,
        created_at: new Date().toISOString(),
      });
      console.log('Resultado insert:', result);
    }
    const { error } = result;
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar questão.',
        description: error.message,
      });
    } else {
      toast({
        title: isEditing
          ? 'Questão atualizada com sucesso!'
          : 'Questão criada com sucesso!',
      });
      setModalOpen(false);
      fetchQuestions();
    }
    setLoading(false);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (
      !confirm(
        'Tem certeza que deseja deletar esta questão? Esta ação não pode ser desfeita.'
      )
    ) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('questoes')
      .delete()
      .eq('id', questionId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar questão.',
        description: error.message,
      });
    } else {
      toast({ title: 'Questão deletada com sucesso!' });
      fetchQuestions();
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Admin: Gestão de Questões - AmigoMeD!</title>
      </Helmet>

      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='border-l-4 border-l-blue-500'>
            <CardContent className='pt-6'>
              <div className='text-2xl font-bold text-blue-600'>
                {questions.length}
              </div>
              <p className='text-xs text-gray-500 mt-1'>Total de Questões</p>
            </CardContent>
          </Card>
          <Card className='border-l-4 border-l-green-500'>
            <CardContent className='pt-6'>
              <div className='text-2xl font-bold text-green-600'>
                {questions.filter((q) => q.difficulty_level === 'Fácil').length}
              </div>
              <p className='text-xs text-gray-500 mt-1'>Questões Fáceis</p>
            </CardContent>
          </Card>
          <Card className='border-l-4 border-l-yellow-500'>
            <CardContent className='pt-6'>
              <div className='text-2xl font-bold text-yellow-600'>
                {questions.filter((q) => q.difficulty_level === 'Médio').length}
              </div>
              <p className='text-xs text-gray-500 mt-1'>Questões Médias</p>
            </CardContent>
          </Card>
          <Card className='border-l-4 border-l-red-500'>
            <CardContent className='pt-6'>
              <div className='text-2xl font-bold text-red-600'>
                {
                  questions.filter((q) => q.difficulty_level === 'Difícil')
                    .length
                }
              </div>
              <p className='text-xs text-gray-500 mt-1'>Questões Difíceis</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
              <div>
                <CardTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                  Gestão de Questões
                </CardTitle>
                <CardDescription className='mt-2'>
                  Crie, edite e gerencie todas as questões da plataforma.
                </CardDescription>
              </div>
              <Button
                onClick={() => handleOpenModal()}
                className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                Criar Nova Questão
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>
              <Input
                placeholder='Buscar por texto...'
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
              <Select
                value={filters.subject}
                onValueChange={(v) => setFilters({ ...filters, subject: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Todas Matérias' />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value='all'>Todas Matérias</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.difficulty}
                onValueChange={(v) => setFilters({ ...filters, difficulty: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Todos Níveis' />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value='all'>Todos Níveis</SelectItem>
                  {difficultyLevels.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <Loader2 className='h-12 w-12 animate-spin text-blue-600 mb-4' />
                <p className='text-gray-500'>Carregando questões...</p>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='flex items-center justify-between mb-4'>
                  <p className='text-sm text-gray-600'>
                    <span className='font-semibold text-gray-900'>
                      {filteredQuestions.length}
                    </span>{' '}
                    questões encontradas
                  </p>
                </div>

                {filteredQuestions.length > 0 ? (
                  <div className='grid gap-4'>
                    {filteredQuestions.slice(0, 50).map((q, index) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className='border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 bg-white'
                      >
                        <div className='flex justify-between items-start gap-4'>
                          <div className='flex-1 space-y-3'>
                            <p className='font-medium text-gray-900 line-clamp-2'>
                              {q.texto_questao || 'Sem texto'}
                            </p>

                            <div className='flex flex-wrap gap-2'>
                              <Badge
                                variant='outline'
                                className='bg-blue-50 text-blue-700 border-blue-200'
                              >
                                {q.disciplina}
                              </Badge>
                              <Badge
                                variant='outline'
                                className={
                                  q.difficulty_level === 'Fácil'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : q.difficulty_level === 'Médio'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }
                              >
                                {q.difficulty_level || 'N/A'}
                              </Badge>
                              {q.exam_type && (
                                <Badge
                                  variant='outline'
                                  className='bg-purple-50 text-purple-700 border-purple-200'
                                >
                                  {q.exam_type}
                                </Badge>
                              )}
                              {q.modulo && (
                                <Badge
                                  variant='outline'
                                  className='bg-gray-50 text-gray-700 border-gray-200'
                                >
                                  {q.modulo}
                                </Badge>
                              )}
                            </div>

                            {q.options_json &&
                              Array.isArray(q.options_json) &&
                              q.options_json.length > 0 && (
                                <div className='text-xs text-gray-500'>
                                  {q.options_json.length} opções de resposta
                                </div>
                              )}
                          </div>

                          <div className='flex gap-2 flex-shrink-0'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                console.log('Editando questão:', q.id);
                                handleOpenModal(q);
                              }}
                              className='hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 min-w-[40px]'
                              title='Editar questão'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                console.log('Deletando questão:', q.id);
                                handleDeleteQuestion(q.id);
                              }}
                              className='hover:bg-red-50 hover:text-red-700 hover:border-red-300 min-w-[40px]'
                              title='Deletar questão'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
                    <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500 mb-2'>
                      Nenhuma questão encontrada
                    </p>
                    <p className='text-sm text-gray-400'>
                      Tente ajustar os filtros ou criar uma nova questão
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className='sm:max-w-[800px] max-h-[90vh]'>
            <DialogHeader>
              <DialogTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                {isEditing ? 'Editar' : 'Criar Nova'} Questão
              </DialogTitle>
              <DialogDescription>
                Preencha todos os campos obrigatórios para{' '}
                {isEditing ? 'atualizar' : 'criar'} a questão.
              </DialogDescription>
            </DialogHeader>

            {currentQuestion && (
              <div className='grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-2'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='texto_questao'
                    className='text-sm font-semibold'
                  >
                    Texto da Questão <span className='text-red-500'>*</span>
                  </Label>
                  <Textarea
                    id='texto_questao'
                    placeholder='Digite o enunciado completo da questão...'
                    value={currentQuestion.texto_questao || ''}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        texto_questao: e.target.value,
                      })
                    }
                    rows={4}
                    className='resize-none'
                  />
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-sm font-semibold'>
                      Opções de Resposta <span className='text-red-500'>*</span>
                    </Label>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleAddOption}
                      className='text-xs'
                    >
                      <PlusCircle className='h-3 w-3 mr-1' />
                      Adicionar Opção
                    </Button>
                  </div>

                  <AnimatePresence>
                    {currentQuestion.options_json &&
                      currentQuestion.options_json.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className='flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'
                        >
                          <div className='flex items-center pt-2'>
                            <Checkbox
                              id={`option-${index}`}
                              checked={option.isCorrect}
                              onCheckedChange={(checked) =>
                                handleUpdateOption(index, 'isCorrect', checked)
                              }
                              className='h-5 w-5'
                            />
                          </div>
                          <div className='flex-1'>
                            <Label
                              htmlFor={`option-text-${index}`}
                              className='text-xs text-gray-500 mb-1 block'
                            >
                              Opção {String.fromCharCode(65 + index)}
                            </Label>
                            <Input
                              id={`option-text-${index}`}
                              value={option.text || ''}
                              onChange={(e) =>
                                handleUpdateOption(
                                  index,
                                  'text',
                                  e.target.value
                                )
                              }
                              placeholder={`Digite a opção ${String.fromCharCode(
                                65 + index
                              )}...`}
                              className='bg-white'
                            />
                          </div>
                          {currentQuestion.options_json.length > 2 && (
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveOption(index)}
                              className='text-red-500 hover:text-red-700 hover:bg-red-50'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  <p className='text-xs text-gray-500 flex items-center gap-1'>
                    <AlertCircle className='h-3 w-3' />
                    Marque a checkbox da resposta correta
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='explicacao' className='text-sm font-semibold'>
                    Explicação da Resposta
                  </Label>
                  <Textarea
                    id='explicacao'
                    placeholder='Explique por que esta é a resposta correta...'
                    value={currentQuestion.explicacao || ''}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        explicacao: e.target.value,
                      })
                    }
                    rows={3}
                    className='resize-none'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='disciplina'
                      className='text-sm font-semibold'
                    >
                      Disciplina <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={currentQuestion.disciplina || ''}
                      onValueChange={(v) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          disciplina: v,
                        })
                      }
                    >
                      <SelectTrigger id='disciplina'>
                        <SelectValue placeholder='Selecione...' />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='difficulty'
                      className='text-sm font-semibold'
                    >
                      Dificuldade
                    </Label>
                    <Select
                      value={currentQuestion.difficulty_level || 'Médio'}
                      onValueChange={(v) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          difficulty_level: v,
                        })
                      }
                    >
                      <SelectTrigger id='difficulty'>
                        <SelectValue placeholder='Selecione...' />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        {difficultyLevels.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='exam_type'
                      className='text-sm font-semibold'
                    >
                      Tipo de Prova
                    </Label>
                    <Select
                      value={
                        currentQuestion.exam_type || 'Prova de Transferência'
                      }
                      onValueChange={(v) =>
                        setCurrentQuestion({ ...currentQuestion, exam_type: v })
                      }
                    >
                      <SelectTrigger id='exam_type'>
                        <SelectValue placeholder='Selecione...' />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        {examTypes.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='modulo' className='text-sm font-semibold'>
                      Módulo
                    </Label>
                    <Input
                      id='modulo'
                      placeholder='Ex: Sistema Cardiovascular'
                      value={currentQuestion.modulo || ''}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          modulo: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='objeto' className='text-sm font-semibold'>
                      Objeto de Aprendizagem
                    </Label>
                    <Input
                      id='objeto'
                      placeholder='Ex: Hipertensão arterial'
                      value={currentQuestion.objeto_aprendizagem || ''}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          objeto_aprendizagem: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className='border-t pt-4'>
              <Button
                variant='outline'
                onClick={() => setModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveQuestion}
                disabled={loading}
                className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Salvando...
                  </>
                ) : (
                  <>{isEditing ? 'Atualizar' : 'Criar'} Questão</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminQuestoesLocalPage;
