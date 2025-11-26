import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Plus,
  BookOpen,
  Clock,
  Users,
  BarChart3,
  Edit,
  Trash2,
  FileText,
  Settings,
  Search,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminGerenciarSimuladosPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMateria, setFilterMateria] = useState('todas');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Estados para os modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSimulado, setSelectedSimulado] = useState(null);

  // Formulário de simulado
  const [formData, setFormData] = useState({
    nomeFaculdade: '',
    duracaoMinutos: '',
    ativo: true,
    disciplinas: {},
  });

  // Estado dos simulados e disciplinas
  const [simulados, setSimulados] = useState([]);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);

  // Buscar simulados e disciplinas do Supabase
  useEffect(() => {
    fetchSimulados();
    fetchDisciplinas();
  }, []);

  const fetchDisciplinas = async () => {
    try {
      // Buscar disciplinas únicas via função RPC (sem limite de registros)
      const { data, error } = await supabase.rpc('get_distinct_disciplines');

      if (error) throw error;

      // Normalizar e ordenar
      const disciplinasUnicas = (data || [])
        .map((item) => (item.disciplina ? String(item.disciplina).trim() : ''))
        .filter((d) => d && d.length > 0)
        .sort((a, b) => a.localeCompare(b));

      console.log(
        'Disciplinas carregadas (únicas):',
        disciplinasUnicas.length,
        disciplinasUnicas
      );
      setDisciplinasDisponiveis(disciplinasUnicas);
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      // Fallback para lista padrão se der erro
      setDisciplinasDisponiveis([
        'Anatomia',
        'Fisiologia',
        'Bioquímica',
        'Farmacologia',
        'Patologia',
      ]);
    }
  };

  const fetchSimulados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Formatar dados
      const simuladosFormatados = (data || []).map((s) => ({
        id: s.id,
        nomeFaculdade: s.nome_faculdade,
        totalQuestoes: s.total_questoes,
        duracaoMinutos: s.duracao_minutos,
        ativo: s.ativo,
        criadoEm: new Date(s.created_at).toLocaleDateString('pt-BR'),
        participantes: 0, // Calcular depois se necessário
        disciplinas: s.disciplinas || {},
      }));

      setSimulados(simuladosFormatados);
    } catch (error) {
      console.error('Erro ao buscar simulados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os simulados.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSimulados = simulados.filter(
    (simulado) =>
      simulado.nomeFaculdade.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterMateria === 'todas' ||
        Object.keys(simulado.disciplinas).includes(filterMateria))
  );

  const materias = [
    ...new Set(simulados.flatMap((s) => Object.keys(s.disciplinas))),
  ];

  const calcularTotalQuestoes = (disciplinas) => {
    return Object.values(disciplinas).reduce(
      (sum, num) => sum + (parseInt(num) || 0),
      0
    );
  };

  const resetForm = () => {
    setFormData({
      nomeFaculdade: '',
      duracaoMinutos: '',
      ativo: true,
      disciplinas: {},
    });
  };

  const handleDisciplinaChange = (disciplina, quantidade) => {
    const novasDisciplinas = { ...formData.disciplinas };

    if (quantidade === '' || quantidade === '0') {
      delete novasDisciplinas[disciplina];
    } else {
      novasDisciplinas[disciplina] = parseInt(quantidade);
    }

    setFormData({ ...formData, disciplinas: novasDisciplinas });
  };

  const handleCreateSimulado = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditSimulado = (simulado) => {
    setSelectedSimulado(simulado);
    setFormData({
      nomeFaculdade: simulado.nomeFaculdade,
      duracaoMinutos: simulado.duracaoMinutos.toString(),
      ativo: simulado.ativo,
      disciplinas: { ...simulado.disciplinas },
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (simulado) => {
    setSelectedSimulado(simulado);
    setShowDeleteDialog(true);
  };

  const handleSaveCreate = async () => {
    if (!formData.nomeFaculdade || !formData.duracaoMinutos) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome da faculdade e a duração.',
        variant: 'destructive',
      });
      return;
    }

    if (Object.keys(formData.disciplinas).length === 0) {
      toast({
        title: 'Nenhuma disciplina selecionada',
        description:
          'Por favor, adicione pelo menos uma disciplina com quantidade de questões.',
        variant: 'destructive',
      });
      return;
    }

    const totalQuestoes = calcularTotalQuestoes(formData.disciplinas);

    try {
      const { data, error } = await supabase
        .from('simulados')
        .insert({
          nome_faculdade: formData.nomeFaculdade,
          total_questoes: totalQuestoes,
          duracao_minutos: parseInt(formData.duracaoMinutos),
          ativo: formData.ativo,
          disciplinas: formData.disciplinas,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      await fetchSimulados();

      setShowCreateModal(false);
      resetForm();

      toast({
        title: 'Simulado criado!',
        description: `Simulado da ${formData.nomeFaculdade} foi criado com ${totalQuestoes} questões.`,
      });
    } catch (error) {
      console.error('Erro ao criar simulado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar',
        description: 'Não foi possível criar o simulado.',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.nomeFaculdade || !formData.duracaoMinutos) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome da faculdade e a duração.',
        variant: 'destructive',
      });
      return;
    }

    if (Object.keys(formData.disciplinas).length === 0) {
      toast({
        title: 'Nenhuma disciplina selecionada',
        description:
          'Por favor, adicione pelo menos uma disciplina com quantidade de questões.',
        variant: 'destructive',
      });
      return;
    }

    const totalQuestoes = calcularTotalQuestoes(formData.disciplinas);

    try {
      const { error } = await supabase
        .from('simulados')
        .update({
          nome_faculdade: formData.nomeFaculdade,
          total_questoes: totalQuestoes,
          duracao_minutos: parseInt(formData.duracaoMinutos),
          ativo: formData.ativo,
          disciplinas: formData.disciplinas,
        })
        .eq('id', selectedSimulado.id);

      if (error) throw error;

      // Atualizar lista local
      await fetchSimulados();

      setShowEditModal(false);
      setSelectedSimulado(null);
      resetForm();

      toast({
        title: 'Simulado atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar simulado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o simulado.',
      });
    }
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('simulados')
        .delete()
        .eq('id', selectedSimulado.id);

      if (error) throw error;

      // Atualizar lista local
      await fetchSimulados();

      setShowDeleteDialog(false);

      toast({
        title: 'Simulado deletado!',
        description: `Simulado da ${selectedSimulado.nomeFaculdade} foi removido com sucesso.`,
      });

      setSelectedSimulado(null);
    } catch (error) {
      console.error('Erro ao deletar simulado:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o simulado.',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Gerenciar Simulados - Admin | AmigoMeD!</title>
        <meta
          name='description'
          content='Gerencie e crie simulados para os alunos da plataforma.'
        />
      </Helmet>

      <div className='min-h-full bg-gradient-to-br from-gray-50 via-white to-blue-50/50 space-y-6'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                🎯 Gerenciar Simulados
              </h1>
              <p className='text-gray-600 mt-1'>
                Crie e gerencie simulados utilizando as questões disponíveis no
                banco
              </p>
            </div>
            <Button
              onClick={handleCreateSimulado}
              className='bg-cyan-600 hover:bg-cyan-700'
            >
              <Plus className='mr-2 h-4 w-4' />
              Criar Novo Simulado
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <FileText className='h-6 w-6 text-blue-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Total Simulados
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {simulados.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <Settings className='h-6 w-6 text-green-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>Ativos</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {simulados.filter((s) => s.ativo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <Users className='h-6 w-6 text-purple-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Participantes
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {simulados.reduce((acc, s) => acc + s.participantes, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-2 bg-orange-100 rounded-lg'>
                  <BarChart3 className='h-6 w-6 text-orange-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Avg. Questões
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {simulados.length > 0
                      ? Math.round(
                          simulados.reduce(
                            (acc, s) => acc + s.totalQuestoes,
                            0
                          ) / simulados.length
                        )
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col lg:flex-row gap-4'>
              <div className='flex-1'>
                <Label htmlFor='search'>Buscar Simulados</Label>
                <div className='relative mt-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='search'
                    placeholder='Digite o nome do simulado...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <div className='w-full lg:w-64'>
                <Label>Filtrar por Matéria</Label>
                <Select value={filterMateria} onValueChange={setFilterMateria}>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Todas as matérias' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='todas'>Todas as matérias</SelectItem>
                    {materias.map((materia) => (
                      <SelectItem key={materia} value={materia}>
                        {materia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Simulados */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <BookOpen className='mr-2 h-5 w-5' />
              Simulados Criados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {filteredSimulados.length === 0 ? (
                <div className='text-center py-8'>
                  <FileText className='mx-auto h-12 w-12 text-gray-400' />
                  <h3 className='mt-4 text-lg font-medium text-gray-900'>
                    Nenhum simulado encontrado
                  </h3>
                  <p className='mt-2 text-gray-500'>
                    {searchTerm || filterMateria
                      ? 'Tente ajustar seus filtros ou criar um novo simulado.'
                      : 'Comece criando seu primeiro simulado.'}
                  </p>
                </div>
              ) : (
                filteredSimulados.map((simulado) => (
                  <div
                    key={simulado.id}
                    className='bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            🏫 {simulado.nomeFaculdade}
                          </h3>
                          <Badge
                            variant={simulado.ativo ? 'default' : 'secondary'}
                            className={
                              simulado.ativo
                                ? 'bg-green-100 text-green-800'
                                : ''
                            }
                          >
                            {simulado.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-2'>
                          <div className='flex items-center'>
                            <FileText className='mr-1 h-4 w-4' />
                            {simulado.totalQuestoes} questões
                          </div>
                          <div className='flex items-center'>
                            <Clock className='mr-1 h-4 w-4' />
                            {simulado.duracaoMinutos} min
                          </div>
                          <div className='flex items-center'>
                            <Users className='mr-1 h-4 w-4' />
                            {simulado.participantes} participantes
                          </div>
                          <div className='flex items-center'>
                            <BookOpen className='mr-1 h-4 w-4' />
                            {Object.keys(simulado.disciplinas).length}{' '}
                            disciplinas
                          </div>
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {Object.entries(simulado.disciplinas).map(
                            ([disciplina, qtd]) => (
                              <Badge
                                key={disciplina}
                                variant='outline'
                                className='text-xs'
                              >
                                {disciplina}: {qtd}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEditSimulado(simulado)}
                        >
                          <Edit className='mr-1 h-4 w-4' />
                          Editar
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDeleteClick(simulado)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='mr-1 h-4 w-4' />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal Criar Simulado */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center text-2xl'>
                <Plus className='mr-2 h-6 w-6 text-cyan-600' />
                Criar Novo Simulado
              </DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para criar um novo simulado
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='create-nome'>Nome da Faculdade *</Label>
                  <Input
                    id='create-nome'
                    value={formData.nomeFaculdade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomeFaculdade: e.target.value,
                      })
                    }
                    placeholder='Ex: UNIBH, UFMG, PUC Minas'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='create-duracao'>Duração (min) *</Label>
                  <Input
                    id='create-duracao'
                    type='number'
                    min='1'
                    value={formData.duracaoMinutos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duracaoMinutos: e.target.value,
                      })
                    }
                    placeholder='120'
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-base font-semibold'>
                    Disciplinas e Quantidade de Questões *
                  </Label>
                  <span className='text-sm text-gray-500'>
                    Total: {calcularTotalQuestoes(formData.disciplinas)}{' '}
                    questões
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-3 border rounded-lg p-3 bg-gray-50'>
                  {disciplinasDisponiveis.map((disciplina) => (
                    <div key={disciplina} className='flex items-center gap-2'>
                      <Label
                        htmlFor={`disc-${disciplina}`}
                        className='flex-1 text-sm'
                      >
                        {disciplina}
                      </Label>
                      <Input
                        id={`disc-${disciplina}`}
                        type='number'
                        min='0'
                        value={formData.disciplinas[disciplina] || ''}
                        onChange={(e) =>
                          handleDisciplinaChange(disciplina, e.target.value)
                        }
                        placeholder='0'
                        className='w-20'
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='create-ativo'
                  checked={formData.ativo}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.checked })
                  }
                  className='h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500'
                />
                <Label htmlFor='create-ativo' className='cursor-pointer'>
                  Simulado ativo (visível para os alunos)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <X className='mr-2 h-4 w-4' />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCreate}
                className='bg-cyan-600 hover:bg-cyan-700'
              >
                <Save className='mr-2 h-4 w-4' />
                Criar Simulado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Simulado */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center text-2xl'>
                <Edit className='mr-2 h-6 w-6 text-blue-600' />
                Editar Simulado
              </DialogTitle>
              <DialogDescription>
                Modifique os dados do simulado selecionado
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-nome'>Nome da Faculdade *</Label>
                  <Input
                    id='edit-nome'
                    value={formData.nomeFaculdade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomeFaculdade: e.target.value,
                      })
                    }
                    placeholder='Ex: UNIBH, UFMG, PUC Minas'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-duracao'>Duração (min) *</Label>
                  <Input
                    id='edit-duracao'
                    type='number'
                    min='1'
                    value={formData.duracaoMinutos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duracaoMinutos: e.target.value,
                      })
                    }
                    placeholder='120'
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-base font-semibold'>
                    Disciplinas e Quantidade de Questões *
                  </Label>
                  <span className='text-sm text-gray-500'>
                    Total: {calcularTotalQuestoes(formData.disciplinas)}{' '}
                    questões
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-3 border rounded-lg p-3 bg-gray-50'>
                  {disciplinasDisponiveis.map((disciplina) => (
                    <div key={disciplina} className='flex items-center gap-2'>
                      <Label
                        htmlFor={`edit-disc-${disciplina}`}
                        className='flex-1 text-sm'
                      >
                        {disciplina}
                      </Label>
                      <Input
                        id={`edit-disc-${disciplina}`}
                        type='number'
                        min='0'
                        value={formData.disciplinas[disciplina] || ''}
                        onChange={(e) =>
                          handleDisciplinaChange(disciplina, e.target.value)
                        }
                        placeholder='0'
                        className='w-20'
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='edit-ativo'
                  checked={formData.ativo}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.checked })
                  }
                  className='h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500'
                />
                <Label htmlFor='edit-ativo' className='cursor-pointer'>
                  Simulado ativo (visível para os alunos)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSimulado(null);
                  resetForm();
                }}
              >
                <X className='mr-2 h-4 w-4' />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                className='bg-blue-600 hover:bg-blue-700'
              >
                <Save className='mr-2 h-4 w-4' />
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Deletar Simulado */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center text-red-600'>
                <AlertTriangle className='mr-2 h-6 w-6' />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar o simulado da{' '}
                <span className='font-semibold'>
                  "{selectedSimulado?.nomeFaculdade}"
                </span>
                ?
                <br />
                <br />
                Esta ação não pode ser desfeita e todos os dados relacionados
                serão permanentemente removidos.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedSimulado(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                className='bg-red-600 hover:bg-red-700'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Deletar Simulado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminGerenciarSimuladosPage;
