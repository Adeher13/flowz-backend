import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSimulations } from '@/contexts/SimulationsContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const SimulationsPage = () => {
  const { subjects } = useSimulations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMateria, setFilterMateria] = useState('todas');
  const [simulados, setSimulados] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [novoSimulado, setNovoSimulado] = useState({
    nomeFaculdade: '',
    disciplinas: {},
  });

  useEffect(() => {
    // Aqui você buscaria simulados do backend
    setSimulados([]); // Exemplo: vazio
  }, []);

  const filteredSimulados = simulados.filter(
    (simulado) =>
      simulado.nomeFaculdade
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (filterMateria === 'todas' ||
        Object.keys(simulado.disciplinas || {}).includes(filterMateria))
  );

  const materias = [
    ...new Set(simulados.flatMap((s) => Object.keys(s.disciplinas || {}))),
  ];

  return (
    <div className='max-w-5xl mx-auto px-4 py-8'>
      <Helmet>
        <title>Simulados - Aluno</title>
      </Helmet>
      <h1 className='text-3xl font-bold mb-6'>Simulados Disponíveis</h1>
      <div className='flex justify-end mb-6'>
        <Button
          size='lg'
          className='bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:scale-105 transition'
          onClick={() => setModalOpen(true)}
        >
          + Criar Novo Simulado
        </Button>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='max-w-2xl w-full p-8 rounded-2xl bg-white shadow-2xl border border-cyan-200'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-cyan-700 mb-2'>
              Criar Novo Simulado
            </DialogTitle>
            <p className='text-gray-500 mb-4'>
              Preencha os dados para criar um simulado personalizado.
            </p>
          </DialogHeader>
          <div className='space-y-6'>
            <div>
              <Label htmlFor='nomeFaculdade'>Nome da Faculdade</Label>
              <Input
                id='nomeFaculdade'
                placeholder='Digite o nome da faculdade...'
                value={novoSimulado.nomeFaculdade}
                onChange={(e) =>
                  setNovoSimulado({
                    ...novoSimulado,
                    nomeFaculdade: e.target.value,
                  })
                }
                className='mt-2'
              />
            </div>
            <div>
              <Label>Disciplinas</Label>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mt-2'>
                {subjects.map((materia) => (
                  <div key={materia} className='flex items-center gap-2'>
                    <Input
                      type='number'
                      min={0}
                      placeholder='Qtd.'
                      value={novoSimulado.disciplinas[materia] || ''}
                      onChange={(e) =>
                        setNovoSimulado({
                          ...novoSimulado,
                          disciplinas: {
                            ...novoSimulado.disciplinas,
                            [materia]: e.target.value,
                          },
                        })
                      }
                      className='w-20'
                    />
                    <span className='text-gray-700'>{materia}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className='mt-8 flex justify-between'>
            <DialogClose asChild>
              <Button variant='outline'>Cancelar</Button>
            </DialogClose>
            <Button className='bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:scale-105 transition'>
              Salvar Simulado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>Simulados</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSimulados.length === 0 ? (
            <p className='text-center text-gray-500 py-8'>
              Nenhum simulado disponível.
            </p>
          ) : (
            filteredSimulados.map((simulado) => (
              <div
                key={simulado.id}
                className='border rounded-lg p-4 mb-4'
              >
                <h2 className='font-bold text-lg'>{simulado.nomeFaculdade}</h2>
                <div className='flex flex-wrap gap-2 mt-2'>
                  {Object.entries(simulado.disciplinas || {}).map(
                    ([disc, qtd]) => (
                      <Badge key={disc} variant='outline'>
                        {disc}: {qtd}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationsPage;
