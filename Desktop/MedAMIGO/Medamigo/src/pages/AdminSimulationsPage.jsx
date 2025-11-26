import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { PlusCircle, Loader2, Trash2, Edit, Send, X } from 'lucide-react';
import { useSimulations } from '@/contexts/SimulationsContext';

const AdminSimulationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subjects } = useSimulations();

  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [loading, setLoading] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [disciplineQuantities, setDisciplineQuantities] = useState([]);
  const [currentSim, setCurrentSim] = useState({ name: '', description: '' });
  const [editingSimId, setEditingSimId] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [filterMateria, setFilterMateria] = useState('todas');

  const fetchSimulations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_simulations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar simulados.',
        description: error.message,
      });
    } else {
      setSimulations(data);
    }
    setLoading(false);
  }, [toast]);

  const fetchStudents = useCallback(async () => {
    const { data: studentRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (rolesError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar papéis de alunos.',
        description: rolesError.message,
      });
      return;
    }

    const studentIds = studentRoles.map((role) => role.user_id);

    if (studentIds.length === 0) {
      setStudents([]);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);

    if (profilesError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar perfis de alunos.',
        description: profilesError.message,
      });
    } else {
      setStudents(
        profiles.map((p) => ({ id: p.id, name: p.full_name || p.id }))
      );
    }
  }, [toast]);

  useEffect(() => {
    fetchSimulations();
    fetchStudents();
  }, [fetchSimulations, fetchStudents]);

  const handleAddDiscipline = () => {
    setDisciplineQuantities([
      ...disciplineQuantities,
      { disciplina: '', limite: 10 },
    ]);
  };

  const handleRemoveDiscipline = (index) => {
    const newQuantities = [...disciplineQuantities];
    newQuantities.splice(index, 1);
    setDisciplineQuantities(newQuantities);
  };

  const handleDisciplineChange = (index, field, value) => {
    const newQuantities = [...disciplineQuantities];
    newQuantities[index][field] = value;
    setDisciplineQuantities(newQuantities);
  };

  const handleSaveSimulation = async () => {
    if (!currentSim.name || disciplineQuantities.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Dados inválidos',
        description:
          'O simulado precisa de um nome e pelo menos uma disciplina.',
      });
      return;
    }

    const hasInvalidEntries = disciplineQuantities.some(
      (dq) => !dq.disciplina || !dq.limite || dq.limite <= 0
    );
    if (hasInvalidEntries) {
      toast({
        variant: 'destructive',
        title: 'Dados inválidos',
        description:
          'Verifique se todas as disciplinas foram selecionadas e as quantidades são válidas.',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-simulation-questions',
        {
          body: { disciplines: disciplineQuantities },
        }
      );

      if (functionError) throw functionError;

      const question_ids = data.question_ids;

      if (!question_ids || question_ids.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhuma questão encontrada',
          description:
            'Não foram encontradas questões para as disciplinas e quantidades especificadas.',
        });
        setLoading(false);
        return;
      }

      const payload = {
        admin_id: user.id,
        name: currentSim.name,
        description: currentSim.description,
        question_ids: question_ids,
        discipline_config: disciplineQuantities,
      };

      const { error: dbError } = editingSimId
        ? await supabase
            .from('custom_simulations')
            .update(payload)
            .eq('id', editingSimId)
        : await supabase.from('custom_simulations').insert(payload);

      if (dbError) throw dbError;

      toast({
        title: `Simulado ${editingSimId ? 'atualizado' : 'salvo'} com sucesso!`,
      });
      setView('list');
      fetchSimulations();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar simulado',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (simId) => {
    const { error } = await supabase
      .from('custom_simulations')
      .delete()
      .eq('id', simId);
    if (error)
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: error.message,
      });
    else {
      toast({ title: 'Simulado deletado!' });
      setSimulations((sims) => sims.filter((s) => s.id !== simId));
    }
  };

  const handleAssignSimulation = async () => {
    if (!editingSimId || selectedStudents.size === 0) return;
    setLoading(true);
    const assignments = Array.from(selectedStudents).map((userId) => ({
      simulation_id: editingSimId,
      user_id: userId,
    }));

    const { error } = await supabase
      .from('custom_simulation_assignments')
      .insert(assignments, { onConflict: 'simulation_id, user_id' });

    if (error)
      toast({
        variant: 'destructive',
        title: 'Erro ao designar',
        description: error.message,
      });
    else toast({ title: 'Simulado designado com sucesso!' });

    setLoading(false);
    setAssignModalOpen(false);
  };

  const startCreate = () => {
    setEditingSimId(null);
    setCurrentSim({ name: '', description: '' });
    setDisciplineQuantities([]);
    setView('create');
  };

  const startEdit = (sim) => {
    if (!sim.discipline_config) {
      toast({
        variant: 'destructive',
        title: 'Edição Indisponível',
        description:
          'Este simulado foi criado com um formato antigo e não pode ser editado. Por favor, crie um novo simulado.',
      });
      return;
    }
    setEditingSimId(sim.id);
    setCurrentSim({ name: sim.name, description: sim.description });
    setDisciplineQuantities(sim.discipline_config);
    setView('edit');
  };

  const openAssignModal = (sim) => {
    setEditingSimId(sim.id);
    setSelectedStudents(new Set());
    setAssignModalOpen(true);
  };

  const totalQuestions = useMemo(() => {
    return disciplineQuantities.reduce(
      (total, dq) => total + (Number(dq.limite) || 0),
      0
    );
  }, [disciplineQuantities]);

  const handleCancel = () => {
    setView('list');
    setEditingSimId(null);
    setCurrentSim({ name: '', description: '' });
    setDisciplineQuantities([]);
  };

  // Filtro para simulado por matéria
  const filteredSimulados = simulations.filter(
    (simulado) =>
      filterMateria === 'todas' ||
      Object.keys(simulado.discipline_config || {}).includes(filterMateria)
  );

  return (
    <>
      <Helmet>
        <title>Admin: Simulados - AmigoMeD!</title>
      </Helmet>
      <div className='w-full'>
        {view !== 'list' && (
          <div className='mb-6'>
            <Button variant='outline' onClick={handleCancel}>
              Voltar para a Lista
            </Button>
          </div>
        )}

        {view === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle className='flex justify-between items-center'>
                <span>Simulados Personalizados</span>
                <Button onClick={startCreate}>
                  <PlusCircle className='mr-2 h-4 w-4' /> Criar Novo
                </Button>
              </CardTitle>
              <CardDescription>
                Crie, edite e designe simulados personalizados para os alunos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className='mx-auto my-8 h-8 w-8 animate-spin' />
              ) : simulations.length > 0 ? (
                <ul className='space-y-4'>
                  {filteredSimulados.map((sim) => (
                    <li
                      key={sim.id}
                      className='flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <div>
                        <p className='font-bold text-lg'>{sim.name}</p>
                        <p className='text-sm text-gray-500'>
                          {sim.description || 'Sem descrição'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {sim.question_ids.length} questões
                        </p>
                      </div>
                      <div className='flex gap-2 mt-2 sm:mt-0'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openAssignModal(sim)}
                        >
                          <Send className='h-4 w-4 mr-1' /> Designar
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => startEdit(sim)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDeleteSimulation(sim.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-center text-gray-500 py-8'>
                  Nenhum simulado personalizado criado ainda.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className='grid lg:grid-cols-3 gap-8'>
            <div className='lg:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Configuração do Simulado</CardTitle>
                  <CardDescription>
                    Adicione as disciplinas e a quantidade de questões desejada
                    para cada uma.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-4'>
                    {disciplineQuantities.map((dq, index) => (
                      <div
                        key={index}
                        className='flex items-center gap-4 p-3 border rounded-lg'
                      >
                        <div className='flex-1'>
                          <Label>Disciplina</Label>
                          <Select
                            value={dq.disciplina}
                            onValueChange={(v) =>
                              handleDisciplineChange(index, 'disciplina', v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Selecione uma disciplina' />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='w-32'>
                          <Label>Quantidade</Label>
                          <Input
                            type='number'
                            min='1'
                            value={dq.limite}
                            onChange={(e) =>
                              handleDisciplineChange(
                                index,
                                'limite',
                                parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='self-end'
                          onClick={() => handleRemoveDiscipline(index)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant='outline' onClick={handleAddDiscipline}>
                    <PlusCircle className='mr-2 h-4 w-4' /> Adicionar Disciplina
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className='sticky top-24'>
                <CardHeader>
                  <CardTitle>
                    {view === 'create' ? 'Novo Simulado' : 'Editar Simulado'}
                  </CardTitle>
                  <CardDescription>
                    Defina os detalhes e salve seu simulado.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='sim-name'>Nome do Simulado</Label>
                    <Input
                      id='sim-name'
                      placeholder='Ex: Simulado Final de Clínica Médica'
                      value={currentSim.name}
                      onChange={(e) =>
                        setCurrentSim((s) => ({ ...s, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='sim-desc'>Descrição (Opcional)</Label>
                    <Input
                      id='sim-desc'
                      placeholder='Breve descrição do simulado'
                      value={currentSim.description}
                      onChange={(e) =>
                        setCurrentSim((s) => ({
                          ...s,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <h3 className='font-medium mb-2'>Resumo</h3>
                    <div className='space-y-1 text-sm border rounded-md p-3 bg-gray-50'>
                      {disciplineQuantities.map(
                        (dq, i) =>
                          dq.disciplina && (
                            <p key={i} className='flex justify-between'>
                              <span>{dq.disciplina}:</span>{' '}
                              <span>{dq.limite || 0} questões</span>
                            </p>
                          )
                      )}
                      <div className='border-t my-2'></div>
                      <p className='flex justify-between font-bold'>
                        <span>Total:</span>{' '}
                        <span>{totalQuestions} questões</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    className='w-full'
                    onClick={handleSaveSimulation}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className='animate-spin' />
                    ) : view === 'create' ? (
                      'Gerar e Salvar Simulado'
                    ) : (
                      'Atualizar Simulado'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Designar Simulado</DialogTitle>
            <DialogDescription>
              Selecione os alunos que terão acesso a este simulado.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-80 overflow-y-auto space-y-2 p-2 border rounded-md my-4'>
            {students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student.id}
                  className='flex items-center gap-3 p-2 rounded-md hover:bg-gray-50'
                >
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => {
                      const newSet = new Set(selectedStudents);
                      if (newSet.has(student.id)) newSet.delete(student.id);
                      else newSet.add(student.id);
                      setSelectedStudents(newSet);
                    }}
                  />
                  <Label
                    htmlFor={`student-${student.id}`}
                    className='cursor-pointer'
                  >
                    {student.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className='text-gray-500 text-center'>
                Nenhum aluno encontrado.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignSimulation} disabled={loading}>
              {loading ? <Loader2 className='animate-spin' /> : 'Designar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSimulationsPage;
