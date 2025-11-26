import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const AdminCriarSimuladoPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nomeFaculdade: '',
    duracaoMinutos: '',
    ativo: true,
    disciplinas: {},
  });
  const [disciplinas, setDisciplinas] = useState([]);

  React.useEffect(() => {
    const fetchDisciplinas = async () => {
      const { data, error } = await supabase
        .from('questoes')
        .select('disciplina')
        .limit(1000);
      if (error) return setDisciplinas([]);
      // Padronizar e ordenar
      const unicas = [
        ...new Set(
          data
            .map((q) =>
              q.disciplina ? q.disciplina.trim().toUpperCase() : null
            )
            .filter(Boolean)
        ),
      ].sort();
      setDisciplinas(unicas);
    };
    fetchDisciplinas();
  }, []);

  const handleDisciplinaChange = (disciplina, value) => {
    setFormData({
      ...formData,
      disciplinas: {
        ...formData.disciplinas,
        [disciplina]: value,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Simulado criado!',
      description: 'O simulado foi criado com sucesso.',
    });
    // Aqui você pode adicionar a lógica de salvar no backend
    setFormData({
      nomeFaculdade: '',
      duracaoMinutos: '',
      ativo: true,
      disciplinas: {},
    });
  };

  return (
    <div className='max-w-3xl mx-auto px-4 py-10'>
      <Helmet>
        <title>Criar Novo Simulado - Admin</title>
      </Helmet>
      <Card className='shadow-2xl rounded-3xl border border-cyan-200 bg-white'>
        <CardHeader>
          <CardTitle className='text-3xl text-cyan-700 font-bold'>
            Criar Novo Simulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <Label htmlFor='nomeFaculdade'>Nome da Faculdade *</Label>
                <Input
                  id='nomeFaculdade'
                  placeholder='Ex: UNIBH, UFMG, PUC Minas'
                  value={formData.nomeFaculdade}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeFaculdade: e.target.value })
                  }
                  required
                  className='mt-2'
                />
              </div>
              <div>
                <Label htmlFor='duracaoMinutos'>Duração (min) *</Label>
                <Input
                  id='duracaoMinutos'
                  type='number'
                  min='1'
                  placeholder='120'
                  value={formData.duracaoMinutos}
                  onChange={(e) =>
                    setFormData({ ...formData, duracaoMinutos: e.target.value })
                  }
                  required
                  className='mt-2'
                />
              </div>
            </div>
            <div>
              <Label className='font-semibold'>
                Disciplinas e Quantidade de Questões *
              </Label>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mt-2'>
                {disciplinas.map((disciplina) => (
                  <div key={disciplina} className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={0}
                      placeholder='Qtd.'
                      value={formData.disciplinas[disciplina] || ''}
                      onChange={(e) =>
                        handleDisciplinaChange(disciplina, e.target.value)
                      }
                      className='w-20'
                    />
                    <span className='text-gray-700'>{disciplina}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='mb-4'>
              <Label className='font-semibold'>
                Disciplinas carregadas do banco:
              </Label>
              <div className='flex flex-wrap gap-2 mt-2'>
                {disciplinas.map((disciplina, idx) => (
                  <span
                    key={idx}
                    className='px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs font-mono'
                  >
                    {disciplina}
                  </span>
                ))}
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='ativo'
                checked={formData.ativo}
                onChange={(e) =>
                  setFormData({ ...formData, ativo: e.target.checked })
                }
                className='h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500'
              />
              <Label htmlFor='ativo' className='cursor-pointer'>
                Simulado ativo (visível para os alunos)
              </Label>
            </div>
            <div className='flex justify-end'>
              <Button
                type='submit'
                className='bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:scale-105 transition'
              >
                Criar Simulado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCriarSimuladoPage;
