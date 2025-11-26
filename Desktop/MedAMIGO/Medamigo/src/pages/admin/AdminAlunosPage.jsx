import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/customSupabaseClient';
import { useToast } from '../../components/ui/use-toast';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Users,
  Search,
  Eye,
  Edit,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Mail,
  User,
  Shield,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAlunosPage = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro Supabase:', error);
        throw error;
      }

      console.log('Alunos carregados:', data);
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);

      // Se a tabela não existe, mostra mensagem específica
      if (error.message?.includes('relation') || error.code === '42P01') {
        toast({
          variant: 'destructive',
          title: 'Tabela não encontrada',
          description:
            'Execute os scripts SQL no Supabase primeiro para criar a tabela user_profiles.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar alunos',
          description: error.message || 'Não foi possível carregar os alunos.',
        });
      }

      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleEditAccess = (student) => {
    setSelectedStudent(student);
    const currentExpiration = student.access_expires_at
      ? new Date(student.access_expires_at).toISOString().split('T')[0]
      : '';
    setCustomDate(currentExpiration);
    setShowAccessModal(true);
  };

  const handleExtendAccess = async (days) => {
    if (!selectedStudent) return;

    try {
      const currentExpiration = selectedStudent.access_expires_at
        ? new Date(selectedStudent.access_expires_at)
        : new Date();

      const newExpiration = new Date(currentExpiration);
      newExpiration.setDate(newExpiration.getDate() + days);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          access_expires_at: newExpiration.toISOString(),
          access_status: 'active',
        })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      toast({
        title: 'Acesso prolongado!',
        description: `Acesso estendido por ${days} dias com sucesso.`,
      });

      fetchStudents();
      setShowAccessModal(false);
    } catch (error) {
      console.error('Erro ao prolongar acesso:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível prolongar o acesso.',
      });
    }
  };

  const handleSetCustomDate = async () => {
    if (!selectedStudent || !customDate) return;

    try {
      const newExpiration = new Date(customDate);
      newExpiration.setHours(23, 59, 59);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          access_expires_at: newExpiration.toISOString(),
          access_status: 'active',
        })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      toast({
        title: 'Data definida!',
        description: 'Data de expiração atualizada com sucesso.',
      });

      fetchStudents();
      setShowAccessModal(false);
    } catch (error) {
      console.error('Erro ao definir data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível definir a data de expiração.',
      });
    }
  };

  const handleSuspendAccess = async () => {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          access_status: 'suspended',
        })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      toast({
        title: 'Acesso suspenso!',
        description: 'O acesso do aluno foi suspenso.',
      });

      fetchStudents();
      setShowAccessModal(false);
    } catch (error) {
      console.error('Erro ao suspender acesso:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível suspender o acesso.',
      });
    }
  };

  const handleReactivateAccess = async () => {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          access_status: 'active',
        })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      toast({
        title: 'Acesso reativado!',
        description: 'O acesso do aluno foi reativado.',
      });

      fetchStudents();
      setShowAccessModal(false);
    } catch (error) {
      console.error('Erro ao reativar acesso:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível reativar o acesso.',
      });
    }
  };

  const getStatusBadge = (student) => {
    const status = student.access_status;
    const expiresAt = student.access_expires_at
      ? new Date(student.access_expires_at)
      : null;
    const now = new Date();

    if (status === 'suspended') {
      return (
        <Badge className='bg-orange-500 text-white'>
          <AlertCircle className='mr-1 h-3 w-3' />
          Suspenso
        </Badge>
      );
    }

    if (!expiresAt) {
      return (
        <Badge className='bg-green-500 text-white'>
          <CheckCircle className='mr-1 h-3 w-3' />
          Ilimitado
        </Badge>
      );
    }

    if (expiresAt < now || status === 'expired') {
      return (
        <Badge className='bg-red-500 text-white'>
          <XCircle className='mr-1 h-3 w-3' />
          Expirado
        </Badge>
      );
    }

    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 7) {
      return (
        <Badge className='bg-yellow-500 text-white'>
          <Clock className='mr-1 h-3 w-3' />
          {daysRemaining} dias
        </Badge>
      );
    }

    return (
      <Badge className='bg-green-500 text-white'>
        <CheckCircle className='mr-1 h-3 w-3' />
        Ativo
      </Badge>
    );
  };

  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const expiration = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredStudents = students.filter((student) =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Filtered students:', filteredStudents);
  console.log('Loading:', loading);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando alunos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <Users className='h-8 w-8 text-cyan-600' />
          <h1 className='text-3xl font-bold text-gray-900'>Gerenciar Alunos</h1>
        </div>
        <p className='text-gray-600'>
          Visualize e gerencie o acesso de todos os alunos
        </p>
      </div>

      {/* Busca */}
      <Card className='mb-6'>
        <CardContent className='pt-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Buscar por nome...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      <Card>
        <CardContent className='pt-6'>
          <div className='mb-4'>
            <p className='text-sm text-gray-600'>
              Total de alunos:{' '}
              <span className='font-semibold'>{students.length}</span>
            </p>
          </div>

          {filteredStudents.length === 0 ? (
            <div className='text-center py-12'>
              <Users className='h-12 w-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-500'>Nenhum aluno encontrado</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-start gap-4 flex-1'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback className='bg-cyan-100 text-cyan-700'>
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-semibold text-gray-900'>
                            {student.full_name || 'Nome não definido'}
                          </h3>
                          {getStatusBadge(student)}
                        </div>

                        <div className='space-y-1 text-sm text-gray-600'>
                          <p className='flex items-center gap-2'>
                            <Mail className='h-3 w-3' />
                            {student.user_id}
                          </p>
                          {student.access_expires_at && (
                            <p className='flex items-center gap-2'>
                              <Calendar className='h-3 w-3' />
                              Expira em:{' '}
                              {new Date(
                                student.access_expires_at
                              ).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {calculateDaysRemaining(student.access_expires_at) !==
                            null && (
                            <p className='flex items-center gap-2'>
                              <Clock className='h-3 w-3' />
                              {calculateDaysRemaining(
                                student.access_expires_at
                              )}{' '}
                              dias restantes
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewDetails(student)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleEditAccess(student)}
                      >
                        <Edit className='h-4 w-4 mr-2' />
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage src={selectedStudent.avatar_url} />
                  <AvatarFallback className='bg-cyan-100 text-cyan-700 text-lg'>
                    {getInitials(selectedStudent.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-semibold text-lg'>
                    {selectedStudent.full_name || 'Nome não definido'}
                  </h3>
                  {getStatusBadge(selectedStudent)}
                </div>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='flex items-center gap-2 text-gray-700'>
                  <User className='h-4 w-4 text-gray-500' />
                  <span className='font-medium'>ID:</span>
                  <span className='text-gray-600'>
                    {selectedStudent.user_id}
                  </span>
                </div>

                {selectedStudent.access_expires_at && (
                  <div className='flex items-center gap-2 text-gray-700'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span className='font-medium'>Expira em:</span>
                    <span className='text-gray-600'>
                      {new Date(
                        selectedStudent.access_expires_at
                      ).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {calculateDaysRemaining(selectedStudent.access_expires_at) !==
                  null && (
                  <div className='flex items-center gap-2 text-gray-700'>
                    <Clock className='h-4 w-4 text-gray-500' />
                    <span className='font-medium'>Dias restantes:</span>
                    <span className='text-gray-600'>
                      {calculateDaysRemaining(
                        selectedStudent.access_expires_at
                      )}
                    </span>
                  </div>
                )}

                <div className='flex items-center gap-2 text-gray-700'>
                  <Shield className='h-4 w-4 text-gray-500' />
                  <span className='font-medium'>Status:</span>
                  <span className='text-gray-600'>
                    {selectedStudent.access_status === 'active'
                      ? 'Ativo'
                      : selectedStudent.access_status === 'expired'
                      ? 'Expirado'
                      : 'Suspenso'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Acesso */}
      <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Gerenciar Acesso</DialogTitle>
            <DialogDescription>
              {selectedStudent?.full_name || 'Nome não definido'}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className='space-y-6'>
              {/* Status Atual */}
              <div className='bg-gray-50 p-4 rounded-lg'>
                <p className='text-sm font-medium text-gray-700 mb-2'>
                  Status Atual
                </p>
                <div className='flex items-center gap-3'>
                  {getStatusBadge(selectedStudent)}
                  {selectedStudent.access_expires_at && (
                    <span className='text-sm text-gray-600'>
                      até{' '}
                      {new Date(
                        selectedStudent.access_expires_at
                      ).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {/* Prolongar Acesso */}
              <div>
                <p className='text-sm font-medium text-gray-700 mb-3'>
                  Prolongar Acesso
                </p>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExtendAccess(7)}
                  >
                    +7 dias
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExtendAccess(15)}
                  >
                    +15 dias
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExtendAccess(30)}
                  >
                    +30 dias
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleExtendAccess(90)}
                  >
                    +90 dias
                  </Button>
                </div>
              </div>

              {/* Data Personalizada */}
              <div>
                <p className='text-sm font-medium text-gray-700 mb-3'>
                  Definir Data Personalizada
                </p>
                <div className='flex gap-2'>
                  <Input
                    type='date'
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <Button onClick={handleSetCustomDate}>Definir</Button>
                </div>
              </div>

              {/* Ações de Suspensão */}
              <div className='border-t pt-4'>
                <p className='text-sm font-medium text-gray-700 mb-3'>
                  Ações de Controle
                </p>
                <div className='flex gap-2'>
                  {selectedStudent.access_status === 'suspended' ? (
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={handleReactivateAccess}
                    >
                      <PlayCircle className='h-4 w-4 mr-2' />
                      Reativar Acesso
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={handleSuspendAccess}
                    >
                      <PauseCircle className='h-4 w-4 mr-2' />
                      Suspender Acesso
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAccessModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAlunosPage;
