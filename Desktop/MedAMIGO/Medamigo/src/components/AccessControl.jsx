import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, Clock, Mail, Phone } from 'lucide-react';

const AccessControl = ({ children }) => {
  const { user } = useAuth();
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAccess();
      checkIfAdmin();
    }
  }, [user]);

  const checkIfAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!error && data && data.some(r => r.role === 'admin')) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
    }
  };

  const checkAccess = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('access_status, access_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar acesso:', error);
        setAccessStatus('active'); // Se não tem perfil, deixa passar
        setLoading(false);
        return;
      }

      // Verifica se está suspenso
      if (data.access_status === 'suspended') {
        setAccessStatus('suspended');
        setLoading(false);
        return;
      }

      // Verifica se expirou
      if (data.access_expires_at) {
        const expirationDate = new Date(data.access_expires_at);
        const now = new Date();

        if (expirationDate < now) {
          // Atualiza status para expired no banco
          await supabase
            .from('user_profiles')
            .update({ access_status: 'expired' })
            .eq('user_id', user.id);

          setAccessStatus('expired');
          setLoading(false);
          return;
        }
      }

      setAccessStatus('active');
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      setAccessStatus('active'); // Em caso de erro, deixa passar
    } finally {
      setLoading(false);
    }
  };

  // Admin sempre tem acesso total
  if (isAdmin) {
    return children;
  }

  // Carregando
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Acesso EXPIRADO
  if (accessStatus === 'expired') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6'>
        <Card className='max-w-2xl w-full shadow-2xl border-2 border-red-200'>
          <CardHeader className='text-center bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg pb-8'>
            <div className='mx-auto mb-4 bg-white rounded-full p-4 w-20 h-20 flex items-center justify-center'>
              <AlertCircle className='h-12 w-12 text-red-500' />
            </div>
            <CardTitle className='text-3xl font-bold'>
              Acesso Expirado
            </CardTitle>
          </CardHeader>

          <CardContent className='pt-8 pb-8 space-y-6'>
            <div className='text-center space-y-4'>
              <div className='bg-red-50 border-l-4 border-red-500 p-4 rounded'>
                <p className='text-lg text-gray-800 font-semibold'>
                  Seu período de acesso à plataforma expirou.
                </p>
              </div>

              <p className='text-gray-700 text-base leading-relaxed'>
                Para continuar aproveitando todos os recursos e preparação para
                o vestibular de Medicina, entre em contato com nossa assessoria.
              </p>

              <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 my-6'>
                <div className='flex items-center justify-center gap-2 mb-3'>
                  <Clock className='h-6 w-6 text-green-600' />
                  <h3 className='text-xl font-bold text-green-800'>
                    Oferta Especial de Rematrícula!
                  </h3>
                </div>
                <p className='text-green-800 font-semibold text-lg'>
                  🎉 Desconto exclusivo para renovação imediata!
                </p>
                <p className='text-green-700 mt-2'>
                  Faça sua rematrícula agora e ganhe condições especiais para
                  continuar sua jornada rumo à aprovação.
                </p>
              </div>

              <div className='space-y-4 pt-4'>
                <h4 className='font-semibold text-gray-800 text-lg'>
                  Entre em contato conosco:
                </h4>

                <div className='grid md:grid-cols-2 gap-4'>
                  <a
                    href='mailto:contato@medamigo.com'
                    className='flex items-center gap-3 p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors border border-cyan-200'
                  >
                    <Mail className='h-6 w-6 text-cyan-600' />
                    <div className='text-left'>
                      <p className='text-sm text-gray-600'>Email</p>
                      <p className='font-semibold text-cyan-700'>
                        contato@medamigo.com
                      </p>
                    </div>
                  </a>

                  <a
                    href='https://wa.me/5511999999999'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200'
                  >
                    <Phone className='h-6 w-6 text-green-600' />
                    <div className='text-left'>
                      <p className='text-sm text-gray-600'>WhatsApp</p>
                      <p className='font-semibold text-green-700'>
                        (11) 99999-9999
                      </p>
                    </div>
                  </a>
                </div>

                <Button
                  size='lg'
                  className='w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 text-lg mt-6'
                  onClick={() =>
                    window.open(
                      'https://wa.me/5511999999999?text=Olá! Gostaria de renovar meu acesso à plataforma MedAMIGO.',
                      '_blank'
                    )
                  }
                >
                  <Phone className='mr-2 h-5 w-5' />
                  Falar com Assessoria via WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acesso SUSPENSO
  if (accessStatus === 'suspended') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-6'>
        <Card className='max-w-2xl w-full shadow-2xl border-2 border-orange-200'>
          <CardHeader className='text-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg pb-8'>
            <div className='mx-auto mb-4 bg-white rounded-full p-4 w-20 h-20 flex items-center justify-center'>
              <AlertCircle className='h-12 w-12 text-orange-500' />
            </div>
            <CardTitle className='text-3xl font-bold'>
              Acesso Suspenso
            </CardTitle>
          </CardHeader>

          <CardContent className='pt-8 pb-8 space-y-6'>
            <div className='text-center space-y-4'>
              <div className='bg-orange-50 border-l-4 border-orange-500 p-4 rounded'>
                <p className='text-lg text-gray-800 font-semibold'>
                  Seu acesso à plataforma foi temporariamente suspenso.
                </p>
              </div>

              <p className='text-gray-700 text-base leading-relaxed'>
                Para mais informações e regularização do seu acesso, entre em
                contato com nossa assessoria.
              </p>

              <div className='space-y-4 pt-4'>
                <h4 className='font-semibold text-gray-800 text-lg'>
                  Entre em contato conosco:
                </h4>

                <div className='grid md:grid-cols-2 gap-4'>
                  <a
                    href='mailto:contato@medamigo.com'
                    className='flex items-center gap-3 p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors border border-cyan-200'
                  >
                    <Mail className='h-6 w-6 text-cyan-600' />
                    <div className='text-left'>
                      <p className='text-sm text-gray-600'>Email</p>
                      <p className='font-semibold text-cyan-700'>
                        contato@medamigo.com
                      </p>
                    </div>
                  </a>

                  <a
                    href='https://wa.me/5511999999999'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200'
                  >
                    <Phone className='h-6 w-6 text-green-600' />
                    <div className='text-left'>
                      <p className='text-sm text-gray-600'>WhatsApp</p>
                      <p className='font-semibold text-green-700'>
                        (11) 99999-9999
                      </p>
                    </div>
                  </a>
                </div>

                <Button
                  size='lg'
                  className='w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-6 text-lg mt-6'
                  onClick={() =>
                    window.open(
                      'https://wa.me/5511999999999?text=Olá! Meu acesso está suspenso e gostaria de regularizar.',
                      '_blank'
                    )
                  }
                >
                  <Phone className='mr-2 h-5 w-5' />
                  Falar com Assessoria via WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acesso ATIVO - mostra o conteúdo normal
  return children;
};

export default AccessControl;
