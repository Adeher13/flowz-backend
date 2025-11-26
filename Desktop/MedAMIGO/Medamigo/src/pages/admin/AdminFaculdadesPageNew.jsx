import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Building2,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AdminFaculdadesPageNew = () => {
  const [faculdades, setFaculdades] = useState([]);
  const [filteredFaculdades, setFilteredFaculdades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculdade, setEditingFaculdade] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    cidade: '',
    regiao: '',
    administracao: '',
    processo: '',
    mensalidade: '',
    descricao: '',
    aceita_fies: false,
    aceita_estrangeiro: false,
  });
  const { toast } = useToast();

  const estados = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  const regioes = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
  const tiposAdministracao = ['Pública', 'Privada'];
  const tiposProcesso = [
    'Prova',
    'Análise Curricular',
    'ENEM',
    'Prova e Análise Curricular',
  ];

  // Carregar faculdades do banco
  useEffect(() => {
    loadFaculdades();
  }, []);

  // Filtrar faculdades
  useEffect(() => {
    let result = [...faculdades];

    if (searchTerm) {
      result = result.filter(
        (fac) =>
          fac.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fac.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterEstado) {
      result = result.filter((fac) => fac.sigla === filterEstado);
    }

    if (filterAdmin) {
      result = result.filter((fac) => fac.administracao === filterAdmin);
    }

    setFilteredFaculdades(result);
  }, [faculdades, searchTerm, filterEstado, filterAdmin]);

  const loadFaculdades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faculdades')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setFaculdades(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar faculdades',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingFaculdade(null);
    setFormData({
      nome: '',
      sigla: '',
      cidade: '',
      regiao: '',
      administracao: '',
      processo: '',
      mensalidade: '',
      descricao: '',
      aceita_fies: false,
      aceita_estrangeiro: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (faculdade) => {
    setEditingFaculdade(faculdade);
    setFormData({
      nome: faculdade.nome || '',
      sigla: faculdade.sigla || '',
      cidade: faculdade.cidade || '',
      regiao: faculdade.regiao || '',
      administracao: faculdade.administracao || '',
      processo: faculdade.processo || '',
      mensalidade: faculdade.mensalidade || '',
      descricao: faculdade.descricao || '',
      aceita_fies: faculdade.aceita_fies || false,
      aceita_estrangeiro: faculdade.aceita_estrangeiro || false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.nome || !formData.sigla || !formData.cidade) {
        toast({
          variant: 'destructive',
          title: 'Campos obrigatórios',
          description: 'Preencha nome, estado e cidade',
        });
        return;
      }

      console.log('💾 Salvando faculdade:', formData);
      console.log('✏️ Editando:', editingFaculdade);

      if (editingFaculdade) {
        // Atualizar
        const { data, error } = await supabase
          .from('faculdades')
          .update(formData)
          .eq('id', editingFaculdade.id)
          .select();

        console.log('📝 Resultado update:', { data, error });

        if (error) throw error;

        toast({
          title: 'Faculdade atualizada',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        // Inserir
        const { data, error } = await supabase
          .from('faculdades')
          .insert([formData])
          .select();

        console.log('➕ Resultado insert:', { data, error });

        if (error) throw error;

        toast({
          title: 'Faculdade adicionada',
          description: 'Nova faculdade cadastrada com sucesso',
        });
      }

      setModalOpen(false);
      await loadFaculdades();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    }
  };

  const handleDelete = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;

    try {
      const { error } = await supabase.from('faculdades').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Faculdade excluída',
        description: 'A faculdade foi removida do banco de dados',
      });

      loadFaculdades();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-cyan-600' />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Faculdades - AmigoMeD!</title>
      </Helmet>

      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Gerenciar Faculdades
            </h1>
            <p className='text-gray-500 mt-1'>
              Total: {filteredFaculdades.length} faculdades
            </p>
          </div>
          <Button onClick={openAddModal} className='gap-2'>
            <PlusCircle className='h-5 w-5' />
            Adicionar Faculdade
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label>Buscar</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Nome ou cidade...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <div>
                <Label>Estado</Label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className='w-full h-10 px-3 rounded-md border border-gray-300 bg-white'
                >
                  <option value=''>Todos os estados</option>
                  {estados.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Administração</Label>
                <select
                  value={filterAdmin}
                  onChange={(e) => setFilterAdmin(e.target.value)}
                  className='w-full h-10 px-3 rounded-md border border-gray-300 bg-white'
                >
                  <option value=''>Todos os tipos</option>
                  <option value='Pública'>Pública</option>
                  <option value='Privada'>Privada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Faculdades */}
        <div className='grid gap-4'>
          {filteredFaculdades.map((fac) => (
            <Card key={fac.id} className='hover:shadow-md transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <Building2 className='h-5 w-5 text-cyan-600' />
                      <h3 className='text-lg font-semibold'>{fac.nome}</h3>
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm'>
                      <div>
                        <p className='text-gray-500 flex items-center gap-2'>
                          <MapPin className='h-4 w-4' />
                          Localização
                        </p>
                        <p className='font-medium'>
                          {fac.cidade}, {fac.sigla}
                        </p>
                      </div>
                      <div>
                        <p className='text-gray-500'>Região</p>
                        <p className='font-medium'>{fac.regiao || 'N/A'}</p>
                      </div>
                      <div>
                        <p className='text-gray-500'>Tipo</p>
                        <Badge
                          variant={
                            fac.administracao === 'Pública'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {fac.administracao}
                        </Badge>
                      </div>
                      <div>
                        <p className='text-gray-500'>Processo</p>
                        <p className='font-medium text-xs'>
                          {fac.processo || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-gray-500'>Aceita Exterior</p>
                        <p className='font-medium'>
                          {fac.aceita_estrangeiro ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>

                    {/* Mensalidade */}
                    {fac.mensalidade && (
                      <div className='mt-4 pt-4 border-t'>
                        <p className='text-sm text-gray-500'>Mensalidade</p>
                        <p className='font-semibold text-green-600'>
                          {fac.mensalidade}
                        </p>
                      </div>
                    )}

                    {/* Descrição */}
                    {fac.descricao && (
                      <div className='mt-3'>
                        <p className='text-sm text-gray-500 mb-1'>
                          Sobre a Instituição
                        </p>
                        <p className='text-sm text-gray-700 line-clamp-2'>
                          {fac.descricao}
                        </p>
                      </div>
                    )}

                    <div className='flex gap-3 mt-3'>
                      {fac.aceita_fies && (
                        <Badge variant='outline' className='text-xs'>
                          FIES
                        </Badge>
                      )}
                      {fac.aceita_estrangeiro && (
                        <Badge
                          variant='outline'
                          className='text-xs bg-blue-50 text-blue-700 border-blue-200'
                        >
                          Aceita Estrangeiros
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => openEditModal(fac)}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleDelete(fac.id, fac.nome)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFaculdades.length === 0 && (
          <Card>
            <CardContent className='py-12 text-center'>
              <GraduationCap className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500'>Nenhuma faculdade encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingFaculdade ? 'Editar Faculdade' : 'Adicionar Faculdade'}
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Nome da Instituição *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder='Ex: Universidade Federal...'
                />
              </div>
              <div>
                <Label>Cidade *</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                  placeholder='Ex: São Paulo'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Estado (UF) *</Label>
                <select
                  value={formData.sigla}
                  onChange={(e) =>
                    setFormData({ ...formData, sigla: e.target.value })
                  }
                  className='w-full h-10 px-3 rounded-md border border-gray-300 bg-white'
                >
                  <option value=''>Selecione</option>
                  {estados.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Região</Label>
                <select
                  value={formData.regiao}
                  onChange={(e) =>
                    setFormData({ ...formData, regiao: e.target.value })
                  }
                  className='w-full h-10 px-3 rounded-md border border-gray-300 bg-white'
                >
                  <option value=''>Selecione</option>
                  {regioes.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Administração</Label>
                <select
                  value={formData.administracao}
                  onChange={(e) =>
                    setFormData({ ...formData, administracao: e.target.value })
                  }
                  className='w-full h-10 px-3 rounded-md border border-gray-300 bg-white'
                >
                  <option value=''>Selecione</option>
                  {tiposAdministracao.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Processo Seletivo</Label>
                <select
                  value={formData.processo}
                  onChange={(e) =>
                    setFormData({ ...formData, processo: e.target.value })
                  }
                  className='w-full h-10 px-3 rounded-md border border-gray-300 bg-white'
                >
                  <option value=''>Selecione</option>
                  {tiposProcesso.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Mensalidade</Label>
              <Input
                value={formData.mensalidade}
                onChange={(e) =>
                  setFormData({ ...formData, mensalidade: e.target.value })
                }
                placeholder='Ex: R$ 3.500,00 ou Gratuita'
              />
            </div>

            <div>
              <Label>Descrição da Instituição</Label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder='Descreva os diferenciais, infraestrutura, reconhecimentos...'
                className='w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 bg-white resize-y'
                rows={4}
              />
            </div>

            <div className='flex gap-6'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.aceita_fies}
                  onChange={(e) =>
                    setFormData({ ...formData, aceita_fies: e.target.checked })
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm'>Aceita FIES</span>
              </label>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.aceita_estrangeiro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aceita_estrangeiro: e.target.checked,
                    })
                  }
                  className='w-4 h-4'
                />
                <span className='text-sm'>Aceita Estrangeiros</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingFaculdade ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminFaculdadesPageNew;
