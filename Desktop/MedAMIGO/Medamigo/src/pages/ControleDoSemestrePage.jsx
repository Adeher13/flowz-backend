import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calendar,
  GraduationCap,
  Target,
  Sparkles,
  Save,
  X,
} from 'lucide-react';

const ControleDoSemestrePage = () => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // Form states
  const [semesterNumber, setSemesterNumber] = useState('');
  const [semesterYear, setSemesterYear] = useState(new Date().getFullYear());
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState('');

  // Subject form
  const [subjectName, setSubjectName] = useState('');
  const [subjectGrade, setSubjectGrade] = useState('');
  const [subjectCredits, setSubjectCredits] = useState('');
  const [subjectStatus, setSubjectStatus] = useState('Cursando');

  useEffect(() => {
    if (user) {
      fetchSemesters();
    }
  }, [user]);

  const fetchSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('semester_grades')
        .select('*')
        .eq('user_id', user.id)
        .order('semester_year', { ascending: false })
        .order('semester_number', { ascending: false });

      if (error) throw error;
      setSemesters(data || []);
    } catch (error) {
      console.error('Erro ao buscar semestres:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar seus semestres.',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (subjectsArray) => {
    if (!subjectsArray || subjectsArray.length === 0) {
      return {
        averageGrade: 0,
        totalCredits: 0,
        approvedSubjects: 0,
        failedSubjects: 0,
      };
    }

    const grades = subjectsArray
      .filter((s) => s.status === 'Aprovado' && s.grade)
      .map((s) => parseFloat(s.grade));

    const averageGrade =
      grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

    const totalCredits = subjectsArray.reduce(
      (sum, s) => sum + (parseInt(s.credits) || 0),
      0
    );

    const approvedSubjects = subjectsArray.filter(
      (s) => s.status === 'Aprovado'
    ).length;

    const failedSubjects = subjectsArray.filter(
      (s) => s.status === 'Reprovado'
    ).length;

    return {
      averageGrade: parseFloat(averageGrade.toFixed(2)),
      totalCredits,
      approvedSubjects,
      failedSubjects,
    };
  };

  const handleSaveSemester = async () => {
    if (!semesterNumber || subjects.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description:
          'Preencha o número do semestre e adicione pelo menos uma disciplina.',
      });
      return;
    }

    const stats = calculateStatistics(subjects);
    const semesterPeriod = `${semesterYear}.${semesterNumber}`;

    const payload = {
      user_id: user.id,
      semester_number: parseInt(semesterNumber),
      semester_year: parseInt(semesterYear),
      semester_period: semesterPeriod,
      subjects_json: subjects,
      notes,
      ...stats,
    };

    try {
      if (selectedSemester) {
        // Update
        const { error } = await supabase
          .from('semester_grades')
          .update(payload)
          .eq('id', selectedSemester.id);

        if (error) throw error;

        toast({
          title: 'Semestre atualizado!',
          description: 'Suas notas foram atualizadas com sucesso.',
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('semester_grades')
          .insert(payload);

        if (error) throw error;

        toast({
          title: 'Semestre criado!',
          description: 'Seu controle de semestre foi salvo com sucesso.',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSemesters();
    } catch (error) {
      console.error('Erro ao salvar semestre:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar o semestre.',
      });
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este semestre?')) return;

    try {
      const { error } = await supabase
        .from('semester_grades')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Semestre excluído',
        description: 'O semestre foi removido com sucesso.',
      });

      fetchSemesters();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o semestre.',
      });
    }
  };

  const handleAddSubject = () => {
    if (!subjectName || !subjectGrade || !subjectCredits) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha nome, nota e créditos da disciplina.',
      });
      return;
    }

    const newSubject = {
      name: subjectName,
      grade: parseFloat(subjectGrade),
      credits: parseInt(subjectCredits),
      status: subjectStatus,
    };

    if (editingSubject !== null) {
      // Edit existing
      const updated = [...subjects];
      updated[editingSubject] = newSubject;
      setSubjects(updated);
      setEditingSubject(null);
    } else {
      // Add new
      setSubjects([...subjects, newSubject]);
    }

    // Reset subject form
    setSubjectName('');
    setSubjectGrade('');
    setSubjectCredits('');
    setSubjectStatus('Cursando');
  };

  const handleEditSubject = (index) => {
    const subject = subjects[index];
    setSubjectName(subject.name);
    setSubjectGrade(subject.grade);
    setSubjectCredits(subject.credits);
    setSubjectStatus(subject.status);
    setEditingSubject(index);
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
    if (editingSubject === index) {
      setEditingSubject(null);
      setSubjectName('');
      setSubjectGrade('');
      setSubjectCredits('');
      setSubjectStatus('Cursando');
    }
  };

  const openNewSemesterDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditSemesterDialog = (semester) => {
    setSelectedSemester(semester);
    setSemesterNumber(semester.semester_number.toString());
    setSemesterYear(semester.semester_year);
    setSubjects(semester.subjects_json || []);
    setNotes(semester.notes || '');
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedSemester(null);
    setSemesterNumber('');
    setSemesterYear(new Date().getFullYear());
    setSubjects([]);
    setNotes('');
    setSubjectName('');
    setSubjectGrade('');
    setSubjectCredits('');
    setSubjectStatus('Cursando');
    setEditingSubject(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Reprovado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Cursando':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className='h-4 w-4' />;
      case 'Reprovado':
        return <AlertCircle className='h-4 w-4' />;
      case 'Cursando':
        return <BookOpen className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const calculateOverallStats = () => {
    if (semesters.length === 0) return null;

    const totalCredits = semesters.reduce(
      (sum, s) => sum + (s.total_credits || 0),
      0
    );
    const totalApproved = semesters.reduce(
      (sum, s) => sum + (s.approved_subjects || 0),
      0
    );
    const totalFailed = semesters.reduce(
      (sum, s) => sum + (s.failed_subjects || 0),
      0
    );

    const allGrades = semesters
      .filter((s) => s.average_grade)
      .map((s) => s.average_grade);

    const overallAverage =
      allGrades.length > 0
        ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
        : 0;

    return {
      totalSemesters: semesters.length,
      totalCredits,
      totalApproved,
      totalFailed,
      overallAverage: parseFloat(overallAverage.toFixed(2)),
    };
  };

  const overallStats = calculateOverallStats();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-8'
      >
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3'>
              <GraduationCap className='h-10 w-10 text-blue-600' />
              Controle do Semestre
            </h1>
            <p className='text-gray-600 mt-2'>
              Organize suas notas e acompanhe seu desempenho acadêmico
            </p>
          </div>
          <Button
            onClick={openNewSemesterDialog}
            className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          >
            <Plus className='mr-2 h-5 w-5' />
            Novo Semestre
          </Button>
        </div>
      </motion.div>

      {/* Overall Statistics */}
      {overallStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8'
        >
          <Card className='border-l-4 border-l-blue-500'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <Calendar className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Semestres</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {overallStats.totalSemesters}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-green-500'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <TrendingUp className='h-5 w-5 text-green-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Média Geral</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {overallStats.overallAverage.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-purple-500'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <Award className='h-5 w-5 text-purple-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Créditos</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {overallStats.totalCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-emerald-500'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-emerald-100 rounded-lg'>
                  <CheckCircle className='h-5 w-5 text-emerald-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Aprovações</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {overallStats.totalApproved}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-red-500'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-lg'>
                  <AlertCircle className='h-5 w-5 text-red-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Reprovações</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {overallStats.totalFailed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Semesters List */}
      {semesters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center py-16'
        >
          <div className='inline-block p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6'>
            <BookOpen className='h-16 w-16 text-blue-600' />
          </div>
          <h3 className='text-2xl font-bold text-gray-800 mb-2'>
            Nenhum semestre cadastrado
          </h3>
          <p className='text-gray-600 mb-6'>
            Comece adicionando seu primeiro semestre para acompanhar suas notas!
          </p>
          <Button
            onClick={openNewSemesterDialog}
            size='lg'
            className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          >
            <Plus className='mr-2 h-5 w-5' />
            Adicionar Primeiro Semestre
          </Button>
        </motion.div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <AnimatePresence>
            {semesters.map((semester, index) => (
              <motion.div
                key={semester.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className='hover:shadow-xl transition-shadow border-t-4 border-t-blue-500'>
                  <CardHeader className='bg-gradient-to-r from-blue-50 to-purple-50'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                          <GraduationCap className='h-6 w-6 text-blue-600' />
                        </div>
                        <div>
                          <CardTitle className='text-2xl'>
                            {semester.semester_number}º Semestre
                          </CardTitle>
                          <p className='text-sm text-gray-600'>
                            {semester.semester_period}
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openEditSemesterDialog(semester)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDeleteSemester(semester.id)}
                        >
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='p-6'>
                    {/* Stats */}
                    <div className='grid grid-cols-2 gap-4 mb-6'>
                      <div className='text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg'>
                        <p className='text-3xl font-bold text-green-600'>
                          {semester.average_grade?.toFixed(1) || '0.0'}
                        </p>
                        <p className='text-sm text-gray-600'>Média</p>
                      </div>
                      <div className='text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg'>
                        <p className='text-3xl font-bold text-purple-600'>
                          {semester.total_credits || 0}
                        </p>
                        <p className='text-sm text-gray-600'>Créditos</p>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className='space-y-3'>
                      <h4 className='font-semibold text-gray-700 flex items-center gap-2'>
                        <BookOpen className='h-4 w-4' />
                        Disciplinas ({semester.subjects_json?.length || 0})
                      </h4>
                      {semester.subjects_json?.map((subject, idx) => (
                        <div
                          key={idx}
                          className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                        >
                          <div className='flex-1'>
                            <p className='font-medium text-gray-800'>
                              {subject.name}
                            </p>
                            <p className='text-sm text-gray-600'>
                              {subject.credits} créditos
                            </p>
                          </div>
                          <div className='flex items-center gap-3'>
                            <Badge
                              className={`${getStatusColor(
                                subject.status
                              )} border`}
                            >
                              {getStatusIcon(subject.status)}
                              <span className='ml-1'>{subject.status}</span>
                            </Badge>
                            <span className='text-lg font-bold text-gray-800'>
                              {subject.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {semester.notes && (
                      <div className='mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded'>
                        <p className='text-sm text-gray-700'>
                          {semester.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl flex items-center gap-2'>
              <Sparkles className='h-6 w-6 text-blue-600' />
              {selectedSemester ? 'Editar Semestre' : 'Novo Semestre'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Semester Info */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='semesterNumber'>Número do Semestre</Label>
                <Input
                  id='semesterNumber'
                  type='number'
                  min='1'
                  max='12'
                  value={semesterNumber}
                  onChange={(e) => setSemesterNumber(e.target.value)}
                  placeholder='Ex: 1, 2, 3...'
                />
              </div>
              <div>
                <Label htmlFor='semesterYear'>Ano</Label>
                <Input
                  id='semesterYear'
                  type='number'
                  min='2000'
                  max='2100'
                  value={semesterYear}
                  onChange={(e) => setSemesterYear(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Add Subject Form */}
            <div className='p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-300'>
              <h3 className='font-semibold text-lg mb-4 flex items-center gap-2'>
                <Plus className='h-5 w-5' />
                {editingSubject !== null
                  ? 'Editar Disciplina'
                  : 'Adicionar Disciplina'}
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div className='md:col-span-2'>
                  <Label>Nome da Disciplina</Label>
                  <Input
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder='Ex: Anatomia Humana I'
                  />
                </div>
                <div>
                  <Label>Nota</Label>
                  <Input
                    type='number'
                    step='0.1'
                    min='0'
                    max='10'
                    value={subjectGrade}
                    onChange={(e) => setSubjectGrade(e.target.value)}
                    placeholder='0.0 a 10.0'
                  />
                </div>
                <div>
                  <Label>Créditos</Label>
                  <Input
                    type='number'
                    min='1'
                    value={subjectCredits}
                    onChange={(e) => setSubjectCredits(e.target.value)}
                    placeholder='Ex: 4'
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label>Status</Label>
                  <Select
                    value={subjectStatus}
                    onValueChange={setSubjectStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Cursando'>Cursando</SelectItem>
                      <SelectItem value='Aprovado'>Aprovado</SelectItem>
                      <SelectItem value='Reprovado'>Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button onClick={handleAddSubject} className='flex-1'>
                  {editingSubject !== null ? (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Salvar Alteração
                    </>
                  ) : (
                    <>
                      <Plus className='mr-2 h-4 w-4' />
                      Adicionar
                    </>
                  )}
                </Button>
                {editingSubject !== null && (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setEditingSubject(null);
                      setSubjectName('');
                      setSubjectGrade('');
                      setSubjectCredits('');
                      setSubjectStatus('Cursando');
                    }}
                  >
                    <X className='mr-2 h-4 w-4' />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Subjects List */}
            {subjects.length > 0 && (
              <div>
                <h3 className='font-semibold text-lg mb-3 flex items-center gap-2'>
                  <BookOpen className='h-5 w-5' />
                  Disciplinas Adicionadas ({subjects.length})
                </h3>
                <div className='space-y-2 max-h-60 overflow-y-auto'>
                  {subjects.map((subject, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-white border rounded-lg'
                    >
                      <div className='flex-1'>
                        <p className='font-medium'>{subject.name}</p>
                        <p className='text-sm text-gray-600'>
                          Nota: {subject.grade} | Créditos: {subject.credits}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge className={getStatusColor(subject.status)}>
                          {subject.status}
                        </Badge>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEditSubject(index)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleRemoveSubject(index)}
                        >
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor='notes'>Observações (Opcional)</Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Adicione observações sobre este semestre...'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSemester}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            >
              <Save className='mr-2 h-4 w-4' />
              Salvar Semestre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ControleDoSemestrePage;
