
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';

const AdminSetupPage = () => {
  const { user, isAdmin, loading: authLoading, refreshUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already admin, redirect them away from this page.
    if (!authLoading && isAdmin) {
      toast({
        title: 'Acesso de Administrador Ativo',
        description: 'Você já possui permissões de administrador.',
      });
      navigate('/admin/simulados');
    }
  }, [isAdmin, authLoading, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretKey) {
      toast({
        variant: 'destructive',
        title: 'Chave Secreta Necessária',
        description: 'Por favor, insira a chave secreta para continuar.',
      });
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('set-admin-role', {
        body: { secretKey },
      });

      if (error) {
        throw new Error(error.message || 'Ocorreu um erro desconhecido.');
      }

      // Refresh user role in context
      await refreshUserRole();

      toast({
        title: 'Sucesso!',
        description: 'Privilégios de administrador concedidos. Redirecionando...',
        className: 'bg-green-100 border-green-400 text-green-800',
      });

      setTimeout(() => navigate('/admin/simulados'), 1500);

    } catch (error) {
      const errorMessage = error.message.includes('Invalid secret key')
        ? 'A chave secreta está incorreta. Tente novamente.'
        : 'Falha ao conceder privilégios de administrador.';
      
      toast({
        variant: 'destructive',
        title: 'Erro na Ativação',
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );
  }
  
  if (!user) {
     navigate('/');
     return null;
  }

  return (
    <>
      <Helmet>
        <title>Configuração de Administrador - AmigoMeD!</title>
      </Helmet>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 mb-4">
              <ShieldCheck className="h-10 w-10 text-cyan-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso de Administrador</CardTitle>
            <CardDescription>
              Insira a chave secreta para obter privilégios de administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="secret-key" className="flex items-center">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Chave Secreta
                </Label>
                <Input
                  id="secret-key"
                  type="password"
                  placeholder="••••••••••••"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  disabled={loading}
                  className="text-lg"
                />
              </div>
              <Button type="submit" className="w-full text-lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  'Conceder Acesso'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminSetupPage;
