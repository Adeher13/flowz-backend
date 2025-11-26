import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const MeuPerfilPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Erro ao verificar role:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se não existe perfil, criar um
        if (error.code === 'PGRST116') {
          await createProfile();
          return;
        }
        throw error;
      }

      // Verificar se o acesso expirou
      if (data.access_expires_at) {
        const expirationDate = new Date(data.access_expires_at);
        const now = new Date();
        if (expirationDate < now && data.access_status === 'active') {
          // Atualizar status para expirado
          const { data: updatedData } = await supabase
            .from('user_profiles')
            .update({ access_status: 'expired' })
            .eq('user_id', user.id)
            .select()
            .single();
          setProfile(updatedData);
        } else {
          setProfile(data);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar perfil',
        description: 'Não foi possível carregar suas informações.',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email,
            access_status: 'active',
            access_expires_at: null, // Admin deve definir
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O avatar deve ter no máximo 2MB.',
      });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem.',
      });
      return;
    }

    setUploading(true);

    try {
      // Fazer upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil com nova URL
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(updatedProfile);
      toast({
        title: 'Avatar atualizado!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar avatar',
        description: 'Não foi possível atualizar sua foto de perfil.',
      });
    } finally {
      setUploading(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!profile?.access_expires_at) return null;

    const expirationDate = new Date(profile.access_expires_at);
    const now = new Date();
    const diffTime = expirationDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getAccessStatusBadge = () => {
    if (!profile) return null;

    switch (profile.access_status) {
      case 'active':
        return (
          <Badge className='bg-green-500'>
            <CheckCircle className='mr-1 h-3 w-3' />
            Ativo
          </Badge>
        );
      case 'expired':
        return (
          <Badge className='bg-red-500'>
            <XCircle className='mr-1 h-3 w-3' />
            Expirado
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className='bg-yellow-500'>
            <AlertCircle className='mr-1 h-3 w-3' />
            Suspenso
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining();
  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Helmet>
        <title>Meu Perfil - AmigoMeD!</title>
      </Helmet>

      <div className='p-6 max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Meu Perfil</h1>
          <p className='text-gray-600'>
            Gerencie suas informações e configurações de conta
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          {/* Avatar Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className='text-center'>Foto de Perfil</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col items-center'>
                <div className='relative'>
                  <Avatar className='h-32 w-32'>
                    <AvatarImage
                      src={profile?.avatar_url}
                      alt={profile?.full_name}
                    />
                    <AvatarFallback className='text-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white'>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor='avatar-upload'
                    className='absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 cursor-pointer transition-colors'
                  >
                    <Camera className='h-4 w-4' />
                  </Label>
                  <Input
                    id='avatar-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>
                <p className='text-sm text-gray-500 mt-4 text-center'>
                  Clique no ícone para alterar
                </p>
                {uploading && (
                  <p className='text-sm text-cyan-600 mt-2'>Enviando...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <div className='md:col-span-2 space-y-6'>
            {/* Dados Pessoais */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='h-5 w-5' />
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label className='text-gray-600'>Nome Completo</Label>
                    <p className='text-lg font-semibold'>
                      {profile?.full_name}
                    </p>
                  </div>
                  <div>
                    <Label className='text-gray-600'>E-mail</Label>
                    <p className='text-lg font-semibold'>{user?.email}</p>
                  </div>
                  {isAdmin && (
                    <Badge className='bg-purple-500'>Administrador</Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Status de Acesso */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    Status de Acesso
                  </CardTitle>
                  <CardDescription>
                    Informações sobre seu acesso à plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-gray-600'>Status Atual</Label>
                    {getAccessStatusBadge()}
                  </div>

                  {profile?.access_expires_at ? (
                    <>
                      <div>
                        <Label className='text-gray-600'>
                          Data de Expiração
                        </Label>
                        <p className='text-lg font-semibold flex items-center gap-2'>
                          <Calendar className='h-4 w-4' />
                          {new Date(
                            profile.access_expires_at
                          ).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      {daysRemaining !== null && (
                        <div>
                          <Label className='text-gray-600'>
                            Dias Restantes
                          </Label>
                          <p
                            className={`text-3xl font-bold ${
                              daysRemaining > 30
                                ? 'text-green-600'
                                : daysRemaining > 7
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {daysRemaining > 0 ? daysRemaining : 0} dias
                          </p>
                        </div>
                      )}

                      {daysRemaining !== null &&
                        daysRemaining <= 7 &&
                        daysRemaining > 0 && (
                          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                            <div className='flex items-start gap-2'>
                              <AlertCircle className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                              <div>
                                <p className='text-sm font-semibold text-yellow-800'>
                                  Seu acesso está próximo do vencimento
                                </p>
                                <p className='text-sm text-yellow-700 mt-1'>
                                  Entre em contato com a administração para
                                  renovar seu acesso.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      {profile.access_status === 'expired' && (
                        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                          <div className='flex items-start gap-2'>
                            <XCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                            <div>
                              <p className='text-sm font-semibold text-red-800'>
                                Acesso Expirado
                              </p>
                              <p className='text-sm text-red-700 mt-1'>
                                Seu acesso à plataforma expirou. Entre em
                                contato com a administração para renovar.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                      <div className='flex items-start gap-2'>
                        <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
                        <div>
                          <p className='text-sm font-semibold text-green-800'>
                            Acesso Ilimitado
                          </p>
                          <p className='text-sm text-green-700 mt-1'>
                            Você possui acesso sem data de expiração à
                            plataforma.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeuPerfilPage;
